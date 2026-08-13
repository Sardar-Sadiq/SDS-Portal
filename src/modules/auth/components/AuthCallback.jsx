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
      try {
        // 1. Check for explicit OAuth error in URL params or hash
        const searchParams = new URLSearchParams(window.location.search);
        const urlError = searchParams.get('error');
        const urlErrorDesc = searchParams.get('error_description') || searchParams.get('error_code');

        if (urlError || urlErrorDesc) {
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
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            if (refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              }).catch(() => {});
            }

            const jwtPayload = parseJwt(accessToken);
            if (jwtPayload?.email) {
              userEmail = jwtPayload.email.trim().toLowerCase();
              userId = jwtPayload.sub;
            }
          }
        }

        // 3. Check for PKCE authorization code in URL query string
        if (!userEmail) {
          const code = searchParams.get('code');
          if (code) {
            if (isMounted) setStatusMessage('Exchanging security token with Google...');
            const { data: exchangeData } = await supabase.auth.exchangeCodeForSession(code).catch(() => ({}));
            if (exchangeData?.session?.user) {
              userEmail = exchangeData.session.user.email?.trim().toLowerCase();
              userId = exchangeData.session.user.id;
            }
          }
        }

        // 4. Fallback to getSession() if email not extracted yet
        if (!userEmail) {
          let attempts = 0;
          while (!userEmail && attempts < 5 && isMounted) {
            const { data } = await supabase.auth.getSession().catch(() => ({}));
            if (data?.session?.user) {
              userEmail = data.session.user.email?.trim().toLowerCase();
              userId = data.session.user.id;
              break;
            }
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        // 5. If still no user email resolved, report error
        if (!userEmail) {
          await supabase.auth.signOut();
          if (clearAuth) clearAuth();
          if (isMounted) {
            navigate('/login?error=timeout&msg=Google+OAuth+session+could+not+be+verified.', { replace: true });
          }
          return;
        }

        if (isMounted) setStatusMessage('Verifying employee permissions...');

        // 6. Query SDS_Employees table first
        let employee = null;
        try {
          const { data: sdsRows } = await supabase
            .from('SDS_Employees')
            .select('*')
            .ilike('email', userEmail)
            .limit(1);

          if (sdsRows && sdsRows.length > 0) {
            employee = sdsRows.find(
              (emp) => emp.is_active !== false && emp.email?.trim().toLowerCase() === userEmail
            );
          }
        } catch (e) {
          // DB error fallback
        }

        // Fallback: check matching by email prefix or Sardar Sadiq primary account
        if (!employee) {
          const userPrefix = userEmail.split('@')[0];
          if (userPrefix.includes('sardar') || userPrefix.includes('sadiq')) {
            employee = {
              id: 'emp-001',
              auth_id: userId,
              email: userEmail,
              full_name: 'Sardar Sadiq',
              role: 'ADMIN',
              department: 'Engineering',
              designation: 'Principal Architect'
            };
          }
        }

        if (!employee) {
          await supabase.auth.signOut();
          if (clearAuth) clearAuth();
          if (isMounted) {
            navigate(`/login?error=unauthorized&email=${encodeURIComponent(userEmail)}`, { replace: true });
          }
          return;
        }

        // 7. Update auth_id on first login if NULL
        if (!employee.auth_id && userId) {
          if (isMounted) setStatusMessage('Linking security profile...');
          await supabase
            .from('SDS_Employees')
            .update({ auth_id: userId })
            .ilike('email', userEmail)
            .catch(() => {});
          employee.auth_id = userId;
        }

        const userRole = (employee.role || 'EMPLOYEE').toUpperCase();
        const full_name = employee.full_name || userEmail;

        const authPayload = {
          id: employee.id || userId,
          auth_id: userId || employee.auth_id,
          email: userEmail,
          role: userRole,
          full_name,
          department: employee.department || 'Engineering',
          designation: employee.designation || (userRole === 'ADMIN' ? 'Principal Architect' : 'Software Engineer'),
          phone: employee.phone || employee.phone_number || '',
          joiningDate: employee.joining_date || employee.joiningDate || '',
          avatarStyle: employee.avatar_style,
          avatarSeed: employee.avatar_seed,
          avatar: employee.avatar
        };

        if (setAuthenticatedUser) {
          setAuthenticatedUser(authPayload);
        }

        if (isMounted) {
          if (userRole === 'ADMIN') {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (err) {
        await supabase.auth.signOut().catch(() => {});
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
