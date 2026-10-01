export type TabType = 'social' | 'music' | 'streaming' | 'credits' | 'dev';

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

export interface UserProfile {
  id: string;
  uid?: string;
  username: string;
  email: string;
  avatarColor: string;
  joinedAt: string;
  downloadsCount: number;
  notesSentCount: number;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'email' | 'authenticator';
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

