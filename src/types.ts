export type TabType = 'social' | 'music' | 'credits' | 'dev';

export type MediaPlatform =
  | 'youtube'
  | 'twitter'
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'reddit'
  | 'spotify'
  | 'applemusic'
  | 'soundcloud'
  | 'netflix'
  | 'crunchyroll'
  | 'twitch'
  | 'vimeo'
  | 'dailymotion'
  | 'pinterest'
  | 'threads'
  | 'phub'
  | 'other';

export type DownloadFormat =
  | 'mp4'
  | 'mkv'
  | 'webm'
  | 'mp3'
  | 'flac'
  | 'wav'
  | 'aac'
  | 'opus'
  | 'alac'
  | 'aiff';

export interface DownloadTask {
  id: string;
  url: string;
  title: string;
  author: string;
  platform: MediaPlatform;
  format: DownloadFormat;
  quality: string;
  progress: number;
  status: 'queued' | 'downloading' | 'processing' | 'completed' | 'failed' | 'paused';
  speedMBs: number;
  totalSizeMB: number;
  downloadedSizeMB: number;
  etaSeconds: number;
  createdAt: number;
  fileName: string;
  subtitles?: string;
  audioLanguage?: string;
  turboMode?: boolean;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  coverUrl: string;
  platform: 'spotify' | 'applemusic' | 'soundcloud';
  bitrate: string;
  year: string;
  genre: string;
  sizeMB: number;
}

export type Role = 'owner' | 'developer' | 'admin' | 'mod' | 'user';

export interface UserProfile {
  id: string;
  uid?: string;
  username: string;
  email: string;
  avatarColor: string;
  avatarUrl?: string;
  joinedAt: string;
  downloadsCount: number;
  notesSentCount: number;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'email' | 'authenticator';
  role: Role;
}

export interface ModerationLog {
  id: string;
  targetUsername: string;
  actionBy: string;
  action: string;
  reason: string;
  timestamp: string;
}

export interface SystemActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface NoteReply {
  text: string;
  repliedAt: string;
  sender: string;
  dispatchedEmail?: string;
}

export interface ThankYouNote {
  id: string;
  userId: string;
  username: string;
  email?: string;
  avatarColor: string;
  text: string;
  createdAt: string;
  likes: number;
  reply?: NoteReply;
}

export interface StreamingEpisode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  duration?: string;
  description?: string;
}

export interface StreamingSeason {
  seasonNumber: number;
  title: string;
  episodes: StreamingEpisode[];
}

export interface StreamingSeriesInfo {
  title: string;
  platform: 'netflix' | 'crunchyroll' | 'other';
  seasons: StreamingSeason[];
  totalEpisodes: number;
  year?: string;
  genre?: string;
  description?: string;
  thumbnail?: string;
}

export interface AlbumTrackInfo {
  trackNumber: number;
  title: string;
  artist: string;
  duration: string;
}

export interface AlbumInfo {
  albumTitle: string;
  artist: string;
  year?: string;
  genre?: string;
  totalTracks: number;
  tracks: AlbumTrackInfo[];
  platform: 'spotify' | 'applemusic' | 'soundcloud' | 'other';
  coverUrl?: string;
}

