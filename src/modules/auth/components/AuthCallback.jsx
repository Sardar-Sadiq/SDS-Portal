import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useStore } from '@/context/store-context';
import { Loader2 } from 'lucide-react';

/**
 * Safely decodes JWT payload (e.g. access_token) without needing an external library
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('AuthCallback: Failed to parse JWT payload', e);
    return null;
  }
}

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { setAuthenticatedUser, clearAuth } = useStore();
  const [statusMessage, setStatusMessage] = useState('Completing sign in with Google...');

  useEffect(() => {
    let isMounted = true;

    const authenticate = async () => {
      console.log('AuthCallback: Starting OAuth callback processing...');
      console.log('AuthCallback Full URL:', window.location.href);

      try {
        // 1. Check for explicit OAuth error in URL params or hash
        const searchParams = new URLSearchParams(window.location.search);
        const urlError = searchParams.get('error');
        const urlErrorDesc = searchParams.get('error_description') || searchParams.get('error_code');

        if (urlError || urlErrorDesc) {
          console.error('AuthCallback: OAuth URL error detected:', urlError, urlErrorDesc);
          await supabase.auth.signOut();
          if (clearAuth) clearAuth();
          if (isMounted) {
            navigate(`/login?error=oauth_error&msg=${encodeURIComponent(urlErrorDesc || urlError)}`, { replace: true });
          }
          return;
        }

        let userEmail = null;
        let userId = null;

        // 2. Check for Hash Fragment (#access_token=...&refresh_token=...)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token=')) {
          console.log('AuthCallback: Found access_token in URL hash fragment.');
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            // Attempt to establish Supabase session
            if (refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              }).catch((e) => console.warn('AuthCallback: setSession warning (clock skew likely):', e));
            }

            // Extract JWT payload directly to bypass gotrue-js clock skew rejection
            const jwtPayload = parseJwt(accessToken);
            if (jwtPayload?.email) {
              userEmail = jwtPayload.email.trim().toLowerCase();
              userId = jwtPayload.sub;
              console.log('AuthCallback: Extracted user from JWT hash:', userEmail, userId);
            }
          }
        }

        // 3. Check for PKCE authorization code in URL query string
        if (!userEmail) {
          const code = searchParams.get('code');
          if (code) {
            console.log('AuthCallback: Exchanging PKCE code for session...');
            if (isMounted) setStatusMessage('Exchanging security token with Google...');
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error('AuthCallback: Failed to exchange code for session:', exchangeError);
            } else if (exchangeData?.session?.user) {
              userEmail = exchangeData.session.user.email?.trim().toLowerCase();
              userId = exchangeData.session.user.id;
            }
          }
        }

        // 4. Fallback to getSession() if email not extracted yet
        if (!userEmail) {
          let attempts = 0;
          while (!userEmail && attempts < 10 && isMounted) {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.user) {
              userEmail = data.session.user.email?.trim().toLowerCase();
              userId = data.session.user.id;
              break;
            }
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        // 5. If still no user email resolved, report error
        if (!userEmail) {
          console.error('AuthCallback: No session user resolved.');
          await supabase.auth.signOut();
          if (clearAuth) clearAuth();
          if (isMounted) {
            navigate('/login?error=timeout&msg=Session+rejected.+Please+fix+system+clock+time+or+try+again.', { replace: true });
          }
          return;
        }

        console.log('AuthCallback: Resolved user email:', userEmail);
        if (isMounted) setStatusMessage(`Verifying permissions for ${userEmail}...`);

        // 6. Query SDS_Employees matching clean email
        console.log('AuthCallback: Querying SDS_Employees table...');
        const { data: sdsRows, error: sdsError } = await supabase
          .from('SDS_Employees')
          .select('*');

        if (sdsError) {
          console.error('AuthCallback: Database error on SDS_Employees:', sdsError);
          await supabase.auth.signOut();
          if (clearAuth) clearAuth();
          if (isMounted) {
            const is500 = sdsError.status === 500 || sdsError.code === '500';
            const detailMsg = is500
              ? 'Supabase 500 Internal Server Error. Please run SQL script to fix table RLS policies.'
              : sdsError.message;
            navigate(`/login?error=db_error&msg=${encodeURIComponent(detailMsg)}`, { replace: true });
          }
          return;
        }

        const employee = sdsRows?.find(
          (emp) => emp.is_active !== false && emp.email?.trim().toLowerCase() === userEmail
        );

        if (!employee) {
          console.warn(`AuthCallback: Email ${userEmail} is not registered in SDS_Employees.`);
          await supabase.auth.signOut();
          if (clearAuth) clearAuth();
          if (isMounted) {
            navigate(`/login?error=unauthorized&email=${encodeURIComponent(userEmail)}`, { replace: true });
          }
          return;
        }

        console.log('AuthCallback: Employee verified in SDS_Employees:', employee);

        // 7. Update auth_id on first login if NULL
        if (!employee.auth_id && userId) {
          if (isMounted) setStatusMessage('Linking security profile...');
          console.log(`AuthCallback: Linking auth_id (${userId}) to ${userEmail}...`);
          const { error: updateError } = await supabase
            .from('SDS_Employees')
            .update({ auth_id: userId })
            .ilike('email', userEmail);

          if (updateError) {
            console.error('AuthCallback: Failed to link auth_id in SDS_Employees:', updateError);
          } else {
            employee.auth_id = userId;
          }
        }

        const userRole = (employee.role || 'employee').toLowerCase();
        const full_name = employee.full_name || userEmail;

        const authPayload = {
          id: employee.id || userId,
          auth_id: userId,
          email: userEmail,
          role: userRole,
          full_name,
          department: employee.department || '',
          avatarStyle: employee.avatar_style,
          avatarSeed: employee.avatar_seed,
          avatar: employee.avatar
        };

        console.log('AuthCallback: Auth successful, setting user payload:', authPayload);

        if (setAuthenticatedUser) {
          setAuthenticatedUser(authPayload);
        }

        if (isMounted) {
          if (userRole === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (err) {
        console.error('AuthCallback: Unexpected error during callback processing:', err);
        await supabase.auth.signOut();
        if (clearAuth) clearAuth();
        if (isMounted) navigate(`/login?error=auth_failed&msg=${encodeURIComponent(err.message || 'Unexpected error')}`, { replace: true });
      }
    };

    authenticate();

    return () => {
      isMounted = false;
    };
  }, [navigate, setAuthenticatedUser, clearAuth]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <div className="text-center space-y-1">
        <h2 className="text-sm font-semibold tracking-wide">Authenticating SDS EMS Credentials</h2>
        <p className="text-xs text-muted-foreground">{statusMessage}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
