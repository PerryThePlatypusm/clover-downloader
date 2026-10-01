import React, { useState, useRef } from 'react';
import { MusicTrack, DownloadTask, DownloadFormat } from '../types';
import {
  SAMPLE_MUSIC_TRACKS,
  createPlayableBlob,
  triggerFileDownload,
  triggerDirectDownload,
  resolveMediaInfo,
  startRealDownload,
  detectPlatform,
  playPreviewSound,
  autoSelectBestFormat,
} from '../utils/mediaUtils';
import { ProgressBar } from './ProgressBar';
import { GlowBeamBox } from './GlowBeamBox';
import { PullToRefreshContainer } from './PullToRefreshContainer';
import {
  Music2,
  Disc3,
  Play,
  Download,
  Search,
  Sparkles,
  Volume2,
  Layers,
  BrainCircuit,
  Zap,
  Mic,
  MessageSquare,
  Send,
  Upload,
  FileAudio,
  X,
  AlertCircle,
  Globe,
  Square,
  RotateCcw,
  Check,
} from 'lucide-react';

interface MusicDownloaderProps {
  onStartDownload: (task: DownloadTask) => void;
  onUpdateTask?: (task: DownloadTask) => void;
  activeTasks: DownloadTask[];
  onCancelTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
}

export const MusicDownloader: React.FC<MusicDownloaderProps> = ({
  onStartDownload,
  onUpdateTask,
  activeTasks,
  onCancelTask,
  onRemoveTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>('flac');
  const [selectedBitrate, setSelectedBitrate] = useState('24-bit / 192kHz (Master FLAC)');
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [clipboardSuggestion, setClipboardSuggestion] = useState<string | null>(null);

  const handleInputFocus = async () => {
    if (searchQuery.trim()) return;
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

  // Gemini Thinking Resolver state (Humming, Singing, or Audio File Upload)
  const [thinkingQuery, setThinkingQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingResult, setThinkingResult] = useState<any>(null);
  const [thinkingAudioBase64, setThinkingAudioBase64] = useState<string | null>(null);
  const [thinkingAudioFileName, setThinkingAudioFileName] = useState<string | null>(null);
  const [thinkingAudioMime, setThinkingAudioMime] = useState<string>('audio/webm');
  const [thinkingAudioPreviewUrl, setThinkingAudioPreviewUrl] = useState<string | null>(null);
  const [isRecordingForThinking, setIsRecordingForThinking] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const thinkingFileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);

  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([
    { role: 'model', content: "Hello! I'm your Clover Audio Master AI. Ask me anything about high-res FLAC codecs, track identification, or audio mixing!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newMessages);
    setIsChatting(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setChatMessages([...newMessages, { role: 'model' as const, content: data.reply }]);
      }
    } catch (err) {
      setChatMessages([...newMessages, { role: 'model' as const, content: 'Error communicating with AI assistant.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handlePlayPreview = (trackId: string) => {
    if (isPlayingPreview === trackId) {
      setIsPlayingPreview(null);
    } else {
      setIsPlayingPreview(trackId);
      playPreviewSound();
      setTimeout(() => setIsPlayingPreview(null), 3000);
    }
  };

  const handleDownloadSingleTrack = (track: MusicTrack) => {
    const ext = selectedFormat;
    const cleanTitle = track.title.replace(/[\\/:*?"<>|]/g, '').trim();
    const fileName = `${track.artist} - ${cleanTitle}.${ext}`;
    const baseSpeed = 110.0;

    const newTask: DownloadTask = {
      id: `music_${Date.now()}_${track.id}`,
      url: `/api/media/sample-track/${track.id}`,
      title: `${track.title} — ${track.artist}`,
      author: track.artist,
      platform: track.platform,
      format: selectedFormat,
      quality: selectedBitrate,
      progress: 0,
      status: 'downloading',
      speedMBs: baseSpeed,
      totalSizeMB: track.sizeMB,
      downloadedSizeMB: 0,
      etaSeconds: track.sizeMB / baseSpeed,
      createdAt: Date.now(),
      fileName,
    };

    onStartDownload(newTask);

    let progress = 0;
    const interval = setInterval(() => {
      progress += (baseSpeed / track.sizeMB) * 28 + Math.random() * 6;
      if (progress >= 95 && progress < 100) {
        newTask.status = 'processing';
        newTask.progress = 96;
        if (onUpdateTask) onUpdateTask({ ...newTask });
      } else if (progress >= 100) {
        clearInterval(interval);
        newTask.progress = 100;
        newTask.status = 'completed';
        newTask.downloadedSizeMB = track.sizeMB;
        newTask.speedMBs = 0;
        newTask.etaSeconds = 0;
        if (onUpdateTask) onUpdateTask({ ...newTask });

        triggerDirectDownload(`/api/media/sample-track/${track.id}`, fileName);

        fetch('/api/dev/track-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: track.platform,
            format: selectedFormat,
            title: `${track.title} — ${track.artist}`,
            sizeMB: track.sizeMB,
          }),
        }).catch(() => {});
      } else {
        newTask.progress = progress;
        newTask.downloadedSizeMB = Math.round(((progress / 100) * track.sizeMB) * 10) / 10;
        newTask.etaSeconds = Math.max(0.1, (track.sizeMB - newTask.downloadedSizeMB) / baseSpeed);
        if (onUpdateTask) onUpdateTask({ ...newTask });
      }
    }, 60);
  };

  const handleDirectMusicDownload = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setValidationError('Please paste a link before downloading.');
      return;
    }

    // Validate link
    try {
      const urlToCheck = query.startsWith('http://') || query.startsWith('https://')
        ? query
        : `https://${query}`;
      const parsed = new URL(urlToCheck);
      if (!parsed.hostname || !parsed.hostname.includes('.') || parsed.hostname.length < 4) {
        setValidationError('Please paste a valid media or music link (e.g. Spotify, Apple Music, SoundCloud, YouTube, etc.)');
        return;
      }
    } catch {
      setValidationError('Please paste a valid media or music link (e.g. Spotify, Apple Music, SoundCloud, YouTube, etc.)');
      return;
    }

    setValidationError(null);
    const itemPlatform = detectPlatform(query);

    let cleanTitle = query;
    try {
      if (query.startsWith('http://') || query.startsWith('https://')) {
        const parsed = new URL(query);
        const lastPart = parsed.pathname.split('/').filter(Boolean).pop();
        if (lastPart) cleanTitle = lastPart.replace(/[^a-zA-Z0-9_-]/g, ' ');
      }
    } catch {}

    const initialTitle = cleanTitle.length > 2 ? cleanTitle : 'Master Audio Track';
    const ext = selectedFormat;
    const baseSpeed = 110.0;
    const estimatedSizeMB = selectedFormat === 'flac' ? 24.5 : selectedFormat === 'wav' ? 38.0 : 8.5;

    const taskId = `music_${Date.now()}`;
    const newTask: DownloadTask = {
      id: taskId,
      url: query,
      title: initialTitle,
      author: 'Resolving audio...',
      platform: itemPlatform === 'other' ? 'spotify' : itemPlatform,
      format: selectedFormat,
      quality: selectedBitrate,
      progress: 5,
      status: 'downloading',
      speedMBs: baseSpeed,
      totalSizeMB: estimatedSizeMB,
      downloadedSizeMB: 0,
      etaSeconds: estimatedSizeMB / baseSpeed,
      createdAt: Date.now(),
      fileName: `${initialTitle}.${ext}`,
    };

    onStartDownload(newTask);

    // Resolve real track title if URL
    let realTitle = initialTitle;
    if (query.startsWith('http://') || query.startsWith('https://')) {
      try {
        const resolved = await resolveMediaInfo(query);
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
        console.warn('Track resolution error:', e);
      }
    }

    const downloadPromise = startRealDownload({
      url: query,
      format: selectedFormat,
      quality: selectedBitrate,
      title: realTitle,
    });

    let currentProgress = 10;
    const interval = setInterval(() => {
      if (currentProgress < 90) {
        currentProgress += Math.random() * 14 + 8;
        newTask.progress = Math.min(90, Math.round(currentProgress));
        newTask.downloadedSizeMB = Math.round(((newTask.progress / 100) * newTask.totalSizeMB) * 10) / 10;
        newTask.etaSeconds = Math.max(0.1, (newTask.totalSizeMB - newTask.downloadedSizeMB) / baseSpeed);
        if (onUpdateTask) onUpdateTask({ ...newTask });
      }
    }, 60);

    try {
      const result = await downloadPromise;
      clearInterval(interval);

      if (result.success && result.downloadUrl) {
        const finalTitle = result.title || realTitle;
        const cleanSafe = finalTitle.replace(/[\\/:*?"<>|]/g, '').trim() || 'song';
        const finalFilename = result.filename || `${cleanSafe}.${selectedFormat}`;

        newTask.title = finalTitle;
        newTask.fileName = finalFilename;
        newTask.totalSizeMB = result.sizeMB;
        newTask.downloadedSizeMB = result.sizeMB;
        newTask.progress = 100;
        newTask.status = 'completed';
        newTask.speedMBs = 0;
        newTask.etaSeconds = 0;
        if (onUpdateTask) onUpdateTask({ ...newTask });

        triggerDirectDownload(result.downloadUrl, finalFilename);

        fetch('/api/dev/track-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: itemPlatform === 'other' ? 'spotify' : itemPlatform,
            format: selectedFormat,
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
      clearInterval(interval);
      console.error('Download music error:', err);
      newTask.status = 'failed';
      newTask.progress = 0;
      newTask.speedMBs = 0;
      newTask.etaSeconds = 0;
      if (onUpdateTask) onUpdateTask({ ...newTask });
    }
  };

  const handleThinkingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecordingError(null);
    setThinkingAudioFileName(file.name);
    setThinkingAudioMime(file.type || 'audio/mpeg');

    if (thinkingAudioPreviewUrl) URL.revokeObjectURL(thinkingAudioPreviewUrl);
    setThinkingAudioPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setThinkingAudioBase64(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearThinkingAudio = () => {
    if (thinkingAudioPreviewUrl) URL.revokeObjectURL(thinkingAudioPreviewUrl);
    setThinkingAudioBase64(null);
    setThinkingAudioFileName(null);
    setThinkingAudioPreviewUrl(null);
    setRecordingError(null);
  };

  const handleStartRecordingForThinking = async () => {
    try {
      setRecordingError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setRecordingError('Microphone not supported on this browser or device.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: mimeType });
        
        if (thinkingAudioPreviewUrl) URL.revokeObjectURL(thinkingAudioPreviewUrl);
        const previewUrl = URL.createObjectURL(blob);
        setThinkingAudioPreviewUrl(previewUrl);
        setThinkingAudioFileName('Hummed / Sung Melody (Voice Recording)');
        setThinkingAudioMime(mimeType);

        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = (reader.result as string).split(',')[1];
          setThinkingAudioBase64(b64);
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((track) => track.stop());
        setIsRecordingForThinking(false);
      };

      mediaRecorder.start(250);
      setIsRecordingForThinking(true);
      setRecordingSeconds(0);

      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingSeconds(elapsed);
        if (elapsed >= 15) {
          handleStopRecordingForThinking();
        }
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setIsRecordingForThinking(false);
      setRecordingError('Microphone permission was denied. Please allow microphone access to hum or sing.');
    }
  };

  const handleStopRecordingForThinking = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsRecordingForThinking(false);
  };

  const handleDeepThinkingSearch = async () => {
    if (!thinkingQuery.trim() && !thinkingAudioBase64) return;
    setIsThinking(true);
    setThinkingResult(null);

    try {
      const res = await fetch('/api/gemini/thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: thinkingQuery,
          audioBase64: thinkingAudioBase64,
          mimeType: thinkingAudioMime,
          type: 'audio_music_identification_humming_singing',
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setThinkingResult(data.result);
      }
    } catch (err) {
      console.error('Deep thinking error:', err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setValidationError(null);
  };

  return (
    <PullToRefreshContainer onRefresh={handleReset}>
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full max-w-full">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto pt-4 sm:pt-6 pb-2 px-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] sm:text-xs font-semibold text-emerald-300 mb-3">
          <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>100% Free · Lossless Audio · Accounts Aren't Needed</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 sm:mb-3">
          Spotify, Apple Music & SoundCloud Downloader
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm md:text-base leading-relaxed">
          Downloads from 1,000 plus sites. Rip high-fidelity audio up to 24-bit 192kHz FLAC or 320kbps MP3 with embedded album art, lossless tags, and instant device download.
        </p>
      </div>

      {/* Top Controls: Search / URL bar & Format Selector with Moving Outer Glow */}
      <GlowBeamBox className="max-w-4xl mx-auto w-full" innerClassName="p-4 sm:p-6 md:p-7 space-y-4 sm:space-y-5">
        {/* Search / URL input with Transcribe Audio microphone button & direct Download button */}
        <div className="space-y-2">
          {clipboardSuggestion && !searchQuery && (
            <div className="mb-3 p-2.5 rounded-xl bg-purple-950/90 border border-purple-500/50 text-xs text-purple-200 flex items-center justify-between gap-2 animate-in fade-in duration-200 shadow-lg">
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="truncate">Found in clipboard: <strong className="text-white font-mono">{clipboardSuggestion}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(clipboardSuggestion);
                    const bestFormat = autoSelectBestFormat(clipboardSuggestion);
                    setSelectedFormat(bestFormat);
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

          <div className="relative flex items-center">
            <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onFocus={handleInputFocus}
              onChange={(e) => {
                const q = e.target.value;
                setSearchQuery(q);
                if (validationError) setValidationError(null);
                if (q.trim().length > 3) {
                  const bestFmt = autoSelectBestFormat(q);
                  setSelectedFormat(bestFmt);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleDirectMusicDownload();
                }
              }}
              placeholder="paste a link here"
              className={`w-full pl-10 sm:pl-12 pr-28 sm:pr-48 py-3 sm:py-3.5 rounded-xl bg-[#1b1233] border text-white placeholder-zinc-500 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 transition-all shadow-inner ${
                validationError
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-purple-800/40 focus:border-purple-500 focus:ring-purple-500/20'
              }`}
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDirectMusicDownload}
                className="px-3 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                title="Press Enter or click to download"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 mt-2 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-medium animate-in fade-in duration-200 shadow-md">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="break-words">{validationError}</span>
            </div>
          )}
        </div>

        {/* Format Selector Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#17102d] border border-purple-900/30">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-2">
              Audio Codec & Container
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('flac');
                  setSelectedBitrate('24-bit / 192kHz (Master FLAC)');
                }}
                className={`py-2 px-1.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  selectedFormat === 'flac'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                    : 'bg-[#1e153b] border-purple-900/40 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-bold">FLAC</div>
                <div className="text-[10px] text-purple-300/80">192kHz Master</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('mp3');
                  setSelectedBitrate('320 kbps (High Fidelity MP3)');
                }}
                className={`py-2 px-1.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  selectedFormat === 'mp3'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                    : 'bg-[#1e153b] border-purple-900/40 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-bold">MP3</div>
                <div className="text-[10px] text-purple-300/80">320k HQ</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('wav');
                  setSelectedBitrate('32-bit Float Studio Master (WAV)');
                }}
                className={`py-2 px-1.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  selectedFormat === 'wav'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                    : 'bg-[#1e153b] border-purple-900/40 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-bold">WAV</div>
                <div className="text-[10px] text-purple-300/80">Raw 32-bit</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('alac');
                  setSelectedBitrate('Lossless ALAC (Apple Lossless)');
                }}
                className={`py-2 px-1.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  selectedFormat === 'alac'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                    : 'bg-[#1e153b] border-purple-900/40 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="font-bold">ALAC</div>
                <div className="text-[10px] text-purple-300/80">Apple Master</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-2">
              Bitrate & Audio Precision
            </label>
            <select
              value={selectedBitrate}
              onChange={(e) => setSelectedBitrate(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg bg-[#1e153b] border border-purple-900/40 text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="24-bit / 192kHz (Master FLAC)">24-bit / 192kHz Hi-Res Lossless (Studio Master)</option>
              <option value="24-bit / 96kHz (Lossless FLAC)">24-bit / 96kHz Hi-Res Lossless (Standard Audiophile)</option>
              <option value="32-bit Float Studio Master (WAV)">32-bit Float 192kHz (DAW Production Master)</option>
              <option value="Lossless ALAC (Apple Lossless)">Lossless ALAC (Apple Digital Master)</option>
              <option value="320 kbps (High Fidelity MP3)">320 kbps Constant Bitrate (Universal HQ)</option>
              <option value="256 kbps AAC (Apple Master)">256 kbps AAC (Pristine High Efficiency)</option>
              <option value="Opus 160 kbps Ultra">Opus 160 kbps (Modern High Efficiency)</option>
            </select>
          </div>
        </div>

        {/* Gemini Chatbot Assistant Widget */}
        <div className="p-4 rounded-xl bg-[#130b22] border border-purple-800/40 space-y-3">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Clover Audio Master AI</div>
                <div className="text-[10px] text-purple-300">Powered by Gemini Chatbot (gemini-3.5-flash)</div>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
              Active Agent
            </span>
          </div>

          {/* Chat scrollable thread */}
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-[#1b1233] border border-purple-900/50 text-purple-100 rounded-bl-none font-mono text-[11px]'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask AI about FLAC bitrates, track identification, mastering..."
              className="flex-1 px-3 py-2 rounded-xl bg-[#1b1233] border border-purple-800/40 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={isChatting || !chatInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </GlowBeamBox>

      {/* Active Music Downloads Section */}
      {activeTasks.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-300">
            Download Queue Progress
          </h3>
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

      {/* Gemini Deep Thinking Music Intelligence Module */}
      <div className="max-w-4xl mx-auto rounded-2xl border border-purple-800/40 bg-gradient-to-br from-[#160f2b] to-[#120a22] p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
              <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Gemini High-Thinking Music Resolver
              </h3>
              <p className="text-xs text-zinc-400">
                Can't find a track name? Hum or sing it, input an audio file, or enter lyrics for deep acoustic reasoning.
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700/40 shrink-0 hidden sm:inline-block">
            Thinking Level: High
          </span>
        </div>

        {/* Audio Input Features: Mic Humming/Singing and Audio File Input */}
        <div className="space-y-2.5">
          {/* Active Recording State */}
          {isRecordingForThinking ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs shadow-inner animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="font-semibold text-rose-100">
                  Recording humming / singing: 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds} / 0:15
                </span>
                <span className="text-zinc-400 hidden sm:inline">— Hum, sing, or whistle the tune into your mic</span>
              </div>
              <button
                type="button"
                onClick={handleStopRecordingForThinking}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop & Save</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {/* Microphone Humming / Singing Button */}
              <button
                type="button"
                onClick={handleStartRecordingForThinking}
                disabled={isThinking}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#21153f] hover:bg-[#2c1d53] text-purple-200 border border-purple-800/40 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm"
                title="Hum, sing, or whistle a tune for Google AI to identify"
              >
                <Mic className="w-3.5 h-3.5 text-purple-400" />
                <span>Hum or Sing Song</span>
              </button>

              {/* Input Audio File Button */}
              <button
                type="button"
                onClick={() => thinkingFileInputRef.current?.click()}
                disabled={isThinking}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#21153f] hover:bg-[#2c1d53] text-indigo-200 border border-purple-800/40 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm"
                title="Upload an audio file (MP3, WAV, M4A, WebM) for song identification"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Input Audio File</span>
              </button>
              <input
                type="file"
                ref={thinkingFileInputRef}
                onChange={handleThinkingFileUpload}
                accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.webm"
                className="hidden"
              />

              <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                Record a hum/melody or upload audio sample
              </span>
            </div>
          )}

          {/* Attached Audio Preview Chip */}
          {thinkingAudioPreviewUrl && !isRecordingForThinking && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[#1d143a] border border-purple-700/40 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileAudio className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-white font-medium truncate max-w-[220px] sm:max-w-xs">
                  {thinkingAudioFileName}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  Ready for AI Analysis
                </span>
              </div>
              <div className="flex items-center gap-2">
                <audio src={thinkingAudioPreviewUrl} controls className="h-7 w-48 sm:w-56" />
                <button
                  type="button"
                  onClick={handleClearThinkingAudio}
                  className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Remove audio"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Recording Error Notice */}
          {recordingError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{recordingError}</span>
            </div>
          )}
        </div>

        {/* Text description input */}
        <div>
          <input
            type="text"
            value={thinkingQuery}
            onChange={(e) => setThinkingQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleDeepThinkingSearch();
              }
            }}
            placeholder="e.g. 'That midnight lofi song with purple piano and rain sound' or lyrics snippet..."
            className="w-full px-4 py-3 rounded-xl bg-[#1d1438] border border-purple-800/40 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
          />
        </div>

        {/* Deep Think Match Button */}
        <button
          type="button"
          onClick={handleDeepThinkingSearch}
          disabled={(!thinkingQuery.trim() && !thinkingAudioBase64) || isThinking || isRecordingForThinking}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <Sparkles className={`w-4 h-4 text-indigo-300 ${isThinking ? 'animate-spin' : ''}`} />
          <span>{isThinking ? 'Google AI Analyzing Melodic Acoustics...' : 'Deep Think Match'}</span>
        </button>

        {/* Identified Song Result Card */}
        {thinkingResult && (
          <div className="mt-4 p-4 sm:p-5 rounded-xl bg-[#1c1339] border border-indigo-500/30 text-xs space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-indigo-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Acoustic Match ({thinkingResult.confidence})
              </span>
              <span className="text-zinc-400 font-mono">{thinkingResult.year}</span>
            </div>

            <div className="text-base sm:text-lg font-bold text-white">
              {thinkingResult.matchedTrack} — <span className="text-purple-300">{thinkingResult.artist}</span>
            </div>
            <p className="text-zinc-300 text-xs">Album: {thinkingResult.album} · Genre: {thinkingResult.genre}</p>
            <p className="text-zinc-400 italic text-[11px] leading-relaxed bg-[#140b28] p-2.5 rounded-lg border border-purple-900/40">
              💡 {thinkingResult.notes}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-purple-900/30">
              <span className="text-purple-300 font-mono text-[11px]">Recommended: {thinkingResult.recommendedBitrate}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(`${thinkingResult.artist} - ${thinkingResult.matchedTrack}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#27194a] hover:bg-[#342261] text-purple-200 text-xs font-semibold cursor-pointer border border-purple-700/40 transition-colors"
                  title="Paste song into top link input to download in FLAC/MP3"
                >
                  Paste into Link Bar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadSingleTrack({
                      id: `ai_${Date.now()}`,
                      title: thinkingResult.matchedTrack,
                      artist: thinkingResult.artist,
                      album: thinkingResult.album,
                      duration: '3:30',
                      coverUrl: '/src/assets/images/clover_soundpack_cover_1790800133647.jpg',
                      platform: 'spotify',
                      bitrate: thinkingResult.recommendedBitrate,
                      year: thinkingResult.year,
                      genre: thinkingResult.genre,
                      sizeMB: 36.2,
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Download Matched Song
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Downloads from 1,000 plus sites banner */}
      <div className="text-center max-w-md mx-auto pt-2 pb-6">
        <div className="inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-full bg-[#160d2d]/80 border border-purple-800/40 text-xs sm:text-sm font-semibold text-purple-200 shadow-lg shadow-purple-950/40">
          <Globe className="w-4 h-4 text-purple-400" />
          <span>Downloads from 1,000 plus sites</span>
        </div>
      </div>
      </div>
    </PullToRefreshContainer>
  );
};
