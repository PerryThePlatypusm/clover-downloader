import React from 'react';
import { TabType } from '../types';
import { ExternalLink } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: TabType) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="w-full border-t border-purple-900/30 bg-[#090510] py-10 mt-20 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Concept Line */}
        <div className="flex flex-col items-center md:items-start gap-1.5 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white text-base tracking-tight whitespace-nowrap">
              Clover Downloader
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Idea conceived by <span className="text-purple-300 font-medium">clover</span> · 100% Free ultra-fast media preservation.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
          <button
            onClick={() => setActiveTab('social')}
            className="hover:text-purple-300 transition-colors cursor-pointer"
          >
            Social & Video
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className="hover:text-purple-300 transition-colors cursor-pointer"
          >
            Music & Stems
          </button>
          <button
            onClick={() => setActiveTab('credits')}
            className="hover:text-purple-300 transition-colors cursor-pointer"
          >
            Credits & Support
          </button>
          <button
            onClick={() => setActiveTab('dev')}
            className="hover:text-purple-300 transition-colors cursor-pointer text-purple-400"
          >
            Dev Suite
          </button>
          <a
            href="https://guns.lol/cloverheh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>guns.lol/cloverheh</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
};
