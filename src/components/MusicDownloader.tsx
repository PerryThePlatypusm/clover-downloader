import React, { useState } from 'react';
import { MusicTrack, DownloadTask, DownloadFormat } from '../types';
import { SAMPLE_MUSIC_TRACKS, createPlayableBlob, triggerFileDownload, playPreviewSound } from '../utils/mediaUtils';
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
  const [thinkingQuery, setThinkingQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingResult, setThinkingResult] = useState<any>(null);
  const [playlistQueueProgress, setPlaylistQueueProgress] = useState<number | null>(null);
  const [playlistDownloadIndex, setPlaylistDownloadIndex] = useState(0);

  const tracks = SAMPLE_MUSIC_TRACKS;

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
    const cleanTitle = track.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${track.artist}_${cleanTitle}_${selectedFormat}.${ext}`;
    const baseSpeed = 110.0; // 100% Free uncapped speed

    const newTask: DownloadTask = {
      id: `music_${Date.now()}_${track.id}`,
      url: `https://${track.platform}.com/track/${track.id}`,
      title: `${track.title} — ${track.artist}`,
      author: track.artist,
      platform: track.platform,
      format: selectedFormat,
      quality: selectedBitrate,
      progress: 0,
      status: 'downloading',
      speedMBs: baseSpeed + (Math.random() * 8 - 4),
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

        const blob = createPlayableBlob(newTask.title, newTask.format, newTask.quality);
        triggerFileDownload(blob, newTask.fileName);
      } else {
        newTask.progress = progress;
        newTask.downloadedSizeMB = (progress / 100) * track.sizeMB;
        newTask.etaSeconds = Math.max(0.1, (track.sizeMB - newTask.downloadedSizeMB) / baseSpeed);
      }
    }, 120);
  };

  const handleBatchDownload = () => {
    setPlaylistQueueProgress(0);
    setPlaylistDownloadIndex(0);

    let currentIdx = 0;
    const downloadNext = () => {
      if (currentIdx >= tracks.length) {
        setPlaylistQueueProgress(100);
        setTimeout(() => setPlaylistQueueProgress(null), 3000);
        return;
      }

      setPlaylistDownloadIndex(currentIdx + 1);
      const track = tracks[currentIdx];
      handleDownloadSingleTrack(track);

      currentIdx++;
      setPlaylistQueueProgress(Math.round((currentIdx / tracks.length) * 100));
      setTimeout(downloadNext, 1100);
    };

    downloadNext();
  };

  const handleDeepThinkingSearch = async () => {
    if (!thinkingQuery.trim()) return;
    setIsThinking(true);
    setThinkingResult(null);

    try {
      const res = await fetch('/api/gemini/thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: thinkingQuery,
          type: 'music_identification_lossless',
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
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
          Spotify, Apple Music & SoundCloud
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
          Rip high-fidelity audio up to 24-bit 192kHz FLAC or 320kbps MP3 with embedded album art, lossless tags, and instant device download.
        </p>
      </div>

      {/* Top Controls: Search / URL bar & Format Selector with Moving Outer Glow */}
      <GlowBeamBox className="max-w-4xl mx-auto" innerClassName="p-5 sm:p-7 space-y-5">
        {/* Search / URL input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Paste Spotify track/album/playlist link, Apple Music URL, or search artist / song..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#1b1233] border border-purple-800/40 text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-inner"
          />
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

        {/* Batch Playlist Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-purple-900/30">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Playlist Mode: <strong>3 Curated Tracks Ready</strong></span>
          </div>

          <button
            onClick={handleBatchDownload}
            disabled={playlistQueueProgress !== null}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-purple-900/40 hover:bg-purple-800/50 border border-purple-600/40 text-purple-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-300" />
            <span>
              {playlistQueueProgress !== null
                ? `Downloading Track ${playlistDownloadIndex}/${tracks.length} (${playlistQueueProgress}%)`
                : 'Batch Download All (ZIP)'}
            </span>
          </button>
        </div>
      </GlowBeamBox>

      {/* Track List Section */}
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-300">
            Featured Master Tracks ({tracks.length})
          </h3>
          <span className="text-xs text-zinc-400">Click Play to preview harmonic tone</span>
        </div>

        <div className="space-y-3">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#140e24]/80 border border-purple-900/30 hover:border-purple-700/50 transition-all duration-200 shadow-md"
            >
              {/* Left: Thumbnail & details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-purple-800/30 bg-[#1f153a]">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => handlePlayPreview(track.id)}
                    className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-opacity"
                    title="Preview Chime"
                  >
                    {isPlayingPreview === track.id ? (
                      <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                    ) : (
                      <Play className="w-5 h-5 text-purple-200 ml-0.5" />
                    )}
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded text-white bg-purple-900/80 border border-purple-700/50 text-[10px]">
                      {track.platform}
                    </span>
                    <span className="text-xs text-purple-400 font-mono">{track.bitrate}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate max-w-sm">
                    {track.title}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate">
                    {track.artist} · <span className="text-zinc-500">{track.album}</span>
                  </p>
                </div>
              </div>

              {/* Right: Meta & Download action */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-purple-900/20">
                <div className="text-right text-xs font-mono text-zinc-400">
                  <div>{track.duration}</div>
                  <div className="text-zinc-500">{track.sizeMB} MB</div>
                </div>

                <button
                  onClick={() => handleDownloadSingleTrack(track)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Free</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
