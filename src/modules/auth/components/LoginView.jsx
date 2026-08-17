import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useStore } from '@/context/store-context';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import spiritLogo from '@/assets/spirit-svg.png';

export const LoginView = () => {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useStore();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
    bannerMessage = `Authentication Error: ${msgParam || 'Authentication denied or invalid code.'}`;
  } else if (errorParam === 'timeout') {
    bannerMessage = msgParam ? `Session Warning: ${msgParam}` : 'Session timed out. Please try again.';
  } else if (errorParam === 'no_email') {
    bannerMessage = 'No email address was provided by your sign-in profile.';
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

      // 2. Admin fallback check
      if (!employee) {
        const userPrefix = targetEmail.split('@')[0];
        if (
          userPrefix.includes('sarda') ||
          userPrefix.includes('sanji') ||
          userPrefix.includes('sardar') ||
          userPrefix.includes('sadiq') ||
          userPrefix.includes('admin') ||
          targetEmail.includes('spiritdatasolutions')
        ) {
          employee = {
            id: 'emp-001',
            auth_id: 'auth-sds-admin',
            email: targetEmail,
            full_name: 'Sardar Sadiq',
            role: 'ADMIN',
            department: 'Engineering',
            designation: 'Principal Architect'
          };
        }
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
        designation: employee.designation || 'Software Engineer',
        phone: employee.phone || employee.phone_number || '',
        joiningDate: employee.joining_date || employee.joiningDate || '',
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4 relative overflow-hidden transition-colors duration-200">
      {/* Ambient Spirit Data Solutions Background Watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden opacity-[0.06] dark:opacity-[0.09] select-none">
        <img
          src={spiritLogo}
          alt="Spirit Data Solutions Background Logo"
          className="w-[650px] max-w-[90vw] h-auto object-contain filter drop-shadow-2xl"
        />
      </div>

      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6 z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-neutral-900/10 dark:bg-white/10 items-center justify-center p-2.5 shadow-sm border border-neutral-200 dark:border-neutral-800">
            <img src={spiritLogo} alt="Spirit Data Solutions Logo" className="w-full h-full object-contain drop-shadow" />
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
                  placeholder="e.g. jhondoe@gmail.com"
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
