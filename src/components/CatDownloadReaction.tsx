import React, { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface CatDownloadReactionProps {
  title: string;
  onClose: () => void;
}

export const CatDownloadReaction: React.FC<CatDownloadReactionProps> = ({ title, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1d1135] to-[#120822] border-2 border-purple-500/60 shadow-2xl shadow-purple-600/50 text-white max-w-sm flex items-center gap-3.5 relative overflow-hidden">
        {/* Decorative background paw prints */}
        <div className="absolute -right-4 -bottom-4 text-purple-900/30 text-6xl pointer-events-none select-none">
          🐾
        </div>

        {/* Pixel Cat Celebration GIF */}
        <div className="w-14 h-14 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-inner overflow-hidden relative">
          <img
            src="https://media.tenor.com/p97p4eO9y9EAAAAM/pixel-cat-cat.gif"
            alt="Pixel Cat Celebration"
            className="w-12 h-12 object-contain"
          />
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Purr-fect Download!</span>
          </div>
          <p className="text-xs font-semibold text-white truncate mb-1">
            {title}
          </p>
          <p className="text-[11px] text-purple-200">
            Downloaded successfully! Pixel cat approved 🐾✨
          </p>
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-purple-900/40 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
