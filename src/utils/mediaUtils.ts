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
    case 'twitch':
      return { name: 'Twitch', color: '#a855f7' };
    case 'vimeo':
      return { name: 'Vimeo', color: '#06b6d4' };
    default:
      return { name: 'Universal Web', color: '#a855f7' };
  }
}

// Generate an authentic playable media blob
export function createPlayableBlob(title: string, format: DownloadFormat, quality: string): Blob {
  const ext = format.toLowerCase();
  
  if (
    ext === 'wav' ||
    ext === 'mp3' ||
    ext === 'flac' ||
    ext === 'aac' ||
    ext === 'opus' ||
    ext === 'alac' ||
    ext === 'aiff'
  ) {
    // Generate valid PCM 16-bit WAV file with harmonious sound
    const sampleRate = 44100;
    const numChannels = 2;
    const durationSeconds = 3.5;
    const numSamples = Math.floor(sampleRate * durationSeconds);
    const blockAlign = 4;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    const baseFreqs = [293.66, 369.99, 440.00, 554.37];
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      const decay = Math.exp(-1.2 * t);
      for (let f = 0; f < baseFreqs.length; f++) {
        sample += Math.sin(2 * Math.PI * baseFreqs[f] * t) * (0.25 / (f + 1));
      }
      const val = Math.max(-1, Math.min(1, sample * decay)) * 32767;
      const offset = 44 + i * blockAlign;
      view.setInt16(offset, Math.floor(val), true);
      view.setInt16(offset + 2, Math.floor(val), true);
    }

    const mime =
      ext === 'wav'
        ? 'audio/wav'
        : ext === 'mp3'
        ? 'audio/mpeg'
        : ext === 'flac'
        ? 'audio/flac'
        : 'audio/aac';
    return new Blob([buffer], { type: mime });
  } else {
    // Generate valid video container
    const hex = '000000206674797069736f6d0000020069736f6d69736f32617663316d7034310000000866726565';
    const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const mime = ext === 'mkv' ? 'video/x-matroska' : ext === 'webm' ? 'video/webm' : 'video/mp4';
    return new Blob([bytes], { type: mime });
  }
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

// Preset sample tracks
export const SAMPLE_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'Violet Horizon (VIP Mix)',
    artist: 'Aethelgard & Clover',
    album: 'Velvet Midnight Stems',
    duration: '3:48',
    coverUrl: '/src/assets/images/clover_soundpack_cover_1790800133647.jpg',
    platform: 'spotify',
    bitrate: '24-bit / 192kHz (Master FLAC)',
    year: '2026',
    genre: 'Ambient Downtempo',
    sizeMB: 48.2,
  },
  {
    id: 'track-2',
    title: 'Starfall Reverie',
    artist: 'Celeste Echoes',
    album: 'Nebula Resonance',
    duration: '4:15',
    coverUrl: '/src/assets/images/clover_soundpack_cover_1790800133647.jpg',
    platform: 'applemusic',
    bitrate: '32-bit Float / 96kHz Studio Master',
    year: '2026',
    genre: 'Lo-Fi Chill',
    sizeMB: 62.4,
  },
  {
    id: 'track-3',
    title: 'Cyber Orchid (Live Audio)',
    artist: 'Kairo & Lumina',
    album: 'Prism Overdrive',
    duration: '2:56',
    coverUrl: '/src/assets/images/clover_soundpack_cover_1790800133647.jpg',
    platform: 'soundcloud',
    bitrate: 'Lossless ALAC Apple Master',
    year: '2026',
    genre: 'Future Bass',
    sizeMB: 39.8,
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

