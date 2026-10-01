import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Lock, ShieldCheck, User, KeyRound, AlertTriangle, ArrowRight, Mail, PhoneCall } from 'lucide-react';
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
      const userProfile = await signInWithGoogleDev();
      onAuthorized(userProfile);
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed');
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
        setError(data.error || 'Incorrect 2FA verification code');
        setLoading(false);
        return;
      }

      const cloverDevUser: UserProfile = {
        id: 'usr_dev_clover',
        username: 'clover',
        email: 'jacobperry27@gmail.com',
        avatarColor: 'from-purple-500 to-violet-600',
        joinedAt: 'Dev Master',
        downloadsCount: 24,
        notesSentCount: 6,
        twoFactorEnabled: true,
        twoFactorMethod: 'authenticator',
      };

      onAuthorized(cloverDevUser);
    } catch (err) {
      setError('Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlowBeamBox className="max-w-md mx-auto my-12 animate-in zoom-in-95 duration-200" innerClassName="p-7 sm:p-9">
      <div className="relative text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-3 mb-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-300 shadow-lg shadow-purple-500/20">
            <Lock className="w-7 h-7 text-purple-400" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-600/40 text-[10px] font-bold uppercase tracking-wider text-purple-300 font-mono mb-2">
              <span>Secure Dev 2FA Gateway</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Developer Authorization
            </h2>
            <p className="text-xs text-zinc-400 mt-1.5">
              Restricted administrative environment for <strong className="text-purple-300">clover</strong>.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 relative z-10">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {stage === 'credentials' ? (
          <form onSubmit={handleVerifyCredentials} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-medium text-purple-300 mb-1">
                Developer Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={identifierInput}
                  onChange={(e) => {
                    setIdentifierInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="clover"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1a1133] border border-purple-900/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1a1133] border border-purple-900/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Continue to 2FA Verification'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 border-t border-purple-900/40">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
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
          /* 2FA Stage (Code sent to email & phone 6304860932 - NOT shown on screen) */
          <form onSubmit={handleVerify2FA} className="space-y-4 relative z-10">
            <div className="p-4 rounded-xl bg-[#180f2d] border border-purple-800/40 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>2FA Code Dispatched Securely</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                A randomized 6-digit verification code has been securely dispatched to your registered secure developer channels.
              </p>
              <div className="space-y-1.5 pt-1 font-mono text-[11px] text-purple-200">
                <div className="flex items-center gap-2 bg-[#0e071c] p-2 rounded-lg border border-purple-900/40">
                  <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">••••••••@gmail.com</span>
                </div>
                <div className="flex items-center gap-2 bg-[#0e071c] p-2 rounded-lg border border-purple-900/40">
                  <PhoneCall className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>••••••••0932</span>
                </div>
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
