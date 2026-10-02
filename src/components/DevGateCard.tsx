import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Lock, ShieldCheck, User, KeyRound, AlertTriangle, ArrowRight, Mail, PhoneCall, Inbox, MessageSquare, Copy, Check } from 'lucide-react';
import { GlowBeamBox } from './GlowBeamBox';
import { signInWithGoogleDev } from '../services/firebase';

interface DevGateCardProps {
  onAuthorized: (user: UserProfile) => void;
}

export const DevGateCard: React.FC<DevGateCardProps> = ({ onAuthorized }) => {
  const [identifierInput, setIdentifierInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [stage, setStage] = useState<'credentials' | 'twoFactor'>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [maskedDestination, setMaskedDestination] = useState('jacobperry27@gmail.com & +1 (630) 486-0932');
  const [dispatchedCode, setDispatchedCode] = useState('749216');
  const [inboxTab, setInboxTab] = useState<'email' | 'sms'>('email');
  const [copied, setCopied] = useState(false);

  const handleVerifyCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/dev/request-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifierInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Wrong username or password');
        setLoading(false);
        return;
      }

      if (data.maskedDestination) {
        setMaskedDestination(data.maskedDestination);
      }
      if (data.dispatchedCode) {
        setDispatchedCode(data.dispatchedCode);
      }

      setStage('twoFactor');
    } catch (err) {
      setError('Wrong username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithGoogleDev();
      onAuthorized(user);
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/dev/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFactorCode.trim() }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Incorrect verification code');
        setLoading(false);
        return;
      }

      const cloverUser: UserProfile = {
        id: 'usr_clover_dev_01',
        username: 'clover',
        email: 'jacobperry27@gmail.com',
        avatarColor: 'from-purple-500 to-indigo-600',
        joinedAt: 'March 2026',
        downloadsCount: 142,
        notesSentCount: 12,
        twoFactorEnabled: true,
        twoFactorMethod: 'email',
        role: 'owner',
      };

      onAuthorized(cloverUser);
    } catch (err) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlowBeamBox className="max-w-md mx-auto my-12" innerClassName="p-6 sm:p-8">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-2xl shadow-lg shadow-purple-600/30">
            🔒
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Dev Login</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-900/60 text-purple-300 border border-purple-500/30">
                Restricted
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {stage === 'credentials' ? 'Authenticate to access dev page' : 'Real Email & SMS 2FA Verification'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {stage === 'credentials' ? (
          <form onSubmit={handleVerifyCredentials} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-medium text-purple-300 mb-1">
                Input username or email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={identifierInput}
                  onChange={(e) => setIdentifierInput(e.target.value)}
                  placeholder="username or email"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1a1133] border border-purple-900/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-300 mb-1">
                Developer Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1a1133] border border-purple-900/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Continue to Real 2FA Verification'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 border-t border-purple-900/40">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in with Google (Firebase Auth)</span>
              </button>
            </div>
          </form>
        ) : (
          /* Real Email Verification Notice & Resend Code */
          <form onSubmit={handleVerify2FA} className="space-y-4 relative z-10">
            <div className="p-4 rounded-xl bg-[#180f2d] border border-purple-800/40 text-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verification Code Sent to Email</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                A 6-digit verification code has been dispatched via Resend to <strong className="text-white font-mono">jacobperry27@gmail.com</strong>. Please check your inbox and enter the code below.
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-400">Didn't receive the email?</span>
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      const res = await fetch('/api/dev/request-2fa', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ identifier: identifierInput, password: passwordInput }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setError('A new verification code has been sent to your email.');
                      } else {
                        setError(data.error || 'Failed to resend code');
                      }
                    } catch {
                      setError('Failed to resend code');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-xs text-purple-300 hover:text-white font-semibold underline cursor-pointer"
                >
                  Resend Verification Code
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-300 mb-1">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1a1133] border border-purple-900/40 text-center font-mono text-base tracking-widest text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Verify & Enter Dev Suite'}</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setStage('credentials')}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </GlowBeamBox>
  );
};
