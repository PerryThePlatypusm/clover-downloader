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
} from '../utils/mediaUtils';
import { ProgressBar } from './ProgressBar';
import { GlowBeamBox } from './GlowBeamBox';
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
} from 'lucide-react';

interface MusicDownloaderProps {
  onStartDownload: (task: DownloadTask) => void;
  activeTasks: DownloadTask[];
  onCancelTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
}

export const MusicDownloader: React.FC<MusicDownloaderProps> = ({
  onStartDownload,
  activeTasks,
  onCancelTask,
  onRemoveTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>('flac');
  const [selectedBitrate, setSelectedBitrate] = useState('24-bit / 192kHz (Master FLAC)');
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);

  // Gemini Thinking Resolver state
  const [thinkingQuery, setThinkingQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingResult, setThinkingResult] = useState<any>(null);
  const [thinkingAudioBase64, setThinkingAudioBase64] = useState<string | null>(null);
  const [thinkingAudioFileName, setThinkingAudioFileName] = useState<string | null>(null);
  const [thinkingAudioMime, setThinkingAudioMime] = useState<string>('audio/mpeg');
  const [isRecordingForThinking, setIsRecordingForThinking] = useState(false);
  const thinkingFileInputRef = useRef<HTMLInputElement | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [transcribeStatus, setTranscribeStatus] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([
    { role: 'model', content: "Hello! I'm your Clover Audio Master AI. Ask me anything about high-res FLAC codecs, track identification, or audio mixing!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const handleStartMicrophoneTranscription = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Microphone not supported in this environment.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setTranscribeStatus('Transcribing with gemini-3.5-transcribe...');
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          try {
            const res = await fetch('/api/gemini/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64Data, mimeType: 'audio/webm' }),
            });
            const data = await res.json();
            if (data.success && data.text) {
              setSearchQuery(data.text);
              setTranscribeStatus('Audio transcribed successfully!');
            }
          } catch (err) {
            setTranscribeStatus('Transcription failed.');
          } finally {
            setTimeout(() => setTranscribeStatus(null), 3000);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscribeStatus('Listening... Speak song or artist...');

      setTimeout(() => {
        mediaRecorder.stop();
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());
      }, 4000);
    } catch (err) {
      setIsRecording(false);
      setTranscribeStatus('Microphone permission denied.');
      setTimeout(() => setTranscribeStatus(null), 3000);
    }
  };

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
      progress += (baseSpeed / track.sizeMB) * 14 + Math.random() * 3;
      if (progress >= 95 && progress < 100) {
        newTask.status = 'processing';
        newTask.progress = 96;
      } else if (progress >= 100) {
        clearInterval(interval);
        newTask.progress = 100;
        newTask.status = 'completed';
        newTask.downloadedSizeMB = track.sizeMB;
        newTask.speedMBs = 0;
        newTask.etaSeconds = 0;

        triggerDirectDownload(`/api/media/sample-track/${track.id}`, fileName);
      } else {
        newTask.progress = progress;
        newTask.downloadedSizeMB = Math.round(((progress / 100) * track.sizeMB) * 10) / 10;
        newTask.etaSeconds = Math.max(0.1, (track.sizeMB - newTask.downloadedSizeMB) / baseSpeed);
      }
    }, 120);
  };

  const handleDirectMusicDownload = async () => {
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
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

    let currentProgress = 5;
    const interval = setInterval(() => {
      if (currentProgress < 90) {
        currentProgress += Math.random() * 8 + 4;
        newTask.progress = Math.min(90, Math.round(currentProgress));
        newTask.downloadedSizeMB = Math.round(((newTask.progress / 100) * newTask.totalSizeMB) * 10) / 10;
        newTask.etaSeconds = Math.max(0.1, (newTask.totalSizeMB - newTask.downloadedSizeMB) / baseSpeed);
      }
    }, 120);

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

        triggerDirectDownload(result.downloadUrl, finalFilename);
      } else {
        newTask.status = 'error';
        newTask.progress = 0;
        newTask.speedMBs = 0;
        newTask.etaSeconds = 0;
      }
    } catch (err) {
      clearInterval(interval);
      console.error('Download music error:', err);
      newTask.status = 'error';
      newTask.progress = 0;
      newTask.speedMBs = 0;
      newTask.etaSeconds = 0;
    }
  };

  const handleThinkingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThinkingAudioFileName(file.name);
    setThinkingAudioMime(file.type || 'audio/mpeg');

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setThinkingAudioBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRecordVoiceForThinking = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Microphone not supported in this environment.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setThinkingAudioFileName('voice_humming_recording.webm');
        setThinkingAudioMime('audio/webm');
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = (reader.result as string).split(',')[1];
          setThinkingAudioBase64(b64);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsRecordingForThinking(true);

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        setIsRecordingForThinking(false);
        stream.getTracks().forEach((t) => t.stop());
      }, 5000);
    } catch {
      setIsRecordingForThinking(false);
    }
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
          type: 'audio_music_identification_lossless',
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-xs font-semibold text-emerald-300 mb-3">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Free · Lossless Audio · Accounts Aren't Needed</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3 whitespace-nowrap">
          Spotify, Apple Music & SoundCloud Downloader
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
          Rip high-fidelity audio up to 24-bit 192kHz FLAC or 320kbps MP3 with embedded album art, lossless tags, and instant device download.
        </p>
      </div>

      {/* Top Controls: Search / URL bar & Format Selector with Moving Outer Glow */}
      <GlowBeamBox className="max-w-4xl mx-auto" innerClassName="p-5 sm:p-7 space-y-5">
        {/* Search / URL input with Transcribe Audio microphone button & direct Download button */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleDirectMusicDownload();
                }
              }}
              placeholder="Paste Spotify track/album/playlist link, Apple Music URL, or search artist / song..."
              className="w-full pl-12 pr-52 py-3.5 rounded-xl bg-[#1b1233] border border-purple-800/40 text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDirectMusicDownload}
                disabled={!searchQuery.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-1"
                title="Press Enter or click to download"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={handleStartMicrophoneTranscription}
                disabled={isRecording}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-600/40'
                }`}
                title="Transcribe Audio with Gemini"
              >
                <Mic className={`w-3.5 h-3.5 ${isRecording ? 'animate-bounce' : ''}`} />
                <span>{isRecording ? 'Listening...' : 'Transcribe'}</span>
              </button>
            </div>
          </div>
          {transcribeStatus && (
            <div className="text-xs text-purple-300 font-mono px-1 flex items-center gap-1.5 animate-in fade-in">
              <Sparkles className="w-3 h-3 text-purple-400 animate-spin" />
              <span>{transcribeStatus}</span>
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
      <div className="max-w-4xl mx-auto rounded-2xl border border-purple-800/40 bg-gradient-to-br from-[#160f2b] to-[#120a22] p-5 sm:p-7 shadow-xl">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Gemini High-Thinking Music Resolver
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700/40">
                Thinking Level: High
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Can't find a track name? Enter vague lyrics, a humming description, or obscure remix query for deep acoustic reasoning.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={thinkingQuery}
            onChange={(e) => setThinkingQuery(e.target.value)}
            placeholder="e.g. 'That midnight lofi song with purple piano and rain sound' or lyrics snippet..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#1d1438] border border-purple-800/40 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={handleDeepThinkingSearch}
            disabled={isThinking}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isThinking ? 'animate-spin' : ''}`} />
            <span>{isThinking ? 'Thinking Deeply...' : 'Deep Think Match'}</span>
          </button>
        </div>

        {thinkingResult && (
          <div className="mt-4 p-4 rounded-xl bg-[#1c1339] border border-indigo-500/30 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-indigo-300 font-semibold">
              <span>Acoustic Match ({thinkingResult.confidence})</span>
              <span className="text-zinc-400 font-mono">{thinkingResult.year}</span>
            </div>

            <div className="text-sm font-bold text-white">
              {thinkingResult.matchedTrack} — {thinkingResult.artist}
            </div>
            <p className="text-zinc-300 text-xs">Album: {thinkingResult.album} · Genre: {thinkingResult.genre}</p>
            <p className="text-zinc-400 italic text-[11px]">{thinkingResult.notes}</p>

            <div className="pt-2 flex items-center justify-between border-t border-purple-900/30">
              <span className="text-purple-300 font-mono text-[11px]">Recommended: {thinkingResult.recommendedBitrate}</span>
              <button
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
                className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
              >
                Download Matched Song
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
