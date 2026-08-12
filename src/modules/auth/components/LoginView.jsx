import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useStore } from '@/context/store-context';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertCircle, Loader2, Mail, ArrowRight } from 'lucide-react';

export const LoginView = () => {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useStore();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'google'

  const errorParam = searchParams.get('error');
  const emailParam = searchParams.get('email');
  const msgParam = searchParams.get('msg');

  let bannerMessage = '';
  if (errorParam === 'unauthorized') {
    bannerMessage = emailParam
      ? `The account (${emailParam}) is not registered in SDS EMS database.`
      : 'This email is not registered with SDS EMS. Contact your administrator.';
  } else if (errorParam === 'db_error') {
    bannerMessage = `Database Access Error: ${msgParam || 'Unable to read employee record due to Supabase RLS security policies.'}`;
  } else if (errorParam === 'oauth_error') {
    bannerMessage = `Google OAuth Error: ${msgParam || 'Authentication denied or invalid authorization code.'}`;
  } else if (errorParam === 'timeout') {
    bannerMessage = msgParam ? `Session Warning: ${msgParam}` : 'Google OAuth session timed out. Please use Email SSO or try again.';
  } else if (errorParam === 'no_email') {
    bannerMessage = 'No email address was provided by your Google sign-in profile.';
  } else if (errorParam) {
    bannerMessage = msgParam || 'Authentication failed. Please try again.';
  }



  const handleDirectEmailLogin = async (e, directEmail) => {
    if (e) e.preventDefault();
    const targetEmail = (directEmail || emailInput).trim().toLowerCase();

    if (!targetEmail) {
      setErrorMessage('Please enter an authorized SDS email address.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Attempt querying SDS_Employees table in Supabase
      let employee = null;
      try {
        const { data: sdsRows } = await supabase
          .from('SDS_Employees')
          .select('*')
          .ilike('email', targetEmail)
          .limit(1);

        if (sdsRows && sdsRows.length > 0) {
          employee = sdsRows.find(
            (emp) => emp.is_active !== false && emp.email?.trim().toLowerCase() === targetEmail
          );
        }
      } catch (dbErr) {
        // Silent query fallback
      }



      if (!employee) {
        setErrorMessage(`The email "${targetEmail}" is not registered in SDS EMS. Contact your administrator.`);
        setLoading(false);
        return;
      }

      const userRole = (employee.role || 'employee').toLowerCase();
      const authPayload = {
        id: employee.id || employee.auth_id || 'emp-sds',
        auth_id: employee.auth_id || employee.id || 'auth-sds',
        email: targetEmail,
        role: userRole,
        full_name: employee.full_name || targetEmail,
        department: employee.department || 'Staff',
        avatarStyle: employee.avatar_style,
        avatarSeed: employee.avatar_seed,
        avatar: employee.avatar
      };

      setAuthenticatedUser(authPayload);

      if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setErrorMessage('Failed to sign in. Please check network connection.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
      }
    } catch (err) {
      setErrorMessage('Failed to initiate Google sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6 z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 items-center justify-center font-bold text-lg shadow-md tracking-wider">
            SDS
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">SDS EMS</h1>
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
              Spirit Data Solutions Employee Portal
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-xl bg-card border border-border p-6 shadow-xl space-y-5">
          <div className="space-y-1 border-b border-border pb-3">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Internal Single Sign-On (SSO)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Access is available 24/7 for registered Spirit Data Solutions personnel.
            </p>
          </div>

          {/* Error Message Banners */}
          {bannerMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{bannerMessage}</span>
            </div>
          )}

          {errorMessage && !bannerMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Login Method Tabs */}
          <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-lg text-xs font-medium">
            <button
              type="button"
              className={`py-1.5 rounded-md transition-all ${
                loginMethod === 'email'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setLoginMethod('email')}
            >
              Email SSO
            </button>
            <button
              type="button"
              className={`py-1.5 rounded-md transition-all ${
                loginMethod === 'google'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setLoginMethod('google')}
            >
              Google OAuth
            </button>
          </div>

          {loginMethod === 'email' ? (
            <form onSubmit={handleDirectEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Enter Registered SDS Email</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. sardarsadiq001@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Employee Record...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>


            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Authenticate using your Google Workspace single sign-on account linked to Spirit Data Solutions.
              </p>

              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full py-3 text-xs font-semibold flex items-center justify-center gap-2.5 shadow-sm"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span>Spirit Data Solutions Internal Security Portal</span>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
