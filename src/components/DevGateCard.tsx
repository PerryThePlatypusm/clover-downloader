import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Lock, ShieldCheck, User, KeyRound, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { GlowBeamBox } from './GlowBeamBox';

interface DevGateCardProps {
  onAuthorized: (user: UserProfile) => void;
}

const AUTHORIZED_PASS = 'RAN6GBFzrHYfZncd';

export const DevGateCard: React.FC<DevGateCardProps> = ({ onAuthorized }) => {
  const [identifierInput, setIdentifierInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [stage, setStage] = useState<'credentials' | 'twoFactor'>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState('839210');

  const handleVerifyCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifierInput.trim().toLowerCase();

    // Supports both 'clover' and 'jacobperry27@gmail.com'
    const isAuthorizedUser = cleanId === 'clover' || cleanId === 'jacobperry27@gmail.com';

    if (!isAuthorizedUser) {
      setError('Access Denied: Only clover has access to the developer suite.');
      return;
    }

    if (passwordInput !== AUTHORIZED_PASS) {
      setError('Invalid password. Please check your developer passkey.');
      return;
    }

    // Advance to 2FA layer
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setError(null);
    setStage('twoFactor');
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = twoFactorCode.replace(/\D/g, '');
    if (cleanCode !== generatedCode && cleanCode !== '839210') {
      setError(`Invalid 2FA code. Please enter ${generatedCode}`);
      return;
    }

    const cloverDevUser: UserProfile = {
      id: 'usr_dev_clover',
      username: 'clover',
      email: 'clover@dev.local',
      avatarColor: 'from-purple-500 to-violet-600',
      joinedAt: 'Dev Master',
      downloadsCount: 24,
      notesSentCount: 6,
      twoFactorEnabled: true,
      twoFactorMethod: 'authenticator',
    };

    onAuthorized(cloverDevUser);
  };

  const handleAutoFillClover = () => {
    setIdentifierInput('clover');
    setPasswordInput(AUTHORIZED_PASS);
    setError(null);
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
              <span>Clover Dev Suite Gate</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Developer Authorization Required
            </h2>
            <p className="text-xs text-zinc-400 mt-1.5">
              This page is restricted to developer administration. Only <strong className="text-purple-300">clover</strong> has access.
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
                Authorized Developer Username / Email
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
                Developer Password
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Authenticate & Request 2FA</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleAutoFillClover}
                className="text-xs text-purple-400 hover:text-purple-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-fill clover's credentials</span>
              </button>
            </div>
          </form>
        ) : (
          /* 2FA Stage */
          <form onSubmit={handleVerify2FA} className="space-y-4 relative z-10">
            <div className="p-3.5 rounded-xl bg-[#180f2d] border border-purple-800/40 text-xs space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span>2FA Code for clover:</span>
                <span className="text-[11px] text-emerald-400 font-mono font-semibold">Layer 2 Active</span>
              </div>
              <div className="flex items-center justify-between bg-[#0e071c] p-2.5 rounded-lg border border-purple-900/40 font-mono text-xl font-bold tracking-widest text-purple-200">
                <span>{generatedCode}</span>
                <button
                  type="button"
                  onClick={() => setTwoFactorCode(generatedCode)}
                  className="text-xs font-sans text-purple-400 hover:text-white px-2 py-1 rounded bg-purple-950/60 border border-purple-700/40 cursor-pointer"
                >
                  Fill Code
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-300 mb-1">
                Enter 6-Digit 2FA Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder={generatedCode}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1a1133] border border-purple-900/40 text-center font-mono text-base tracking-widest text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify 2FA & Enter Dev Suite</span>
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
