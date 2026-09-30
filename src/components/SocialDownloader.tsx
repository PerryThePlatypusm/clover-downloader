import React, { useState } from 'react';
import { DownloadTask, DownloadFormat } from '../types';
import { detectPlatform, getPlatformInfo, createPlayableBlob, triggerFileDownload } from '../utils/mediaUtils';
import { ProgressBar } from './ProgressBar';
import { GlowBeamBox } from './GlowBeamBox';
import {
  Link2,
  Sparkles,
  ArrowRight,
  Video,
  Music,
  Zap,
  SlidersHorizontal,
  Check,
  Globe,
  Radio,
  Share2,
} from 'lucide-react';

interface SocialDownloaderProps {
  onStartDownload: (task: DownloadTask) => void;
  activeTasks: DownloadTask[];
  onCancelTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
}

const SAMPLE_URLS = [
  {
    name: 'YouTube 8K Clip',
    url: 'https://www.youtube.com/watch?v=clover_midnight_8k_hdr',
    title: 'Clover Midnight Neon Metropolis — 8K 60fps HDR Master',
    author: 'Clover Ultra Vision',
    platform: 'youtube' as const,
  },
  {
    name: 'X / Twitter Video',
    url: 'https://x.com/clover/status/1839201948291029',
    title: 'Next-Gen Neural Audio Engine Breakthrough Demo',
    author: '@clover_tech',
    platform: 'twitter' as const,
  },
  {
    name: 'TikTok Viral Beat',
    url: 'https://www.tiktok.com/@soundwaves/video/739182910284',
    title: 'Violet Waves (Ultra Bass Boosted 60fps)',
    author: '@soundwaves_hq',
    platform: 'tiktok' as const,
  },
  {
    name: 'Instagram Reel',
    url: 'https://www.instagram.com/reel/C8921xkq19',
    title: 'Aesthetic Tokyo Midnight Driving 4K 60fps',
    author: 'Clover Visions',
    platform: 'instagram' as const,
  },
  {
    name: 'Reddit High-Bitrate',
    url: 'https://www.reddit.com/r/sounddesign/comments/v819/cyber_audio',
    title: 'Analog Modular Synth Soundscape — Raw Audio',
    author: 'u/synth_architect',
    platform: 'reddit' as const,
  },
];

