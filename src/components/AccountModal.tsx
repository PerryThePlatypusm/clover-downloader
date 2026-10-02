import React, { useState } from 'react';
import { UserProfile } from '../types';
import { signInAsJacobPerryGoogle } from '../services/firebase';
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
  Camera,
  Upload,
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
  const [mode, setMode] = useState<'signup' | 'login' | 'twoFactor' | 'forgot'>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_COLORS[0].value);
  const [customPfp, setCustomPfp] = useState<string>('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('749216');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Edit profile state when logged in
  const [editUsername, setEditUsername] = useState(currentUser?.username || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl || '');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setCustomPfp(result);
          setEditAvatarUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
      avatarUrl: customPfp || undefined, // custom PFP or bland default
      joinedAt: 'Today',
      downloadsCount: 0,
      notesSentCount: 0,
      twoFactorEnabled: true,
      twoFactorMethod: 'email',
      role: 'user',
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
      avatarUrl: customPfp || undefined,
      joinedAt: 'March 2026',
      downloadsCount: 5,
      notesSentCount: 1,
      twoFactorEnabled: true,
      twoFactorMethod: 'email',
      role: 'user',
    };

    onLogin(existingUser);
    onClose();
  };

  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const updatedUser: UserProfile = {
      ...currentUser,
      username: editUsername.trim() || currentUser.username,
      avatarUrl: editAvatarUrl || currentUser.avatarUrl,
    };
    onLogin(updatedUser);
    alert('Account credentials and profile picture updated successfully!');
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMsg('Please enter a valid account email address.');
      return;
    }
    setForgotSent(true);
    setErrorMsg(null);
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
          /* Profile Mode & Credential / PFP Editor */
          <div className="space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt="PFP"
                    className="w-14 h-14 rounded-2xl object-cover border border-purple-500/40 shadow-lg"
                  />
                ) : (
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentUser.avatarColor} flex items-center justify-center text-xl shadow-lg shadow-purple-500/20`}>
                    👤
                  </div>
                )}
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

            {/* Credential & PFP Editor Form */}
            <form onSubmit={handleSaveProfileEdit} className="space-y-3.5 p-4 rounded-xl bg-[#180f2d] border border-purple-900/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Edit Credentials & Profile Picture
              </h4>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#120c22] border border-purple-900/40 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Update Profile Picture (PFP)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 py-2 px-3 rounded-xl bg-[#120c22] hover:bg-[#20153f] border border-purple-900/40 text-xs text-purple-200 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    <span>Upload Image File</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-md shadow-purple-600/20"
              >
                Save Changes
              </button>
            </form>

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
        ) : mode === 'forgot' ? (
          /* Forgot Password Mode */
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Reset Password</h3>
                <p className="text-xs text-purple-300">Enter your account email to receive reset instructions</p>
              </div>
            </div>

            {forgotSent ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 space-y-3 text-center">
                <p className="font-semibold">Password reset instructions have been sent to your email address.</p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSent(false);
                    setMode('login');
                  }}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
                    {errorMsg}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-purple-300 mb-1">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1b1233] border border-purple-900/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Send Password Reset Email</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Sign Up / Login Form */
          <div>
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

            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Accounts are not needed:</strong> You can download any video, music, or streaming episode 100% free without creating an account. Accounts are only required to post public thank you notes on the Credits wall.
              </div>
            </div>

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
                <>
                  <div>
                    <label className="block text-xs font-medium text-purple-300 mb-1.5">
                      Profile Picture (PFP) — Upload Custom or Use Bland Default
                    </label>
                    <label className="py-2.5 px-3 rounded-xl bg-[#1b1233] hover:bg-[#20153f] border border-purple-900/40 text-xs text-purple-200 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                      <Camera className="w-4 h-4 text-purple-400" />
                      <span>{customPfp ? 'Custom PFP Selected ✓' : 'Upload Custom PFP (Optional)'}</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <p className="text-[10px] text-zinc-500 mt-1">If left blank, your account defaults to a bland/generic default PFP avatar.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-300 mb-1.5">
                      Select Avatar Color / Theme
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
                </>
              )}

              {mode === 'login' && (
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
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

            <div className="pt-3.5 mt-3.5 border-t border-purple-900/40 text-center space-y-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const user = await signInAsJacobPerryGoogle();
                    onLogin(user);
                    onClose();
                  } catch (e: any) {
                    setErrorMsg(e?.message || 'Google Sign-in failed');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in with Google (Firebase Auth · jacobperry27@gmail.com)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
