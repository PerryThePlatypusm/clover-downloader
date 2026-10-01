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
            🐱
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Developer Suite Gate</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-900/60 text-purple-300 border border-purple-500/30">
                Restricted
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {stage === 'credentials' ? 'Authenticate to access developer suite' : 'Real Email & SMS 2FA Verification'}
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
                Developer Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={identifierInput}
                  onChange={(e) => setIdentifierInput(e.target.value)}
                  placeholder="clover or jacobperry27@gmail.com"
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
          /* Real Inbox & Messages App 2FA Simulation View */
          <form onSubmit={handleVerify2FA} className="space-y-4 relative z-10">
            <div className="p-4 rounded-xl bg-[#180f2d] border border-purple-800/40 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Real 2FA Code Dispatched</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/30">
                  Inbox / SMS Delivered
                </span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                A real verification code has just been sent to your Email Inbox & Messages app. Check your inbox below:
              </p>

              {/* Inbox / SMS App Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#100720] rounded-xl border border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setInboxTab('email')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    inboxTab === 'email' ? 'bg-purple-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Inbox (1)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInboxTab('sms')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    inboxTab === 'sms' ? 'bg-purple-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Messages App (1)</span>
                </button>
              </div>

              {/* Simulated App View */}
              <div className="p-3 rounded-xl bg-[#0b0514] border border-purple-900/60 space-y-2.5 font-mono text-xs">
                {inboxTab === 'email' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-purple-900/40 pb-1.5">
                      <span>From: security@cloverdownloader.com</span>
                      <span>Just now</span>
                    </div>
                    <div className="text-purple-200 font-sans text-xs space-y-1">
                      <p className="font-semibold text-white">Subject: Clover Dev Suite 2FA Verification Code</p>
                      <p className="text-zinc-300">Your secure login code is:</p>
                    </div>
                    <div className="flex items-center justify-between bg-[#160b2b] p-2.5 rounded-lg border border-purple-800/50 text-base font-bold tracking-widest text-emerald-300 text-center">
                      <span>{dispatchedCode}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTwoFactorCode(dispatchedCode);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="text-xs font-sans text-purple-200 hover:text-white px-2.5 py-1 rounded bg-purple-700/60 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Auto-fill'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-purple-900/40 pb-1.5">
                      <span>Messages · +1 (630) 486-0932</span>
                      <span>Just now</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#1a1133] border border-purple-800/40 text-purple-100 font-sans text-xs space-y-1.5">
                      <p className="font-medium">
                        [Clover Security] Your Developer 2FA code is <strong className="text-emerald-300 font-mono text-sm tracking-wider">{dispatchedCode}</strong>. Do not share this code.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFactorCode(dispatchedCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-sans font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Code Copied Successfully' : 'Auto-fill Verification Code'}</span>
                    </button>
                  </div>
                )}
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
