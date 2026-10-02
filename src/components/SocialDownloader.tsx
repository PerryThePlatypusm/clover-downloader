import React, { useState, useEffect } from 'react';
import { DownloadTask, DownloadFormat } from '../types';
import {
  detectPlatform,
  getPlatformInfo,
  resolveMediaInfo,
  startRealDownload,
  triggerDirectDownload,
  createPlayableBlob,
  triggerFileDownload,
  autoSelectBestFormat,
} from '../utils/mediaUtils';
import { ProgressBar } from './ProgressBar';
import { GlowBeamBox } from './GlowBeamBox';
import { PullToRefreshContainer } from './PullToRefreshContainer';
import { MediaMetadataPreview } from './MediaMetadataPreview';
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
  AlertCircle,
  X,
  ChevronDown,
} from 'lucide-react';

interface SocialDownloaderProps {
  onStartDownload: (task: DownloadTask) => void;
  onUpdateTask?: (task: DownloadTask) => void;
  activeTasks: DownloadTask[];
  onCancelTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
}

export const SocialDownloader: React.FC<SocialDownloaderProps> = ({
  onStartDownload,
  onUpdateTask,
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
  const [validationError, setValidationError] = useState<string | null>(null);

  const [inputMode, setInputMode] = useState<'single' | 'batch'>('single');
  const [batchInput, setBatchInput] = useState('');
  const [clipboardSuggestion, setClipboardSuggestion] = useState<string | null>(null);

  const [previewMetadata, setPreviewMetadata] = useState<any | null>(null);
  const [previewTargetUrl, setPreviewTargetUrl] = useState<string>('');
  const [isResolvingPreview, setIsResolvingPreview] = useState(false);

  const [liveThumbnail, setLiveThumbnail] = useState<any | null>(null);
  const [isFetchingThumb, setIsFetchingThumb] = useState(false);

  useEffect(() => {
    const trimmed = url.trim();
    if (trimmed.length < 8 || (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))) {
      setLiveThumbnail(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsFetchingThumb(true);
      try {
        const info = await resolveMediaInfo(trimmed);
        if (info && (info.thumbnail || info.title)) {
          setLiveThumbnail(info);
        }
      } catch (e) {
        // ignore
      } finally {
        setIsFetchingThumb(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [url]);

  const handleInputFocus = async () => {
    if (url.trim()) return;
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const trimmed = text.trim();
        if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && trimmed.length > 8) {
          setClipboardSuggestion(trimmed);
        }
      }
    } catch (e) {
      // ignore
    }
  };

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

  const startDownloadForUrl = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setIsResolvingPreview(true);
    setPreviewTargetUrl(targetUrl);
    try {
      const resolved = await resolveMediaInfo(targetUrl);
      setPreviewMetadata({
        ...resolved,
        qualities: [
          '2160p 4K UHD (Studio Master)',
          '1080p 60fps Full HD (High Quality)',
          '720p HD (Standard Definition)',
          '480p SD (Data Saver)',
          '320 kbps (High Fidelity MP3 Audio)',
          '128 kbps (Standard MP3)',
        ],
      });
    } catch (e) {
      setPreviewMetadata({
        title: 'Media Stream',
        author: 'Creator',
        duration: '3:45',
        sizeMB: 28.5,
        qualities: [
          '1080p 60fps Full HD (Studio Master)',
          '720p HD (High Definition)',
          '320 kbps (High Fidelity MP3)',
        ],
      });
    } finally {
      setIsResolvingPreview(false);
    }
  };

  const handleConfirmDownload = async () => {
    if (!previewTargetUrl) return;
    const targetUrl = previewTargetUrl;
    const itemPlatform = detectPlatform(targetUrl);
    const itemPlatformInfo = getPlatformInfo(itemPlatform);

    const quality = format === 'mp4' || format === 'mkv' || format === 'webm' ? videoQuality : audioQuality;
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const baseSpeed = 120.0;
    const initialEstimatedSize = previewMetadata?.sizeMB || (format === 'mp4' ? 35.0 : 8.5);

    // Create the task immediately so the user sees instant feedback
    const newTask: DownloadTask = {
      id: taskId,
      url: targetUrl,
      title: previewMetadata?.title || `${itemPlatformInfo.name} Media Stream`,
      author: previewMetadata?.author || 'Creator',
      platform: itemPlatform,
      format,
      quality,
      progress: 5,
      status: 'downloading',
      speedMBs: baseSpeed,
      totalSizeMB: initialEstimatedSize,
      downloadedSizeMB: 0,
      etaSeconds: initialEstimatedSize / baseSpeed,
      createdAt: Date.now(),
      fileName: `media.${format}`,
    };

    onStartDownload(newTask);
    setPreviewMetadata(null);
    setPreviewTargetUrl('');
    setUrl('');

    // Asynchronously resolve real metadata (e.g. exact YouTube video name)
    let realTitle = newTask.title;
    let realAuthor = newTask.author;
    try {
      const resolved = await resolveMediaInfo(targetUrl);
      if (resolved.title) {
        realTitle = resolved.title;
        newTask.title = realTitle;
      }
      if (resolved.author) {
        realAuthor = resolved.author;
        newTask.author = realAuthor;
      }
      if (resolved.sizeMB) {
        newTask.totalSizeMB = resolved.sizeMB;
      }
    } catch (e) {
      console.warn('Info resolution error:', e);
    }

    // Call server to fetch/convert actual media and get exact real file size and download URL
    const downloadPromise = startRealDownload({
      url: targetUrl,
      format,
      quality,
      title: realTitle,
    });

    let currentProgress = 10;
    const intervalTime = 60;
    const timer = setInterval(async () => {
      if (currentProgress < 90) {
        currentProgress += Math.random() * 14 + 8;
        newTask.progress = Math.min(90, Math.round(currentProgress));
        newTask.downloadedSizeMB = Math.round(((newTask.progress / 100) * newTask.totalSizeMB) * 10) / 10;
        newTask.etaSeconds = Math.max(0.1, (newTask.totalSizeMB - newTask.downloadedSizeMB) / baseSpeed);
        if (onUpdateTask) onUpdateTask({ ...newTask });
      }
    }, intervalTime);

    try {
      const result = await downloadPromise;
      clearInterval(timer);

      if (result.success && result.downloadUrl) {
        const finalTitle = result.title || realTitle;
        const cleanTitle = finalTitle.replace(/[\\/:*?"<>|]/g, '').trim() || 'video';
        const finalFilename = result.filename || `${cleanTitle}.${format}`;

        newTask.title = finalTitle;
        newTask.fileName = finalFilename;
        newTask.totalSizeMB = result.sizeMB;
        newTask.downloadedSizeMB = result.sizeMB;
        newTask.progress = 100;
        newTask.status = 'completed';
        newTask.speedMBs = 0;
        newTask.etaSeconds = 0;
        if (onUpdateTask) onUpdateTask({ ...newTask });

        // Trigger real file download directly to user's device
        triggerDirectDownload(result.downloadUrl, finalFilename);

        // Update dev stats with real size
        fetch('/api/dev/track-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: itemPlatform,
            format,
            title: finalTitle,
            sizeMB: result.sizeMB,
          }),
        }).catch(() => {});
      } else {
        newTask.status = 'failed';
        newTask.progress = 0;
        newTask.speedMBs = 0;
        newTask.etaSeconds = 0;
        if (onUpdateTask) onUpdateTask({ ...newTask });
      }
    } catch (err) {
      clearInterval(timer);
      console.error('Download error:', err);
      newTask.status = 'failed';
      newTask.progress = 0;
      newTask.speedMBs = 0;
      newTask.etaSeconds = 0;
      if (onUpdateTask) onUpdateTask({ ...newTask });
    }
  };

  const handleStartDownload = () => {
    const targetUrl = url.trim();
    if (!targetUrl) {
      setValidationError('Please paste a link before downloading.');
      return;
    }

    // Validate URL structure
    try {
      const urlToCheck = targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
        ? targetUrl
        : `https://${targetUrl}`;
      const parsed = new URL(urlToCheck);
      if (!parsed.hostname || !parsed.hostname.includes('.') || parsed.hostname.length < 4) {
        setValidationError('Please paste a valid media link (e.g. https://www.youtube.com/watch?v=... or tiktok.com/...)');
        return;
      }
    } catch {
      setValidationError('Please paste a valid media link (e.g. https://www.youtube.com/watch?v=... or tiktok.com/...)');
      return;
    }

    setValidationError(null);
    startDownloadForUrl(targetUrl);
  };

  const handleQueueBatch = async () => {
    const urls = batchInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) {
      setValidationError('Please paste at least one link into the batch box.');
      return;
    }

    setValidationError(null);
    setBatchInput('');

    // Sequentially add and process batch URLs one by one with pacing
    for (let i = 0; i < urls.length; i++) {
      const targetUrl = urls[i];
      await startDownloadForUrl(targetUrl);
      if (i < urls.length - 1) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
  };

  const handleReset = () => {
    setUrl('');
    setBatchInput('');
    setAiInsight(null);
    setValidationError(null);
  };

  return (
    <PullToRefreshContainer onRefresh={handleReset}>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full max-w-full">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto pt-4 sm:pt-6 pb-2 px-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] sm:text-xs font-semibold text-emerald-300 mb-3">
          <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>100% Free · Uncapped Speed · Accounts Aren't Needed</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 sm:mb-3">
          Download any video or audio in <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">high fidelity</span>
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm md:text-base leading-relaxed">
          Downloads from 1,000 plus sites. Save clean MP4 or MP3 files directly to your device with uncapped multi-stream speed.
        </p>
      </div>

      {/* Main Downloader Input Box with Google AI Mode Style Moving Outer Glow */}
      <GlowBeamBox className="max-w-3xl mx-auto w-full" innerClassName="p-4 sm:p-6 md:p-7">
        {/* Mode Toggle Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputMode('single')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'single'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-[#1b1233] text-zinc-400 hover:text-white border border-purple-900/40'
              }`}
            >
              Single Link Mode
            </button>
            <button
              type="button"
              onClick={() => setInputMode('batch')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'batch'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-[#1b1233] text-zinc-400 hover:text-white border border-purple-900/40'
              }`}
            >
              Batch Queue
            </button>
          </div>
          <span className="text-[11px] text-purple-300 font-mono">
            {inputMode === 'batch' ? 'Queue multiple URLs separated by newlines' : ''}
          </span>
        </div>

        {/* URL Input Form (Single or Batch Textarea) */}
        {inputMode === 'batch' ? (
          <div className="space-y-3 mb-5">
            <div className="relative">
              <div className="absolute left-3.5 sm:left-4 top-3.5 pointer-events-none text-purple-400">
                <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <textarea
                rows={4}
                value={batchInput}
                onChange={(e) => {
                  setBatchInput(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleQueueBatch();
                  }
                }}
                placeholder="paste a link here"
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl bg-[#1b1233] border border-purple-800/40 text-white placeholder-zinc-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner"
              />
            </div>

            {/* Batch Validation Error */}
            {validationError && inputMode === 'batch' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Live URL Validation Checklist */}
            {batchInput.trim().length > 0 && (() => {
              const isValidHttpUrl = (string: string) => {
                try {
                  const u = new URL(string);
                  return u.protocol === 'http:' || u.protocol === 'https:';
                } catch (_) {
                  return false;
                }
              };

              const batchLines = batchInput
                .split('\n')
                .map((l) => l.trim())
                .filter((l) => l.length > 0);

              const batchValidationResults = batchLines.map((line) => {
                const valid = isValidHttpUrl(line);
                const plat = valid ? detectPlatform(line) : 'other';
                const platInfo = getPlatformInfo(plat);
                return {
                  line,
                  valid: valid && plat !== 'other',
                  platformName: platInfo.name,
                };
              });

              return (
                <div className="p-3 rounded-xl bg-[#140b24] border border-purple-900/40 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-300">
                    Client-Side URL Analysis ({batchValidationResults.filter(r => r.valid).length}/{batchValidationResults.length} Valid):
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {batchValidationResults.map((res, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between text-xs p-2 rounded-lg border font-mono ${
                          res.valid
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        <span className="truncate max-w-[260px] sm:max-w-md">{res.line}</span>
                        <span className="shrink-0 font-semibold px-2 py-0.5 rounded text-[10px] uppercase">
                          {res.valid ? `✓ Valid (${res.platformName})` : '✕ Invalid / Unsupported Link'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="relative mb-5 sm:mb-6">
            {clipboardSuggestion && !url && (
              <div className="mb-3 p-2.5 rounded-xl bg-purple-950/90 border border-purple-500/50 text-xs text-purple-200 flex items-center justify-between gap-2 animate-in fade-in duration-200 shadow-lg">
                <div className="flex items-center gap-2 truncate">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="truncate">Found in clipboard: <strong className="text-white font-mono">{clipboardSuggestion}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setUrl(clipboardSuggestion);
                      const bestFormat = autoSelectBestFormat(clipboardSuggestion);
                      setFormat(bestFormat);
                      setContainerFormat(bestFormat);
                      setClipboardSuggestion(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs cursor-pointer shadow-sm"
                  >
                    Use Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setClipboardSuggestion(null)}
                    className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <div className="absolute left-3.5 sm:left-4 pointer-events-none text-purple-400">
                  <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                <input
                  type="url"
                  value={url}
                  onFocus={handleInputFocus}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setUrl(newUrl);
                    if (validationError) setValidationError(null);
                    if (newUrl.trim().length > 3) {
                      const bestFormat = autoSelectBestFormat(newUrl);
                      setFormat(bestFormat);
                      setContainerFormat(bestFormat);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleStartDownload();
                    }
                  }}
                  placeholder="paste a link here"
                  className={`w-full pl-10 sm:pl-12 pr-14 py-3 sm:py-3.5 rounded-xl bg-[#1b1233] border text-white placeholder-zinc-500 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 transition-all shadow-inner ${
                    validationError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-purple-800/40 focus:border-purple-500 focus:ring-purple-500/20'
                  }`}
                />

                {/* Platform badge inside URL input (if detected) */}
                {platformInfo.name !== 'Universal Web' && (
                  <div className="absolute right-3 pointer-events-none">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded text-white shadow-sm"
                      style={{ backgroundColor: platformInfo.color }}
                    >
                      {platformInfo.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Format & Quality Selector + Download Action Group right next to URL input */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative flex-1 sm:flex-initial">
                  <select
                    value={`${format}:::${format === 'mp4' || format === 'mkv' || format === 'webm' ? videoQuality : audioQuality}`}
                    onChange={(e) => {
                      const [fmt, q] = e.target.value.split(':::');
                      setFormat(fmt as DownloadFormat);
                      setContainerFormat(fmt);
                      if (fmt === 'mp4' || fmt === 'mkv' || fmt === 'webm') {
                        setVideoQuality(q);
                      } else {
                        setAudioQuality(q);
                      }
                    }}
                    className="w-full sm:w-auto pl-3 pr-8 py-3 sm:py-3.5 rounded-xl bg-[#1e153b] hover:bg-[#251b47] border border-purple-800/50 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer shadow-md"
                    title="Select download quality and format"
                  >
                    <optgroup label="Video Formats (MP4 / WebM / MKV)">
                      <option value="mp4:::1080p 60fps Full HD (Studio Master)">1080p Full HD (MP4)</option>
                      <option value="mp4:::4K Ultra HD (2160p 60fps)">4K Ultra HD (MP4)</option>
                      <option value="mp4:::2K Quad HD (1440p 60fps)">2K Quad HD (MP4)</option>
                      <option value="mp4:::720p HD (60fps)">720p HD (MP4)</option>
                      <option value="mp4:::480p SD (Lightweight)">480p SD (MP4)</option>
                      <option value="webm:::1080p 60fps Full HD (Studio Master)">1080p WebM</option>
                      <option value="mkv:::1080p 60fps Full HD (Studio Master)">1080p MKV</option>
                    </optgroup>
                    <optgroup label="Audio Formats (MP3 / FLAC / WAV)">
                      <option value="mp3:::320 kbps (High Fidelity MP3)">320 kbps MP3 (HQ)</option>
                      <option value="flac:::Lossless FLAC (24-bit 96kHz Master)">Lossless FLAC</option>
                      <option value="wav:::Uncompressed WAV (32-bit Float 192kHz)">WAV (Uncompressed)</option>
                      <option value="m4a:::256 kbps (Studio Quality AAC)">256 kbps AAC / M4A</option>
                      <option value="mp3:::192 kbps (Standard HQ)">192 kbps MP3</option>
                      <option value="mp3:::128 kbps (Compact MP3)">128 kbps MP3</option>
                    </optgroup>
                  </select>
                  <ChevronDown className="w-4 h-4 text-purple-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={handleStartDownload}
                  className="px-4 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                  title="Click to download"
                >
                  <ArrowRight className="w-4 h-4 shrink-0" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <div className="flex items-center gap-2 p-3 mt-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-medium animate-in fade-in duration-200 shadow-md">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="break-words">{validationError}</span>
              </div>
            )}

            {/* Live Instant Thumbnail & Metadata Preview Card */}
            {liveThumbnail && (
              <div className="mt-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-[#1b1035] to-[#120a22] border border-purple-500/40 flex items-center gap-3.5 animate-in fade-in zoom-in-95 duration-200 shadow-xl">
                <div className="w-20 h-16 rounded-xl bg-purple-950/80 border border-purple-500/30 overflow-hidden shrink-0 relative shadow-inner">
                  {liveThumbnail.thumbnail ? (
                    <img src={liveThumbnail.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-400">
                      <Video className="w-6 h-6" />
                    </div>
                  )}
                  {liveThumbnail.duration && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[9px] font-mono font-bold text-white">
                      {liveThumbnail.duration}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-purple-900/60 text-purple-300 border border-purple-500/30">
                      {liveThumbnail.platform || platformInfo.name}
                    </span>
                    {isFetchingThumb && <span className="text-[10px] text-purple-400 animate-pulse">Resolving thumbnail...</span>}
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{liveThumbnail.title}</h4>
                  <p className="text-[11px] text-purple-300 truncate">By {liveThumbnail.author}</p>
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* Action Controls: Batch Download or AI Inspector */}
        {inputMode === 'batch' ? (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleQueueBatch}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Download Batch Queue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing}
              className="w-full sm:w-auto py-3.5 px-4 rounded-xl bg-[#1e153b] hover:bg-[#281c4d] border border-purple-800/40 text-purple-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              title="Inspect media link and extract clean tags with Gemini"
            >
              <Sparkles className={`w-4 h-4 text-purple-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Gemini Analyzing...' : 'AI Link Inspector'}</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing}
              className="w-full py-3 px-4 rounded-xl bg-[#1e153b] hover:bg-[#281c4d] border border-purple-800/40 text-purple-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              title="Inspect media link and extract clean tags with Gemini"
            >
              <Sparkles className={`w-4 h-4 text-purple-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Gemini Analyzing...' : 'AI Link Inspector'}</span>
            </button>
          </div>
        )}

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

      {/* Downloads from 1,000 plus sites banner */}
      <div className="text-center max-w-md mx-auto pt-2 pb-6">
        <div className="inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-full bg-[#160d2d]/80 border border-purple-800/40 text-xs sm:text-sm font-semibold text-purple-200 shadow-lg shadow-purple-950/40">
          <Globe className="w-4 h-4 text-purple-400" />
          <span>Downloads from 1,000 plus sites</span>
        </div>
      </div>
      </div>

      {previewMetadata && (
        <MediaMetadataPreview
          metadata={previewMetadata}
          selectedQuality={format === 'mp4' || format === 'mkv' || format === 'webm' ? videoQuality : audioQuality}
          onSelectQuality={(q) => {
            if (format === 'mp4' || format === 'mkv' || format === 'webm') {
              setVideoQuality(q);
            } else {
              setAudioQuality(q);
            }
          }}
          onConfirm={handleConfirmDownload}
          onCancel={() => {
            setPreviewMetadata(null);
            setPreviewTargetUrl('');
          }}
        />
      )}
    </PullToRefreshContainer>
  );
};