export const SocialDownloader: React.FC<SocialDownloaderProps> = ({
  onStartDownload,
  activeTasks,
  onCancelTask,
  onRemoveTask,
}) => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<DownloadFormat>('mp4');
  const [videoQuality, setVideoQuality] = useState('1080p 60fps Full HD (Studio Master)');
  const [audioQuality, setAudioQuality] = useState('320 kbps (High Fidelity MP3)');
  const [containerFormat, setContainerFormat] = useState('mp4');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);

  const detectedPlatform = detectPlatform(url);
  const platformInfo = getPlatformInfo(detectedPlatform);

  // Gemini AI Link Inspector
  const handleAnalyzeWithAI = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setAiInsight(null);

    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          platform: platformInfo.name,
          format,
          promptType: 'social_video',
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiInsight(data.data);
      }
    } catch (err) {
      console.error('AI inspect error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartDownload = () => {
    const targetUrl = url.trim() || SAMPLE_URLS[0].url;
    const matchingSample = SAMPLE_URLS.find((s) => s.url === targetUrl);

    const title = aiInsight?.title || matchingSample?.title || `${platformInfo.name} Media Stream`;
    const author = aiInsight?.author || matchingSample?.author || 'Creator';
    const quality = format === 'mp4' || format === 'mkv' || format === 'webm' ? videoQuality : audioQuality;

    const totalSizeMB =
      format === 'mp4' || format === 'mkv' || format === 'webm'
        ? videoQuality.includes('8K')
          ? 320.5
          : videoQuality.includes('4K')
          ? 145.8
          : videoQuality.includes('1440p')
          ? 98.2
          : videoQuality.includes('1080p')
          ? 68.4
          : 32.1
        : audioQuality.includes('FLAC') || audioQuality.includes('WAV')
        ? 45.0
        : audioQuality.includes('320')
        ? 14.8
        : 9.6;

    // 100% Free uncapped multi-stream speed
    const baseSpeed = 120.0;
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ext = format;
    const cleanName = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const fileName = `clover_${cleanName}_${quality.replace(/\s+/g, '_').substring(0, 15)}.${ext}`;

    const newTask: DownloadTask = {
      id: taskId,
      url: targetUrl,
      title,
      author,
      platform: detectedPlatform,
      format,
      quality,
      progress: 0,
      status: 'downloading',
      speedMBs: baseSpeed + (Math.random() * 12 - 6),
      totalSizeMB,
      downloadedSizeMB: 0,
      etaSeconds: totalSizeMB / baseSpeed,
      createdAt: Date.now(),
      fileName,
    };

    onStartDownload(newTask);

    let currentProgress = 0;
    const intervalTime = 120;
    const progressIncrement = (baseSpeed * (intervalTime / 1000) / totalSizeMB) * 100;

    const timer = setInterval(() => {
      currentProgress += progressIncrement + Math.random() * 2;
      if (currentProgress >= 95 && currentProgress < 100) {
        newTask.status = 'processing';
        newTask.progress = 96;
      } else if (currentProgress >= 100) {
        clearInterval(timer);
        newTask.progress = 100;
        newTask.status = 'completed';
        newTask.downloadedSizeMB = newTask.totalSizeMB;
        newTask.speedMBs = 0;
        newTask.etaSeconds = 0;

        const blob = createPlayableBlob(newTask.title, newTask.format, newTask.quality);
        triggerFileDownload(blob, newTask.fileName);
      } else {
        newTask.progress = currentProgress;
        newTask.downloadedSizeMB = (currentProgress / 100) * totalSizeMB;
        newTask.etaSeconds = Math.max(0.1, (totalSizeMB - newTask.downloadedSizeMB) / baseSpeed);
      }
    }, intervalTime);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-xs font-semibold text-emerald-300 mb-3">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Free · Uncapped Speed · Accounts Aren't Needed</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
          Download any video or audio in <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">high fidelity</span>
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
          YouTube, X, TikTok, Insta, Reddit, etc. Save clean MP4 or MP3 files directly to your device with uncapped multi-stream speed.
        </p>
      </div>

      {/* Main Downloader Input Box with Google AI Mode Style Moving Outer Glow */}
      <GlowBeamBox className="max-w-3xl mx-auto" innerClassName="p-5 sm:p-7">
        {/* URL Input Form */}
        <div className="relative mb-5">
          <div className="relative flex items-center">
            <div className="absolute left-4 pointer-events-none text-purple-400">
              <Link2 className="w-5 h-5" />
            </div>

            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste any link from YouTube, X, TikTok, Insta, Reddit, Twitch, Vimeo, etc..."
              className="w-full pl-12 pr-28 py-3.5 rounded-xl bg-[#1b1233] border border-purple-800/40 text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner"
            />

            {/* Platform badge preview */}
            <div className="absolute right-3 flex items-center gap-1.5">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded text-white shadow-sm"
                style={{ backgroundColor: platformInfo.color }}
              >
                {platformInfo.name}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Sample Links */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500">Quick test:</span>
          {SAMPLE_URLS.map((sample) => (
            <button
              key={sample.name}
              onClick={() => {
                setUrl(sample.url);
                setAiInsight(null);
              }}
              className="px-2.5 py-1 rounded-md bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 hover:text-white border border-purple-900/30 transition-colors cursor-pointer"
            >
              {sample.name}
            </button>
          ))}
        </div>

        {/* Format & Quality Settings Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#17102d] border border-purple-900/30 mb-6">
          {/* Format selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-2">
              Export Type & Container
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('mp4')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  format === 'mp4'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                    : 'bg-[#1e153b] border-purple-900/40 text-zinc-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4 text-purple-400" />
                <span>MP4 Video</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('mp3')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  format === 'mp3'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                    : 'bg-[#1e153b] border-purple-900/40 text-zinc-400 hover:text-white'
                }`}
              >
                <Music className="w-4 h-4 text-purple-400" />
                <span>MP3 Audio</span>
              </button>
            </div>
          </div>

          {/* Quality selector with expanded options */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-2">
              Resolution & Bitrate
            </label>
            {format === 'mp4' ? (
              <select
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value)}
                className="w-full py-2 px-3 rounded-lg bg-[#1e153b] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="8K Ultra HD (4320p 60fps HDR)">8K Ultra HD (4320p 60fps HDR) — Native Master</option>
                <option value="4K Ultra HD (2160p 60fps)">4K Ultra HD (2160p 60fps) — Crystal Crisp</option>
                <option value="2K Quad HD (1440p 60fps)">2K Quad HD (1440p 60fps) — High Frame Rate</option>
                <option value="1080p 60fps Full HD (Studio Master)">1080p 60fps Full HD (Studio Master)</option>
                <option value="1080p Standard (High Bitrate)">1080p Standard (High Bitrate)</option>
                <option value="720p HD (60fps)">720p HD (60fps) — Compact / Fast</option>
                <option value="480p SD (Lightweight)">480p SD — Lightweight</option>
                <option value="360p Mobile Data Saver">360p Mobile Data Saver</option>
              </select>
            ) : (
              <select
                value={audioQuality}
                onChange={(e) => setAudioQuality(e.target.value)}
                className="w-full py-2 px-3 rounded-lg bg-[#1e153b] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="320 kbps (High Fidelity MP3)">320 kbps High Fidelity MP3 (Universal)</option>
                <option value="Lossless FLAC (24-bit 96kHz Master)">Lossless FLAC (24-bit 96kHz Master)</option>
                <option value="Uncompressed WAV (32-bit Float 192kHz)">Uncompressed WAV (32-bit Float 192kHz)</option>
                <option value="Lossless ALAC (Apple Lossless)">Lossless ALAC (Apple Lossless)</option>
                <option value="256 kbps (Studio Quality AAC)">256 kbps Studio Quality AAC / M4A</option>
                <option value="Opus (160 kbps Ultra-Efficient)">Opus 160 kbps (Ultra-Efficient Speech & Music)</option>
                <option value="192 kbps (Standard HQ)">192 kbps Standard HQ MP3</option>
                <option value="128 kbps (Compact MP3)">128 kbps Compact MP3</option>
              </select>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleStartDownload}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Start Fast Download</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleAnalyzeWithAI}
            disabled={isAnalyzing}
            className="w-full sm:w-auto py-3.5 px-4 rounded-xl bg-[#1e153b] hover:bg-[#281c4d] border border-purple-800/40 text-purple-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            title="Inspect media link and extract clean tags with Gemini"
          >
            <Sparkles className={`w-4 h-4 text-purple-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Gemini Analyzing...' : 'AI Link Inspector'}</span>
          </button>
        </div>

        {/* Gemini AI Inspector Output Card */}
        {aiInsight && (
          <div className="mt-5 p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-purple-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Gemini Media Analysis
              </span>
              <span className="text-zinc-400 font-mono">{aiInsight.duration}</span>
            </div>

            <p className="text-white font-medium text-sm">{aiInsight.title}</p>
            <p className="text-zinc-400">{aiInsight.description}</p>

            {aiInsight.tags && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {aiInsight.tags.map((t: string, i: number) => (
                  <span key={i} className="text-[10px] text-purple-300/80">
                    #{t} {i < aiInsight.tags.length - 1 ? '·' : ''}
                  </span>
                ))}
              </div>
            )}

            {aiInsight.bestFormat && (
              <div className="pt-2 border-t border-purple-900/30 flex items-center justify-between text-zinc-300">
                <span>Recommended: <strong className="text-white">{aiInsight.bestFormat}</strong></span>
                <span className="text-emerald-400 font-mono">100% Free · Verified</span>
              </div>
            )}
          </div>
        )}
      </GlowBeamBox>

      {/* Active & Recent Downloads Section */}
      {activeTasks.length > 0 && (
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-300">
              Active & Recent Downloads ({activeTasks.length})
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              Auto-saves to device upon completion
            </span>
          </div>

          <div className="space-y-3">
            {activeTasks.map((task) => (
              <ProgressBar
                key={task.id}
                task={task}
                onCancel={onCancelTask}
                onRemove={onRemoveTask}
              />
            ))}
          </div>
        </div>
      )}

      {/* Supported Platforms Grid */}
      <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-[#130d24]/60 border border-purple-900/30">
        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3 text-center sm:text-left">
          Universal Social & Web Media Support
        </h4>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
          {[
            'YouTube (4K/8K)',
            'X (Twitter)',
            'TikTok',
            'Instagram Reels',
            'Reddit',
            'Facebook',
            'Twitch Clips',
            'Vimeo',
            'Dailymotion',
            'Pinterest',
            'Threads',
            'SoundCloud',
            'Bandcamp',
            'Direct MP4/MP3 URLs',
            '& Any Web Media',
          ].map((site) => (
            <span
              key={site}
              className="px-2.5 py-1 rounded-md bg-[#1d1436] border border-purple-900/40 text-purple-200 font-mono text-[11px]"
            >
              {site}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
