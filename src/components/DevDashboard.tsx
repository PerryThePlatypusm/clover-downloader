import React, { useState, useEffect } from 'react';
import { UserProfile, ThankYouNote } from '../types';
import {
  Activity,
  Music,
  Video,
  Download,
  Mail,
  Send,
  CheckCircle,
  RefreshCw,
  LogOut,
  Eye,
  ShieldCheck,
  BadgeCheck,
  HardDrive,
  MessageSquare,
  Sparkles,
  Trash2,
  UserX,
} from 'lucide-react';

interface DevDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onSwitchToLivePreview: () => void;
}

interface DevStatsData {
  totalDownloads: number;
  totalBandwidthMB: number;
  categories: {
    music: {
      total: number;
      spotify: number;
      soundcloud: number;
      applemusic: number;
      other: number;
    };
    social_video: {
      total: number;
      youtube: number;
      twitter: number;
      tiktok: number;
      instagram: number;
      reddit: number;
      facebook: number;
      other: number;
    };
  };
  recentDownloads: Array<{
    id: string;
    category: 'music' | 'social_video';
    platform: string;
    format: string;
    title: string;
    sizeMB: number;
    timestamp: string;
  }>;
}

export const DevDashboard: React.FC<DevDashboardProps> = ({
  currentUser,
  onLogout,
  onSwitchToLivePreview,
}) => {
  const [stats, setStats] = useState<DevStatsData | null>(null);
  const [notes, setNotes] = useState<ThankYouNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [emailReceipts, setEmailReceipts] = useState<Record<string, any>>({});

  const fetchDevData = async () => {
    try {
      setLoading(true);
      const [statsRes, notesRes] = await Promise.all([
        fetch('/api/dev/stats').then((r) => r.json()),
        fetch('/api/dev/notes').then((r) => r.json()),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }
      if (notesRes.success) {
        setNotes(notesRes.notes);
      }
    } catch (e) {
      console.error('Error fetching dev data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevData();
    const interval = setInterval(fetchDevData, 10000); // live sync every 10s
    return () => clearInterval(interval);
  }, []);

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/dev/notes/${noteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotes(data.notes);
      }
    } catch (e) {
      console.error('Failed to delete note', e);
    }
  };

  const handleBanUser = async (identifier: string, duration: '1h' | '24h' | '7d' | 'permanent') => {
    if (!confirm(`Are you sure you want to ban @${identifier} (${duration})?`)) return;
    try {
      const res = await fetch('/api/dev/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, duration, reason: 'Moderation action by clover' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`User @${identifier} has been banned (${duration}).`);
      }
    } catch (e) {
      console.error('Failed to ban user', e);
    }
  };
  const handleSendReply = async (noteId: string) => {
    const text = replyInputs[noteId]?.trim();
    if (!text) return;

    try {
      setSendingReply(noteId);
      const res = await fetch('/api/dev/reply-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          replyText: text,
          senderName: 'cloverdownloader',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailReceipts((prev) => ({ ...prev, [noteId]: data.emailReceipt }));
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, reply: data.note.reply } : n))
        );
        setReplyInputs((prev) => ({ ...prev, [noteId]: '' }));
      }
    } catch (e) {
      console.error('Failed to send reply', e);
    } finally {
      setSendingReply(null);
    }
  };

  return (
    <div className="space-y-8 pt-4 pb-16 animate-in fade-in duration-300">
      {/* Dev Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#170e2f] to-[#120a22] border border-purple-800/40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-purple-600/30">
            🍀
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight whitespace-nowrap">
                Clover Downloader Dev Dashboard
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-900/60 text-purple-300 border border-purple-500/30">
                Dev Admin
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Welcome back, <strong>@{currentUser.username}</strong> · 2FA Authenticated Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDevData}
            title="Refresh Live Analytics"
            className="p-2.5 rounded-xl bg-[#20143d] hover:bg-[#2c1b54] border border-purple-800/40 text-purple-200 text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onSwitchToLivePreview}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Client Downloader</span>
          </button>

          <button
            onClick={onLogout}
            className="py-2 px-3 rounded-xl bg-[#1c1236] hover:bg-[#28184d] border border-purple-900/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Site Downloads</span>
            <Download className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats?.totalDownloads || 0}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live data stream connected</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Bandwidth Processed</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats?.totalBandwidthMB || 0} <span className="text-base font-sans text-zinc-400">MB</span>
          </div>
          <div className="text-[11px] text-zinc-400">Lossless & High Bitrate Conversion</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Community Thank-You Notes</span>
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {notes.length}
          </div>
          <div className="text-[11px] text-purple-300">
            {notes.filter((n) => n.reply).length} replied by clover
          </div>
        </div>
      </div>

      {/* Category Breakdown (Music vs Social/Video) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category 1: Music Downloads */}
        <div className="p-6 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
            <div className="flex items-center gap-2 text-emerald-400">
              <Music className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">
                Music Downloads Category
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-600/30">
              {stats?.categories.music.total || 0} Total Tracks
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#180f2d] border border-purple-900/30 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-semibold text-white">Spotify</span>
              </div>
              <span className="font-mono font-bold text-purple-200">
                {stats?.categories.music.spotify || 0} downloads
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#180f2d] border border-purple-900/30 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="font-semibold text-white">SoundCloud</span>
              </div>
              <span className="font-mono font-bold text-purple-200">
                {stats?.categories.music.soundcloud || 0} downloads
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#180f2d] border border-purple-900/30 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="font-semibold text-white">Apple Music</span>
              </div>
              <span className="font-mono font-bold text-purple-200">
                {stats?.categories.music.applemusic || 0} downloads
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#180f2d] border border-purple-900/30 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span className="font-semibold text-white">Bandcamp / Web Audio</span>
              </div>
              <span className="font-mono font-bold text-purple-200">
                {stats?.categories.music.other || 0} downloads
              </span>
            </div>
          </div>
        </div>

        {/* Category 2: Social & Video Downloads */}
        <div className="p-6 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
            <div className="flex items-center gap-2 text-purple-300">
              <Video className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">
                Social & Video Category
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-600/30">
              {stats?.categories.social_video.total || 0} Total Videos
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#180f2d] border border-purple-900/30 text-xs flex justify-between items-center">
              <span className="text-red-400 font-medium">YouTube</span>
              <span className="font-mono font-bold text-white">{stats?.categories.social_video.youtube || 0}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#180f2d] border border-purple-900/30 text-xs flex justify-between items-center">
              <span className="text-purple-300 font-medium">X / Twitter</span>
              <span className="font-mono font-bold text-white">{stats?.categories.social_video.twitter || 0}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#180f2d] border border-purple-900/30 text-xs flex justify-between items-center">
              <span className="text-pink-400 font-medium">TikTok</span>
              <span className="font-mono font-bold text-white">{stats?.categories.social_video.tiktok || 0}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#180f2d] border border-purple-900/30 text-xs flex justify-between items-center">
              <span className="text-fuchsia-400 font-medium">Instagram</span>
              <span className="font-mono font-bold text-white">{stats?.categories.social_video.instagram || 0}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#180f2d] border border-purple-900/30 text-xs flex justify-between items-center">
              <span className="text-orange-400 font-medium">Reddit</span>
              <span className="font-mono font-bold text-white">{stats?.categories.social_video.reddit || 0}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#180f2d] border border-purple-900/30 text-xs flex justify-between items-center">
              <span className="text-blue-400 font-medium">Facebook</span>
              <span className="font-mono font-bold text-white">{stats?.categories.social_video.facebook || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Community Notes & Email Reply Portal */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">
                Community Notes & User Email Reply Portal
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Replies are dispatched as an email from <code className="text-purple-300 font-mono">cloverdownloader@clover.io</code> and posted to the site wall.
            </p>
          </div>

          <span className="text-xs text-purple-300 font-mono">
            {notes.length} total messages received
          </span>
        </div>

        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 sm:p-5 rounded-xl bg-[#180f2d] border border-purple-900/30 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${note.avatarColor} flex items-center justify-center text-[10px]`}
                  >
                    🍀
                  </div>
                  <span className="font-bold text-white">@{note.username}</span>
                  {note.email && (
                    <span className="text-zinc-500 font-mono text-[11px]">({note.email})</span>
                  )}
                </div>
                <span className="text-zinc-500 font-mono">{note.createdAt}</span>
              </div>

              {/* Message text */}
              <div className="p-3 rounded-lg bg-[#110920] border border-purple-900/20 text-xs text-zinc-300 leading-relaxed italic">
                "{note.text}"
              </div>

              {/* Existing Reply if already answered */}
              {note.reply && (
                <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-600/40 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-[11px]">
                    <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400/20 shrink-0" />
                    <span>Official Verified Reply from clover</span>
                    <span className="text-zinc-400 font-normal">· Dispatched to {note.reply.dispatchedEmail || note.email}</span>
                  </div>
                  <p className="text-zinc-200">{note.reply.text}</p>
                </div>
              )}

              {/* Email Delivery Receipt Notification */}
              {emailReceipts[note.id] && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    Email sent from <strong>{emailReceipts[note.id].from}</strong> to <strong>{emailReceipts[note.id].to}</strong>!
                  </span>
                </div>
              )}

               {/* Reply Form for Clover */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  value={replyInputs[note.id] || ''}
                  onChange={(e) =>
                    setReplyInputs((prev) => ({ ...prev, [note.id]: e.target.value }))
                  }
                  placeholder={`Reply to @${note.username} (sent via cloverdownloader@clover.io)...`}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#110920] border border-purple-900/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    disabled={sendingReply === note.id || !replyInputs[note.id]?.trim()}
                    onClick={() => handleSendReply(note.id)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-purple-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingReply === note.id ? 'Sending...' : 'Reply'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note.id)}
                    title="Delete Comment"
                    className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="relative group">
                    <button
                      type="button"
                      title="Ban User"
                      className="p-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <UserX className="w-4 h-4" />
                    </button>

                    <div className="absolute right-0 bottom-full mb-1 hidden group-hover:flex flex-col bg-[#160c2b] border border-purple-800/60 rounded-xl p-1.5 shadow-xl z-20 min-w-[120px] text-[11px]">
                      <button
                        onClick={() => handleBanUser(note.username, '1h')}
                        className="px-2.5 py-1.5 text-left hover:bg-purple-900/50 rounded text-amber-300 cursor-pointer"
                      >
                        Ban 1 Hour
                      </button>
                      <button
                        onClick={() => handleBanUser(note.username, '24h')}
                        className="px-2.5 py-1.5 text-left hover:bg-purple-900/50 rounded text-amber-300 cursor-pointer"
                      >
                        Ban 24 Hours
                      </button>
                      <button
                        onClick={() => handleBanUser(note.username, 'permanent')}
                        className="px-2.5 py-1.5 text-left hover:bg-purple-900/50 rounded text-rose-400 font-semibold cursor-pointer"
                      >
                        Ban Permanent
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
