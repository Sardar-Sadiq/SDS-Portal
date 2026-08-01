'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Shield, Lock, AlertCircle } from 'lucide-react';

export const LoginView = () => {
  const { loginWithGoogle, employees } = useStore();
  const [selectedEmail, setSelectedEmail] = useState(employees[0].email);
  const [customEmail, setCustomEmail] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    const emailToUse = useCustom ? customEmail : selectedEmail;
    
    setTimeout(async () => {
      const success = await loginWithGoogle(emailToUse);
      setLoading(false);
      if (!success) {
        setErrorMsg(`Access Denied: '${emailToUse}' is not registered in Spirit Data Solutions employee directory.`);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 text-white p-4 relative overflow-hidden">
      <div className="relative w-full max-w-md space-y-6 z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-white text-neutral-950 items-center justify-center font-bold text-lg shadow-md tracking-wider">
            SDS
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight">SDS EMS</h1>
            <p className="text-xs text-neutral-400 font-medium tracking-wide uppercase">Spirit Data Solutions Employee Portal</p>
          </div>
        </div>

        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-5">
          <div className="space-y-1 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
              <Shield className="w-3.5 h-3.5 text-neutral-400" />
              <span>Internal Single Sign-On (SSO)</span>
            </div>
            <p className="text-xs text-neutral-500">Access is restricted to authorized Spirit Data Solutions personnel.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400 block">Select Employee Account:</label>
            <select
              value={useCustom ? 'custom' : selectedEmail}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setUseCustom(true);
                } else {
                  setUseCustom(false);
                  setSelectedEmail(e.target.value);
                }
              }}
              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.email}>
                  {emp.name} — {emp.email}
                </option>
              ))}
              <option value="custom">+ Test Unauthorized Email...</option>
            </select>

            {useCustom && (
              <input
                type="email"
                placeholder="enter.unregistered@domain.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-700"
              />
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-2.5 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{loading ? 'Authenticating...' : 'Sign in with Google Workspace'}</span>
          </button>
        </div>

        <div className="text-center text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-neutral-600" />
          <span>Spirit Data Solutions Internal Security Portal</span>
        </div>
      </div>
    </div>
  );
};
