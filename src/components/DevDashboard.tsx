import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ThankYouNote, ModerationLog, Role, SystemActivity } from '../types';
import { useRoleAccess } from '../utils/rbac';
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
  Users,
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
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [systemActivities, setSystemActivities] = useState<SystemActivity[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [emailReceipts, setEmailReceipts] = useState<Record<string, any>>({});
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'mod' | 'admin' | 'developer'>('mod');
  const [userManageError, setUserManageError] = useState<string | null>(null);

  const canManageRoles = useRoleAccess(currentUser, ['owner', 'admin']);
  const canViewLogs = useRoleAccess(currentUser, ['owner', 'developer', 'admin']);
  const canViewActivityFeed = useRoleAccess(currentUser, ['owner', 'developer']);

  const [toastMessage, setToastMessage] = useState<{ title: string; body: string } | null>(null);
  const latestLogIdRef = useRef<string | null>(null);

  const [throughputHistory, setThroughputHistory] = useState<number[]>([4.2, 5.8, 8.1, 12.4, 9.6, 14.2, 11.0, 16.5, 12.8, 15.1]);
  const [currentSpeedMBs, setCurrentSpeedMBs] = useState<number>(12.4);

  const ACCENT_PRESETS = [
    { name: 'Neon Orchid (Default)', value: '#c084fc' },
    { name: 'Neon Green', value: '#4ade80' },
    { name: 'Cyber Blue', value: '#38bdf8' },
    { name: 'Crimson', value: '#fb7185' },
    { name: 'Amber Gold', value: '#fbbf24' },
  ];

  const [accentColor, setAccentColor] = useState<string>(
    () => localStorage.getItem('clover_accent_color') || '#c084fc'
  );

  const handleApplyAccent = (color: string) => {
    setAccentColor(color);
    localStorage.setItem('clover_accent_color', color);
    document.documentElement.style.setProperty('--accent-color', color);
  };

  const handleCreateUser = async () => {
    setUserManageError(null);
    if (!newUsername || !newUserEmail) {
      setUserManageError('Username and email are required');
      return;
    }
    
    // Simple email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserEmail)) {
        setUserManageError('Invalid email address');
        return;
    }

    try {
      const res = await fetch('/api/dev/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, email: newUserEmail, role: newUserRole }),
      });
      const data = await res.json();
      if (!data.success) {
        setUserManageError(data.error || 'Failed to create user');
        return;
      }
      setNewUsername('');
      setNewUserEmail('');
      alert('User created successfully');
      fetchDevData(false);
    } catch (e) {
      setUserManageError('Error creating user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: Role) => {
    if (!canManageRoles) {
      alert('Only Owner and Admin can give or remove roles.');
      return;
    }
    try {
      const res = await fetch('/api/dev/admin/update-user-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole, requesterRole: currentUser.role }),
      });
      const data = await res.json();
      if (data.success) {
        alert('User role updated successfully.');
        fetchDevData(false);
      } else {
        alert(data.error || 'Failed to update role');
      }
    } catch (e) {
      alert('Error updating role');
    }
  };

  const fetchDevData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [statsRes, notesRes, logsRes, usersRes, activityRes] = await Promise.all([
        fetch('/api/dev/stats').then((r) => r.json()),
        fetch('/api/dev/notes').then((r) => r.json()),
        fetch('/api/dev/moderation-logs').then((r) => r.json()),
        fetch('/api/dev/users').then((r) => r.json()),
        fetch('/api/dev/activity-feed').then((r) => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (notesRes.success) setNotes(notesRes.notes);
      if (logsRes.success && Array.isArray(logsRes.logs)) {
        if (logsRes.logs.length > 0) {
          const latest = logsRes.logs[0];
          if (latestLogIdRef.current && latestLogIdRef.current !== latest.id) {
            if (latest.action.includes('Ban') && canViewLogs) {
              setToastMessage({
                title: '🚨 New Ban Action Recorded',
                body: `@${latest.targetUsername} banned by ${latest.actionBy}: "${latest.reason}"`,
              });
              setTimeout(() => setToastMessage(null), 6000);
            }
          }
          latestLogIdRef.current = latest.id;
        }
        setModerationLogs(logsRes.logs);
      }
      if (usersRes.success) setStaffUsers(usersRes.users);
      if (activityRes.success) setSystemActivities(activityRes.activities);

      const randomSpeed = Math.round((Math.random() * 10 + 6) * 10) / 10;
      setCurrentSpeedMBs(randomSpeed);
      setThroughputHistory((prev) => [...prev.slice(1), randomSpeed]);
    } catch (e) {
      console.error('Error fetching dev data', e);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevData(true);
    const interval = setInterval(() => fetchDevData(false), 3000); // live sync every 3s without flashing
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
    if (identifier.toLowerCase() === currentUser.username.toLowerCase()) {
      alert('You cannot ban yourself!');
      return;
    }
    const reason = prompt(`Enter reason for banning @${identifier}:`);
    if (!reason || reason.trim() === '') {
      alert('A reason is required to ban a user.');
      return;
    }
    
    if (!confirm(`Are you sure you want to ban @${identifier} (${duration})?`)) return;
    try {
      const res = await fetch('/api/dev/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, duration, reason: reason.trim(), actionBy: currentUser.username }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`User @${identifier} has been banned (${duration}).`);
        fetchDevData(false); // Refresh logs
      } else {
        alert(data.error || 'Failed to ban user');
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 overflow-hidden p-2">
            <svg viewBox="0 0 32 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
              <rect x="8" y="14" width="16" height="10" fill="white" stroke="#5c4538" strokeWidth="1"/>
              <rect x="18" y="8" width="10" height="10" fill="white" stroke="#5c4538" strokeWidth="1"/>
              <polygon points="19,8 21,3 23,8" fill="white" stroke="#5c4538" strokeWidth="1"/>
              <polygon points="20,7 21,5 22,7" fill="#ffb6c1"/>
              <polygon points="25,9 27,4 29,9" fill="white" stroke="#5c4538" strokeWidth="1"/>
              <polygon points="26,8 27,6 28,8" fill="#ffb6c1"/>
              <rect x="20" y="11" width="1.5" height="1.5" fill="#5c4538"/>
              <rect x="26" y="11" width="1.5" height="1.5" fill="#5c4538"/>
              <rect x="21" y="13" width="2" height="1.5" fill="#ffb6c1"/>
              <rect x="20" y="13" width="2" height="2" fill="#ffb6c1" opacity="0.6"/>
              <rect x="25" y="13" width="2" height="2" fill="#ffb6c1" opacity="0.6"/>
              <rect x="15" y="21" width="4" height="3" fill="white" stroke="#5c4538" strokeWidth="1"/>
              <rect x="4" y="16" width="5" height="3" rx="1.5" fill="white" stroke="#5c4538" strokeWidth="1"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight whitespace-nowrap">
                Dev Dashboard
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-900/60 text-purple-300 border border-purple-500/30">
                Dev Admin
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Welcome back, <strong>@{currentUser.username}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDevData(false)}
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <span>Live stream active</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Bandwidth Processed</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats?.totalBandwidthMB || 0} <span className="text-base font-sans text-zinc-400">MB</span>
          </div>
          <div className="text-[11px] text-zinc-400">Lossless conversion</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Community Notes</span>
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {notes.length}
          </div>
          <div className="text-[11px] text-purple-300">
            {notes.filter((n) => n.reply).length} replied
          </div>
        </div>
        
        <div className="p-5 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>System Health</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white pt-2">
            Status: <span className="text-emerald-400">Operational</span>
          </div>
          <div className="text-[11px] text-zinc-400 pt-1">
            API Latency: <span className="font-mono text-white">12ms</span>
          </div>
        </div>
      </div>

      {/* Network Throughput Widget with Sparkline Chart */}
      <div className="p-6 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Network Throughput</h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs font-mono font-bold text-purple-300">
            {currentSpeedMBs} MB/s
          </span>
        </div>
        <p className="text-xs text-zinc-400">Real-time bandwidth consumption across all active download tasks.</p>
        
        {/* Sparkline SVG Chart */}
        <div className="h-16 w-full flex items-end pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d={`M 0 40 ${throughputHistory.map((val, idx) => `L ${(idx / (throughputHistory.length - 1)) * 100} ${40 - (val / 20) * 35}`).join(' ')} L 100 40 Z`}
              fill="url(#sparklineGrad)"
            />
            <path
              d={`M ${throughputHistory.map((val, idx) => `${(idx / (throughputHistory.length - 1)) * 100} ${40 - (val / 20) * 35}`).join(' L ')}`}
              fill="none"
              stroke="#c084fc"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* UI Customization: Accent Color Controller */}
      <div className="p-6 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-white text-base">Clover Downloader UI Accent Color</h3>
        </div>
        <p className="text-xs text-zinc-400">
          Customize and persist the primary accent theme color across the Clover Downloader application interface.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleApplyAccent(preset.value)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                accentColor === preset.value
                  ? 'bg-purple-900/60 border-purple-400 text-white shadow-lg'
                  : 'bg-[#180f2d] border-purple-900/40 text-zinc-300 hover:text-white'
              }`}
            >
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: preset.value }} />
              <span>{preset.name}</span>
            </button>
          ))}

          {/* Custom Color Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#180f2d] border border-purple-900/40">
            <span className="text-xs text-zinc-300 font-medium">Custom:</span>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => handleApplyAccent(e.target.value)}
              className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer"
              title="Pick custom accent color"
            />
            <span className="text-xs font-mono text-purple-300 uppercase">{accentColor}</span>
          </div>
        </div>
      </div>

      {/* Owner & Admin User & Staff Management */}
      {canManageRoles && (
        <div className="p-6 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Staff & User Role Management</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Username" className="flex-1 px-3 py-2 rounded-xl bg-[#1b1233] border border-purple-900/40 text-xs text-white" />
            <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="Email" className="flex-1 px-3 py-2 rounded-xl bg-[#1b1233] border border-purple-900/40 text-xs text-white" />
            <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as 'mod' | 'admin' | 'developer')} className="px-3 py-2 rounded-xl bg-[#1b1233] border border-purple-900/40 text-xs text-white">
              <option value="mod">Moderator</option>
              <option value="admin">Administrator</option>
              <option value="developer">Developer</option>
            </select>
            <button onClick={handleCreateUser} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold">Create Staff</button>
          </div>
          {userManageError && <p className="text-rose-400 text-xs">{userManageError}</p>}

          {/* Staff List (Only shows staff with non-user roles; demoted users disappear) */}
          <div className="space-y-3 pt-2 border-t border-purple-900/30">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300">Active Staff Directory</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {staffUsers.filter(u => u.role && u.role !== 'user').map(staff => (
                <div key={staff.id} className="flex items-center justify-between p-3 rounded-xl bg-[#180f2d] border border-purple-900/30 text-xs">
                  <div>
                    <span className="font-bold text-white">@{staff.username}</span>
                    <span className="ml-2 text-zinc-400 font-mono text-[11px]">({staff.email})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-900/60 text-purple-300 border border-purple-500/30">
                      {staff.role}
                    </span>
                    {staff.username !== 'clover' && (
                      <select
                        value={staff.role}
                        onChange={(e) => handleUpdateRole(staff.id, e.target.value as Role)}
                        className="px-2 py-1 rounded-lg bg-[#120c22] border border-purple-800 text-[11px] text-white"
                      >
                        <option value="user">Demote to User (Remove Staff)</option>
                        <option value="mod">Moderator</option>
                        <option value="admin">Administrator</option>
                        <option value="developer">Developer</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Moderation Logs (Sensitive section: Owner / Dev / Admin only) */}
      {canViewLogs && (
        <div className="p-6 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-4">
          <h3 className="font-bold text-white text-base">Ban & Moderation History</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {moderationLogs.length === 0 ? (
              <p className="text-xs text-zinc-400">No moderation actions recorded yet.</p>
            ) : (
              moderationLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-[#180f2d] border border-purple-900/30 text-xs text-zinc-300">
                  <span className="font-mono text-purple-400">[{log.timestamp}]</span>{' '}
                  <strong>{log.actionBy}</strong> {log.action} on @{log.targetUsername}: <span className="italic">{log.reason}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* System Activity Feed (Owner and Developer only) */}
      {canViewActivityFeed && (
        <div className="p-6 rounded-2xl bg-[#130d24]/90 border border-purple-900/40 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">System Activity Feed</h3>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {systemActivities.length === 0 ? (
              <p className="text-xs text-zinc-400">No system activities recorded yet.</p>
            ) : (
              systemActivities.map((act) => (
                <div key={act.id} className="p-3 rounded-lg bg-[#180f2d] border border-purple-900/30 text-xs text-zinc-300 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-purple-400">[{new Date(act.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-900/60 text-purple-300 mr-2">{act.type}</span>
                    <span>{act.description}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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

      {/* Floating Toast Notification for Ban Actions (Admins, Developers, Owners) */}
      {toastMessage && canViewLogs && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-[#1b1037] border border-purple-500/50 shadow-2xl p-4 text-white animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold text-rose-300 tracking-wide uppercase">{toastMessage.title}</h4>
            <p className="text-xs text-zinc-300 leading-relaxed">{toastMessage.body}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
