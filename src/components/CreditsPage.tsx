import React, { useState, useEffect } from 'react';
import { UserProfile, ThankYouNote } from '../types';
import {
  Heart,
  ExternalLink,
  Copy,
  Check,
  Code2,
  Cpu,
  Send,
  MessageCircle,
  Lock,
  UserPlus,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
} from 'lucide-react';

interface CreditsPageProps {
  currentUser: UserProfile | null;
  onOpenAccountModal: () => void;
  onNoteSent?: () => void;
}

const DEFAULT_NOTES: ThankYouNote[] = [
  {
    id: 'note_1',
    userId: 'usr_clover_01',
    username: 'Aethelgard',
    avatarColor: 'from-purple-500 to-violet-600',
    text: 'Such a clean aesthetic and the soft purple dark mode is so easy on the eyes. Immense gratitude to clover!',
    createdAt: '2 hours ago',
    likes: 14,
  },
  {
    id: 'note_2',
    userId: 'usr_clover_02',
    username: 'TokyoNightVibes',
    avatarColor: 'from-emerald-500 to-teal-600',
    text: 'Finally a downloader with zero ads, zero paywalls, and actual studio quality 24-bit FLAC. Big props clover!',
    createdAt: '5 hours ago',
    likes: 8,
  },
  {
    id: 'note_3',
    userId: 'usr_clover_03',
    username: 'SynthArchitect',
    avatarColor: 'from-indigo-600 to-purple-800',
    text: 'Clover had the best vision for this project. Minimalist perfection.',
    createdAt: 'Yesterday',
    likes: 21,
  },
];

