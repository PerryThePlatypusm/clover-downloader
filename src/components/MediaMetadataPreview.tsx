import React from 'react';
import { X, Check, Video, Music, Clock, HardDrive, Sparkles } from 'lucide-react';

interface MediaMetadataPreviewProps {
  metadata: {
    title: string;
    author: string;
    duration?: string;
    sizeMB?: number;
    thumbnail?: string;
    platform?: string;
    qualities?: string[];
  };
  selectedQuality: string;
  onSelectQuality: (q: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const MediaMetadataPreview: React.FC<MediaMetadataPreviewProps> = ({
  metadata,
  selectedQuality,
  onSelectQuality,
  onConfirm,
  onCancel,
}) => {
  const defaultQualities = metadata.qualities || [
    '1080p 60fps Full HD (Studio Master)',
    '720p HD (High Definition)',
    '480p SD (Standard)',
    '320 kbps (High Fidelity MP3)',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-purple-500/40 bg-gradient-to-b from-[#190f2f] to-[#110820] text-white shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 space-y-6">
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-purple-900/40 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-purple-300">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">Media Metadata Preview</span>
        </div>

        {/* Thumbnail & Info */}
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <div className="w-full sm:w-36 h-28 rounded-2xl bg-purple-950/60 border border-purple-500/30 overflow-hidden shrink-0 shadow-lg relative group">
            {metadata.thumbnail ? (
              <img src={metadata.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-purple-400">
                <Video className="w-8 h-8" />
              </div>
            )}
            {metadata.duration && (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 text-[10px] font-mono font-bold text-white flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-400" />
                {metadata.duration}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <h3 className="text-base font-bold text-white leading-snug line-clamp-2">{metadata.title}</h3>
            <p className="text-xs text-purple-300 font-medium">By {metadata.author}</p>
            {metadata.sizeMB && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/40 text-[11px] font-mono text-zinc-300">
                <HardDrive className="w-3 h-3 text-purple-400" />
                <span>~{metadata.sizeMB} MB estimated size</span>
              </div>
            )}
          </div>
        </div>

        {/* Available Quality / Bitrate Options */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-purple-300">
            Available Quality & Bitrate Options (Fetched from URL)
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {defaultQualities.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSelectQuality(q)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                  selectedQuality === q
                    ? 'bg-purple-600/30 border-purple-400 text-white shadow-md shadow-purple-600/20'
                    : 'bg-[#180f2d] border-purple-900/40 text-zinc-300 hover:border-purple-600/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${selectedQuality === q ? 'bg-purple-400 animate-pulse' : 'bg-zinc-600'}`} />
                  <span className="font-semibold text-left">{q}</span>
                </div>
                {selectedQuality === q && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-[#1c1236] hover:bg-[#28184d] border border-purple-900/40 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Confirm & Start Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};
