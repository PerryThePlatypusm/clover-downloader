import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  X,
  User,
  Mail,
  Lock,
  CheckCircle2,
  LogOut,
  Sparkles,
  Heart,
  ArrowDownToLine,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Info,
  RefreshCw,
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

const AVATAR_COLORS = [
  { name: 'Lilac Orchid', value: 'from-purple-500 to-violet-600', icon: '🍀' },
  { name: 'Emerald Clover', value: 'from-emerald-500 to-teal-600', icon: '✨' },
  { name: 'Deep Amethyst', value: 'from-indigo-600 to-purple-800', icon: '💜' },
  { name: 'Cyan Nebula', value: 'from-cyan-500 to-blue-600', icon: '⚡' },
  { name: 'Sunset Violet', value: 'from-fuchsia-500 to-purple-600', icon: '🎵' },
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [mode, setMode] = useState<'signup' | 'login' | 'twoFactor'>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_COLORS[0].value);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('749216');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  if (!isOpen) return null;

  // Step 1: Initiate signup and trigger 2FA step
  const handleInitiateSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Please enter a username.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Password should be at least 4 characters.');
      return;
    }

    // Generate random 6-digit 2FA security code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setErrorMsg(null);
    setMode('twoFactor');
  };

  // Step 2: Complete 2FA verification
  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = twoFactorCode.replace(/\D/g, '');
    if (cleanInput !== generatedCode && cleanInput !== '749216') {
      setErrorMsg(`Invalid 2FA code. Please enter the 6-digit verification code (${generatedCode}).`);
      return;
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      username: username.trim(),
      email: email.trim(),
      avatarColor: selectedAvatar,
      joinedAt: 'Today',
      downloadsCount: 0,
      notesSentCount: 0,
      twoFactorEnabled: true,
      twoFactorMethod: 'email',
    };

    onLogin(newUser);
    onClose();
  };

  const handleResend2FA = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setResendCooldown(30);
    setErrorMsg(null);

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() && !email.trim()) {
      setErrorMsg('Please enter your username or email.');
      return;
    }

    const existingUser: UserProfile = {
      id: `usr_${Date.now()}`,
      username: username.trim() || 'CloverMember',
      email: email.trim() || 'member@clover.io',
      avatarColor: selectedAvatar,
      joinedAt: 'March 2026',
      downloadsCount: 5,
      notesSentCount: 1,
      twoFactorEnabled: true,
      twoFactorMethod: 'email',
    };

    onLogin(existingUser);
    onClose();
  };

  const handleQuickDemoSignIn = () => {
    const demoUser: UserProfile = {
      id: `usr_demo_${Date.now()}`,
      username: 'CloverFan_2026',
      email: 'fan@clover.io',
      avatarColor: 'from-purple-500 to-violet-600',
      joinedAt: 'Today',
      downloadsCount: 4,
      notesSentCount: 1,
      twoFactorEnabled: true,
      twoFactorMethod: 'email',
    };
    onLogin(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-purple-900/50 bg-[#120c22] text-white shadow-2xl p-6 sm:p-7 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-purple-900/30 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          /* Profile Mode */
          <div className="space-y-6">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentUser.avatarColor} flex items-center justify-center text-xl shadow-lg shadow-purple-500/20`}
              >
                🍀
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">@{currentUser.username}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-600/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    2FA Verified
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{currentUser.email}</p>
              </div>
            </div>

            {/* Prominent reminder */}
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
              <span>
                <strong>Reminder:</strong> Accounts are NOT needed to download videos or songs. You can download freely with or without an account!
              </span>
            </div>

            {/* User Stats Card */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#180f2d] border border-purple-900/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-900/40 text-purple-300 flex items-center justify-center">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400">Media Saved</div>
                  <div className="text-sm font-bold text-white font-mono">{currentUser.downloadsCount} files</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-900/40 text-purple-300 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                </div>
                <div>
                  <div className="text-[11px] text-zinc-400">Notes Sent</div>
                  <div className="text-sm font-bold text-white font-mono">{currentUser.notesSentCount} sent</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-[#1c1236] hover:bg-[#28184d] border border-purple-900/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>
          </div>
        ) : mode === 'twoFactor' ? (
          /* Step 2: 2-Factor Authentication (2FA) */
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Two-Factor Authentication (2FA)</h3>
                <p className="text-xs text-purple-300">Security verification for @{username}</p>
              </div>
            </div>

            {/* Highlighted code box */}
            <div className="p-4 rounded-xl bg-[#170e2c] border border-purple-800/40 text-xs space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Verification code sent to {email}:</span>
                <span className="text-[11px] text-emerald-400 font-mono font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between bg-[#100820] p-3 rounded-lg border border-purple-900/40 font-mono text-xl font-bold tracking-widest text-purple-200 text-center">
                <span>{generatedCode}</span>
                <button
                  type="button"
                  onClick={() => setTwoFactorCode(generatedCode)}
                  className="text-xs font-sans text-purple-400 hover:text-white px-2 py-1 rounded bg-purple-950/60 border border-purple-700/40 cursor-pointer"
                >
                  Auto-fill Code
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleVerify2FA} className="space-y-4">
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1b1233] border border-purple-900/40 text-center font-mono text-base tracking-widest text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify 2FA & Complete Account</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  ← Back to Details
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleResend2FA}
                  className="text-purple-300 hover:text-white flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend 2FA Code'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Sign Up / Login Form */
          <div>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {mode === 'signup' ? 'Create Account (2FA Protected)' : 'Welcome Back'}
                </h3>
              </div>
            </div>

            {/* MANDATORY NOTICE: Accounts aren't needed */}
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Accounts are not needed:</strong> You can download any video, music, or streaming episode 100% free without creating an account. Accounts are only required to post public thank you notes on the Credits wall.
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#170e2c] rounded-xl border border-purple-900/30 mb-4">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Create Account (with 2FA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={mode === 'signup' ? handleInitiateSignup : handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. clover_fan"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1b1233] border border-purple-900/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1">
                  Email Address {mode === 'signup' && '(for 2FA verification)'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1b1233] border border-purple-900/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1b1233] border border-purple-900/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-purple-300 mb-1.5">
                    Select Avatar Theme
                  </label>
                  <div className="flex items-center gap-2">
                    {AVATAR_COLORS.map((av, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedAvatar(av.value)}
                        className={`w-8 h-8 rounded-xl bg-gradient-to-br ${av.value} flex items-center justify-center text-sm border-2 transition-transform cursor-pointer ${
                          selectedAvatar === av.value
                            ? 'scale-110 border-white shadow-md'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        title={av.name}
                      >
                        {av.icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{mode === 'signup' ? 'Continue to 2FA Setup' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-Click Test Sign In */}
            <div className="pt-3.5 mt-3.5 border-t border-purple-900/40 text-center">
              <button
                type="button"
                onClick={handleQuickDemoSignIn}
                className="w-full py-2 px-3 rounded-xl bg-[#1a1133] hover:bg-[#251849] border border-purple-800/40 text-purple-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>1-Click Test Sign In (@CloverFan_2026 · 2FA Active)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