export const CreditsPage: React.FC<CreditsPageProps> = ({
  currentUser,
  onOpenAccountModal,
  onNoteSent,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [userNote, setUserNote] = useState('');
  const [notesList, setNotesList] = useState<ThankYouNote[]>(DEFAULT_NOTES);

  const supportUrl = 'https://guns.lol/cloverheh';

  useEffect(() => {
    // Fetch live notes from backend
    fetch('/api/dev/notes')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.notes?.length) {
          setNotesList(data.notes);
          localStorage.setItem('clover_notes_v2', JSON.stringify(data.notes));
        }
      })
      .catch(() => {
        const saved = localStorage.getItem('clover_notes_v2');
        if (saved) {
          try {
            setNotesList(JSON.parse(saved));
          } catch (e) {
            // fallback
          }
        }
      });
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(supportUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userNote.trim()) return;

    const newNote: ThankYouNote = {
      id: `note_${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      avatarColor: currentUser.avatarColor,
      text: userNote.trim(),
      createdAt: 'Just now',
      likes: 1,
    };

    const updated = [newNote, ...notesList];
    setNotesList(updated);
    localStorage.setItem('clover_notes_v2', JSON.stringify(updated));
    setUserNote('');

    try {
      await fetch('/api/dev/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });
    } catch (e) {
      console.error('Note backend sync failed', e);
    }

    if (onNoteSent) {
      onNoteSent();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pt-6 pb-12 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs font-semibold text-purple-300 mb-3">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          <span>Project Acknowledgements & Vision</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3 whitespace-nowrap">
          Credits & Origin
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
          Clover Downloader was envisioned and conceptualized as an ultra-minimalist, soothing dark violet media sanctuary. Here is everyone who made it possible.
        </p>
      </div>

      {/* Primary Highlight: Clover's Idea & Support Link */}
      <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-br from-[#1b1037] via-[#140c2b] to-[#0e081e] p-6 sm:p-9 relative overflow-hidden shadow-2xl shadow-purple-950/40">
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍀</span>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
                Original Concept & Vision
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Idea Conceived by <span className="bg-gradient-to-r from-purple-300 via-violet-200 to-indigo-300 bg-clip-text text-transparent">clover</span>
            </h2>

            <p className="text-zinc-300 text-sm leading-relaxed">
              The entire idea for <strong>Clover Downloader</strong>—a fast, comfortable, soft dark purple platform for preserving high quality video and lossless music without clutter or paywalls—was created by <strong>clover</strong>.
            </p>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Please visit their official page and show your support for their creative concept and work:
            </p>
          </div>

          {/* Support Clover Card */}
          <div className="shrink-0 w-full md:w-auto flex flex-col gap-2.5">
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Support clover on guns.lol</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={handleCopyLink}
              className="py-2.5 px-4 rounded-xl bg-[#20153f] hover:bg-[#2c1d54] border border-purple-800/40 text-purple-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Link Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy guns.lol/cloverheh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Credits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Google AI Studio Credit */}
        <div className="p-6 rounded-2xl border border-purple-900/40 bg-[#130d24]/90 space-y-3">
          <div className="flex items-center gap-2 text-purple-300">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Google AI Studio</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Built using <strong>Google AI Studio</strong> and powered by Gemini models (<code className="text-purple-300 font-mono text-[11px]">gemini-3.8-flash</code> and <code className="text-purple-300 font-mono text-[11px]">gemini-3.1-pro-preview</code> with High Thinking Level). Provides media intelligence, acoustic search reasoning, and stream metadata verification.
          </p>
          <div className="pt-2">
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white transition-colors"
            >
              <span>Explore Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Open Source Engine Credit */}
        <div className="p-6 rounded-2xl border border-purple-900/40 bg-[#130d24]/90 space-y-3">
          <div className="flex items-center gap-2 text-purple-300">
            <Code2 className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Open-Source Technologies</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Special recognition to the broader open-source ecosystem including <strong>FFmpeg</strong>, <strong>yt-dlp</strong>, the <strong>Web Audio API</strong> standards group, <strong>Tailwind CSS</strong>, <strong>Lucide React</strong>, and <strong>Motion</strong> for fluid responsive physics.
          </p>
          <div className="pt-2 text-xs text-zinc-500 font-mono">
            MIT / Apache 2.0 Community Code
          </div>
        </div>
      </div>

      {/* Community Love & Messages to Clover (ACCOUNT REQUIRED) */}
      <div className="rounded-2xl border border-purple-900/40 bg-[#130d24]/90 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/30 pb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-purple-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Send Love & Appreciation to Clover
            </h3>
          </div>

          {/* Explicit requirement notice */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-600/40 text-[11px] font-semibold text-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Note: You must have an account to send a thank you note.</span>
          </div>
        </div>

        {/* Account check banner or form */}
        {currentUser ? (
          <form onSubmit={handleSendNote} className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-purple-300">
              <div
                className={`w-5 h-5 rounded-full bg-gradient-to-br ${currentUser.avatarColor} flex items-center justify-center text-[10px]`}
              >
                🍀
              </div>
              <span>
                Sending as <strong>@{currentUser.username}</strong>
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                required
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Write your thank you message to clover..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1b1233] border border-purple-900/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Note</span>
              </button>
            </div>
          </form>
        ) : (
          /* Locked State for Non-logged-in visitors */
          <div className="p-5 rounded-xl bg-[#1a1133] border border-purple-800/40 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-purple-900/40 border border-purple-600/30 flex items-center justify-center mx-auto text-purple-300">
              <Lock className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                Account Required to Post Appreciation
              </h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Accounts aren't needed to download videos, songs, or streaming episodes. An account is only required to post a thank-you note to Clover on this wall.
              </p>
            </div>

            <button
              onClick={onOpenAccountModal}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account or Sign In to Send Note</span>
            </button>
          </div>
        )}

        {/* Existing Community Notes List */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-purple-300">
            Community Appreciation Wall ({notesList.length})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notesList.map((note) => (
              <div
                key={note.id}
                className="p-3.5 rounded-xl bg-[#180f2d] border border-purple-900/30 space-y-2 flex flex-col justify-between"
              >
                <p className="text-xs text-zinc-300 leading-relaxed italic">
                  "{note.text}"
                </p>

                {note.reply && (
                  <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-[11px] text-purple-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-sky-400">
                      <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400/20 shrink-0" />
                      <span>Official Verified Reply from clover</span>
                    </div>
                    <p className="text-zinc-200 italic">{note.reply.text}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-purple-900/20 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-4 h-4 rounded-full bg-gradient-to-br ${note.avatarColor} flex items-center justify-center text-[8px]`}
                    >
                      🍀
                    </div>
                    <span className="font-semibold text-purple-200">@{note.username}</span>
                  </div>
                  <span className="font-mono text-zinc-500">{note.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
