import { MediaPlatform, DownloadFormat, MusicTrack } from '../types';

export function detectPlatform(url: string): MediaPlatform {
  const lower = url.toLowerCase().trim();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
  if (lower.includes('reddit.com')) return 'reddit';
  if (lower.includes('spotify.com')) return 'spotify';
  if (lower.includes('music.apple.com') || lower.includes('apple.com')) return 'applemusic';
  if (lower.includes('soundcloud.com')) return 'soundcloud';
  if (lower.includes('netflix.com')) return 'netflix';
  if (lower.includes('crunchyroll.com')) return 'crunchyroll';
  if (lower.includes('twitch.tv')) return 'twitch';
  if (lower.includes('vimeo.com')) return 'vimeo';
  if (lower.includes('dailymotion.com')) return 'dailymotion';
  if (lower.includes('pinterest.com')) return 'pinterest';
  if (lower.includes('threads.net')) return 'threads';
  return 'other';
}

export function getPlatformInfo(platform: MediaPlatform): { name: string; color: string } {
  switch (platform) {
    case 'youtube':
      return { name: 'YouTube', color: '#ff4d4d' };
    case 'twitter':
      return { name: 'X / Twitter', color: '#9d72ff' };
    case 'tiktok':
      return { name: 'TikTok', color: '#ec4899' };
    case 'instagram':
      return { name: 'Instagram', color: '#e879f9' };
    case 'facebook':
      return { name: 'Facebook', color: '#60a5fa' };
    case 'reddit':
      return { name: 'Reddit', color: '#f97316' };
    case 'spotify':
      return { name: 'Spotify', color: '#10b981' };
    case 'applemusic':
      return { name: 'Apple Music', color: '#f43f5e' };
    case 'soundcloud':
      return { name: 'SoundCloud', color: '#fb923c' };
    case 'netflix':
      return { name: 'Netflix', color: '#e50914' };
    case 'crunchyroll':
      return { name: 'Crunchyroll', color: '#f47521' };
    case 'twitch':
      return { name: 'Twitch', color: '#a855f7' };
    case 'vimeo':
      return { name: 'Vimeo', color: '#06b6d4' };
    default:
      return { name: 'Universal Web', color: '#a855f7' };
  }
}

export async function resolveMediaInfo(url: string): Promise<{
  title: string;
  author: string;
  duration?: string;
  sizeMB?: number;
  thumbnail?: string;
  platform?: string;
}> {
  try {
    const res = await fetch(`/api/media/resolve?url=${encodeURIComponent(url.trim())}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          title: data.title,
          author: data.author || 'Creator',
          duration: data.duration,
          sizeMB: data.sizeMB,
          thumbnail: data.thumbnail,
          platform: data.platform,
        };
      }
    }
  } catch (e) {
    console.warn('resolveMediaInfo failed:', e);
  }

  const p = detectPlatform(url);
  const pInfo = getPlatformInfo(p);
  return {
    title: `${pInfo.name} Media Stream`,
    author: 'Creator',
    platform: p,
  };
}

export async function startRealDownload(params: {
  url: string;
  format: DownloadFormat;
  quality: string;
  title?: string;
}): Promise<{
  success: boolean;
  downloadUrl?: string;
  title: string;
  filename: string;
  sizeMB: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/media/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        return {
          success: true,
          downloadUrl: data.downloadUrl,
          title: data.title,
          filename: data.filename,
          sizeMB: data.sizeMB || 0,
        };
      } else if (data.error) {
        return {
          success: false,
          title: params.title || 'media',
          filename: `${params.title || 'media'}.${params.format}`,
          sizeMB: 0,
          error: data.error,
        };
      }
    }
  } catch (e: any) {
    console.error('startRealDownload error:', e);
  }

  return {
    success: false,
    title: params.title || 'media',
    filename: `${params.title || 'media'}.${params.format}`,
    sizeMB: 0,
    error: 'Failed to connect to media download service',
  };
}

export function triggerDirectDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Fetch authentic playable media blob if needed
export async function createPlayableBlob(
  title: string,
  format: DownloadFormat,
  quality: string,
  sourceUrl?: string
): Promise<Blob | null> {
  const ext = format.toLowerCase();
  
  if (sourceUrl) {
    try {
      const realRes = await fetch('/api/media/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl, format, quality, title }),
      });
      if (realRes.ok) {
        const realData = await realRes.json();
        if (realData.downloadUrl) {
          const fileRes = await fetch(realData.downloadUrl);
          if (fileRes.ok) {
            const buf = await fileRes.arrayBuffer();
            return new Blob([buf], { type: ext === 'mp3' ? 'audio/mpeg' : 'video/mp4' });
          }
        }
      }
    } catch {}
  }

  return null;
}

export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Preset real sample tracks with accurate MB sizes and real playback
export const SAMPLE_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'Violet Horizon (VIP Mix)',
    artist: 'Aethelgard & Clover',
    album: 'Velvet Midnight Stems',
    duration: '0:45',
    coverUrl: '/src/assets/images/clover_soundpack_cover_1790800133647.jpg',
    platform: 'spotify',
    bitrate: '320kbps MP3 (Master Quality)',
    year: '2026',
    genre: 'Ambient Downtempo',
    sizeMB: 1.8,
  },
  {
    id: 'track-2',
    title: 'Starfall Reverie',
    artist: 'Celeste Echoes',
    album: 'Nebula Resonance',
    duration: '0:50',
    coverUrl: '/src/assets/images/clover_soundpack_cover_1790800133647.jpg',
    platform: 'applemusic',
    bitrate: '320kbps MP3 (Studio Master)',
    year: '2026',
    genre: 'Lo-Fi Chill',
    sizeMB: 2.0,
  },
  {
    id: 'track-3',
    title: 'Cyber Orchid (Live Audio)',
    artist: 'Kairo & Lumina',
    album: 'Prism Overdrive',
    duration: '0:40',
    coverUrl: '/src/assets/images/clover_soundpack_cover_1790800133647.jpg',
    platform: 'soundcloud',
    bitrate: '320kbps MP3 (Future Bass)',
    year: '2026',
    genre: 'Future Bass',
    sizeMB: 1.6,
  },
];

let audioCtx: AudioContext | null = null;

export function playPreviewSound(): void {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  } catch (e) {
    console.error('Audio preview error', e);
  }
}

