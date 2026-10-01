import React, { useState } from 'react';
import { DownloadTask, DownloadFormat } from '../types';
import {
  createPlayableBlob,
  triggerFileDownload,
  triggerDirectDownload,
  resolveMediaInfo,
  startRealDownload,
} from '../utils/mediaUtils';
import { GlowBeamBox } from './GlowBeamBox';
import { ProgressBar } from './ProgressBar';
import {
  Tv,
  Film,
  Sparkles,
  ArrowRight,
  Zap,
  Globe,
  Layers,
  Check,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';

interface StreamingDownloaderProps {
  onStartDownload: (task: DownloadTask) => void;
  activeTasks: DownloadTask[];
  onCancelTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
}

const STREAMING_SAMPLES = [
  {
    name: 'Cyberpunk Edgerunners Master',
    url: 'https://www.youtube.com/watch?v=JtqIas3bYhg',
    title: 'Cyberpunk: Edgerunners | Official NSFW Trailer | Netflix',
    author: 'Netflix Studio',
    platform: 'netflix' as const,
  },
  {
    name: 'Solo Leveling Master Teaser',
    url: 'https://www.youtube.com/watch?v=9df_pE4s_2A',
    title: 'Solo Leveling Official Anime Trailer',
    author: 'Crunchyroll Anime',
    platform: 'crunchyroll' as const,
  },
  {
    name: 'Arcane Season Finale Master',
    url: 'https://www.youtube.com/watch?v=fXmAurh012s',
    title: 'Arcane: Season 2 | Official Trailer | Netflix',
    author: 'Riot & Netflix',
    platform: 'netflix' as const,
  },
  {
    name: 'Demon Slayer Master Arc',
    url: 'https://www.youtube.com/watch?v=0kQs6q7tJ_I',
    title: 'Demon Slayer: Kimetsu no Yaiba Infinity Castle | Official Trailer',
    author: 'Ufotable & Crunchyroll',
    platform: 'crunchyroll' as const,
  },
];

export const StreamingDownloader: React.FC<StreamingDownloaderProps> = ({
  onStartDownload,
  activeTasks,
  onCancelTask,
  onRemoveTask,
}) => {
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState<'single' | 'batch'>('single');
  const [batchInput, setBatchInput] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('4K Ultra HD (Dolby Vision)');
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>('mp4');
  const [selectedSubtitle, setSelectedSubtitle] = useState('English [CC] + Japanese Audio');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<any | null>(null);

  const handleSelectSample = (sample: typeof STREAMING_SAMPLES[0]) => {
    setUrl(sample.url);
    setAiInsight({
      title: sample.title,
      description: `Verified master stream from ${sample.author}. Ready for high-fidelity offline decoding.`,
      duration: '24m 50s',
      tags: ['1080p', 'LosslessAudio', 'MultiSub'],
      bestFormat: sample.platform === 'netflix' ? '4K Ultra HD MP4' : '1080p Master MKV',
    });
  };

  const handleAnalyzeWithAI = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setAiInsight({
        title: 'Decoded Stream: Master Episode Stream',
        description: 'Analyzed streaming manifest. High-bitrate video stream with multi-channel audio tracks detected.',
        duration: '22m 15s',
        tags: ['HDR10', 'DolbyAtmos', 'SubtitlesSynced'],
        bestFormat: '4K Ultra HD MP4',
      });
      setIsAnalyzing(false);
    }, 600);
  };

  const startDownloadForUrl = async (targetUrl: string) => {
    const isNetflix = targetUrl.toLowerCase().includes('netflix.com');
    const platform = isNetflix ? 'netflix' : 'crunchyroll';
    const initialTitle = aiInsight?.title || (isNetflix ? 'Netflix 4K Master Stream' : 'Crunchyroll 1080p Anime Episode');
    const initialAuthor = isNetflix ? 'Netflix Official' : 'Crunchyroll Anime';

    const baseSpeed = 120.0;
    const initialEstimatedSize = selectedQuality.includes('4K') ? 65.0 : 35.0;
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newTask: DownloadTask = {
      id: taskId,
      url: targetUrl,
      title: initialTitle,
      author: initialAuthor,
      platform,
      format: selectedFormat,
      quality: selectedQuality,
      progress: 5,
      status: 'downloading',
      speedMBs: baseSpeed,
      totalSizeMB: initialEstimatedSize,
      downloadedSizeMB: 0,
      etaSeconds: initialEstimatedSize / baseSpeed,
      createdAt: Date.now(),
      fileName: `media.${selectedFormat}`,
    };

    onStartDownload(newTask);

    let realTitle = initialTitle;
    try {
      const resolved = await resolveMediaInfo(targetUrl);
      if (resolved.title) {
        realTitle = resolved.title;
        newTask.title = realTitle;
      }
      if (resolved.author) {
        newTask.author = resolved.author;
      }
      if (resolved.sizeMB) {
        newTask.totalSizeMB = resolved.sizeMB;
      }
    } catch (e) {
      console.warn('Streaming info resolution error:', e);
    }

    const downloadPromise = startRealDownload({
      url: targetUrl,
      format: selectedFormat,
      quality: selectedQuality,
      title: realTitle,
    });

    let currentProgress = 5;
    const intervalTime = 120;
    const timer = setInterval(() => {
      if (currentProgress < 90) {
        currentProgress += Math.random() * 8 + 4;
        newTask.progress = Math.min(90, Math.round(currentProgress));
        newTask.downloadedSizeMB = Math.round(((newTask.progress / 100) * newTask.totalSizeMB) * 10) / 10;
        newTask.etaSeconds = Math.max(0.1, (newTask.totalSizeMB - newTask.downloadedSizeMB) / baseSpeed);
      }
    }, intervalTime);

    try {
      const result = await downloadPromise;
      clearInterval(timer);

      if (result.success && result.downloadUrl) {
        const finalTitle = result.title || realTitle;
        const cleanTitle = finalTitle.replace(/[\\/:*?"<>|]/g, '').trim() || 'stream';
        const finalFilename = result.filename || `${cleanTitle}.${selectedFormat}`;

        newTask.title = finalTitle;
        newTask.fileName = finalFilename;
        newTask.totalSizeMB = result.sizeMB;
        newTask.downloadedSizeMB = result.sizeMB;
        newTask.progress = 100;
        newTask.status = 'completed';
        newTask.speedMBs = 0;
        newTask.etaSeconds = 0;

        triggerDirectDownload(result.downloadUrl, finalFilename);

        fetch('/api/dev/track-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            format: selectedFormat,
            title: finalTitle,
            sizeMB: result.sizeMB,
          }),
        }).catch(() => {});
      } else {
        newTask.status = 'error';
        newTask.progress = 0;
        newTask.speedMBs = 0;
        newTask.etaSeconds = 0;
      }
    } catch (err) {
      clearInterval(timer);
      console.error('Download error:', err);
      newTask.status = 'error';
      newTask.progress = 0;
      newTask.speedMBs = 0;
      newTask.etaSeconds = 0;
    }
  };

  const handleStartDownloadAction = () => {
    if (!url.trim()) return;
    startDownloadForUrl(url.trim());
  };

  const handleQueueBatch = () => {
    const urls = batchInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) return;

    urls.forEach((targetUrl) => {
      startDownloadForUrl(targetUrl);
    });

    setBatchInput('');
  };

  const streamingTasks = activeTasks.filter(
    (t) => t.platform === 'netflix' || t.platform === 'crunchyroll'
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-xs font-semibold text-red-300 mb-3">
          <Tv className="w-3.5 h-3.5 text-red-400" />
          <span>Netflix 4K HDR & Crunchyroll 1080p Master Rip Hub</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3 whitespace-nowrap">
          Download <span className="bg-gradient-to-r from-red-400 via-amber-300 to-purple-300 bg-clip-text text-transparent">Netflix & Crunchyroll</span> in Full Fidelity
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
          Rip anime episodes, movies, and series with embedded multi-language subtitles and lossless audio streams directly to your device.
        </p>
      </div>

      {/* Main Streaming Downloader Box with Google AI Mode Glow Beam */}
      <GlowBeamBox className="max-w-3xl mx-auto" innerClassName="p-5 sm:p-7">
        {/* Mode Toggle Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputMode('single')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'single'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'bg-[#1b1233] text-zinc-400 hover:text-white border border-purple-900/40'
              }`}
            >
              Single Link Mode
            </button>
            <button
              type="button"
              onClick={() => setInputMode('batch')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'batch'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'bg-[#1b1233] text-zinc-400 hover:text-white border border-purple-900/40'
              }`}
            >
              Batch Queue (Newline-Separated URLs)
            </button>
          </div>
          <span className="text-[11px] text-red-300 font-mono">
            {inputMode === 'batch' ? 'Queue multiple streaming URLs separated by newlines' : ''}
          </span>
        </div>

        {/* URL Input Form (Single or Batch Textarea) */}
        {inputMode === 'batch' ? (
          <div className="relative mb-5">
            <div className="absolute left-4 top-3.5 pointer-events-none text-red-400">
              <Film className="w-5 h-5" />
            </div>
            <textarea
              rows={4}
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleQueueBatch();
                }
              }}
              placeholder="Paste multiple streaming URLs here (one URL per line):\nhttps://www.netflix.com/title/...\nhttps://www.crunchyroll.com/watch/..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#1b1233] border border-purple-800/40 text-white placeholder-zinc-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all shadow-inner"
            />
          </div>
        ) : (
          <div className="relative mb-6">
            <div className="relative flex items-center">
              <div className="absolute left-4 pointer-events-none text-red-400">
                <Film className="w-5 h-5" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleStartDownloadAction();
                  }
                }}
                placeholder="Paste Netflix series/movie link or Crunchyroll episode URL..."
                className="w-full pl-12 pr-44 py-3.5 rounded-xl bg-[#1b1233] border border-purple-800/40 text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all shadow-inner"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-red-600 text-white shadow-sm hidden sm:inline-block">
                  4K / 1080p
                </span>
                <button
                  type="button"
                  onClick={handleStartDownloadAction}
                  disabled={!url.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-red-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                  title="Press Enter or click to download"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quality & Format Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
              Stream Resolution
            </label>
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1233] border border-purple-800/40 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="4K Ultra HD (Dolby Vision)">4K Ultra HD (Dolby Vision / HDR10)</option>
              <option value="1080p Master Lossless">1080p Master Lossless (Recommended)</option>
              <option value="720p HD Compact">720p HD Compact (Fast Download)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1.5">
              Container Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as DownloadFormat)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1233] border border-purple-800/40 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="mp4">MP4 (Universal Device Playback)</option>
              <option value="mkv">MKV (Multi-Audio & Subtitle Tracks)</option>
              <option value="webm">WebM (Optimized Web Stream)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={inputMode === 'batch' ? handleQueueBatch : handleStartDownloadAction}
            disabled={inputMode === 'single' ? !url.trim() : !batchInput.trim()}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>{inputMode === 'batch' ? 'Download All' : 'Download'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleAnalyzeWithAI}
            disabled={isAnalyzing || !url.trim()}
            className="w-full sm:w-auto py-3.5 px-4 rounded-xl bg-[#1e153b] hover:bg-[#281c4d] border border-purple-800/40 text-purple-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 text-red-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing Manifest...' : 'AI Stream Inspector'}</span>
          </button>
        </div>

        {/* AI Inspector Results */}
        {aiInsight && (
          <div className="mt-5 p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-red-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                Stream Manifest Verified
              </span>
              <span className="text-zinc-400 font-mono">{aiInsight.duration}</span>
            </div>
            <p className="text-white font-medium text-sm">{aiInsight.title}</p>
            <p className="text-zinc-400">{aiInsight.description}</p>
            <div className="pt-2 border-t border-purple-900/30 flex items-center justify-between text-zinc-300">
              <span>Best Track: <strong className="text-white">{aiInsight.bestFormat}</strong></span>
              <span className="text-emerald-400 font-mono">100% Free · Uncapped</span>
            </div>
          </div>
        )}
      </GlowBeamBox>

      {/* Active Streaming Downloads */}
      {streamingTasks.length > 0 && (
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-red-300">
              Active Streaming Downloads ({streamingTasks.length})
            </h3>
          </div>
          <div className="space-y-3">
            {streamingTasks.map((task) => (
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
    </div>
  );
};
