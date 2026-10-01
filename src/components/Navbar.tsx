import React from 'react';
import { TabType, UserProfile } from '../types';
import { ArrowDownToLine, User, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeDownloadsCount: number;
  openDownloadsList: () => void;
  currentUser: UserProfile | null;
  openAccountModal: () => void;
  isDevSite?: boolean;
  onOpenDevDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeDownloadsCount,
  openDownloadsList,
  currentUser,
  openAccountModal,
  isDevSite = false,
  onOpenDevDashboard,
}) => {
  const isCloverDevUser =
    currentUser?.username?.toLowerCase() === 'clover';

  const showDevBadge = isCloverDevUser && !!currentUser;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-900/30 bg-[#0b0714]/85 backdrop-blur-xl transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Zone */}
        <button
          onClick={() => setActiveTab('social')}
          className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer mr-6 sm:mr-8 shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9d4edd] to-[#6b21a8] flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform duration-300 ease-out">
            <span className="text-emerald-300 font-bold text-base leading-none">🍀</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm sm:text-[15px] font-bold tracking-tight text-white group-hover:text-purple-200 transition-colors duration-200 whitespace-nowrap">
              Clover Downloader
            </span>
            {showDevBadge && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-lg bg-[#220d3d] text-[#c084fc] border border-purple-600/50 font-bold tracking-wider shadow-sm select-none animate-in fade-in zoom-in-95 duration-200 whitespace-nowrap">
                DEV
              </span>
            )}
          </div>
        </button>

        {/* Zone 2: clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium">
          <button
            onClick={() => setActiveTab('social')}
            className={`transition-colors relative py-1 text-xs uppercase tracking-wider cursor-pointer whitespace-nowrap ${
              activeTab === 'social'
                ? 'text-purple-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Social & Video
            {activeTab === 'social' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`transition-colors relative py-1 text-xs uppercase tracking-wider cursor-pointer whitespace-nowrap ${
              activeTab === 'music'
                ? 'text-purple-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Music Downloader
            {activeTab === 'music' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('streaming')}
            className={`transition-colors relative py-1 text-xs uppercase tracking-wider cursor-pointer whitespace-nowrap ${
              activeTab === 'streaming'
                ? 'text-red-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Netflix & Crunchyroll
            {activeTab === 'streaming' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('credits')}
            className={`transition-colors relative py-1 text-xs uppercase tracking-wider cursor-pointer whitespace-nowrap ${
              activeTab === 'credits'
                ? 'text-purple-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Credits
            {activeTab === 'credits' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('dev')}
            className={`transition-colors relative py-1 text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dev'
                ? 'text-purple-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Dev Suite</span>
            {activeTab === 'dev' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: Primary action & User Account */}
        <div className="flex items-center gap-2.5">
          {/* Dev Dashboard Shortcut when on Dev Site */}
          {isDevSite && isCloverDevUser && onOpenDevDashboard && (
            <button
              onClick={onOpenDevDashboard}
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-purple-300" />
              <span>Dev Suite</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>100% FREE · NO ACCOUNT NEEDED</span>
          </div>

          {/* Active downloads badge button */}
          <button
            onClick={openDownloadsList}
            title="Download Tasks Queue"
            className="relative p-2 rounded-lg text-zinc-400 hover:text-purple-200 hover:bg-purple-950/40 border border-purple-900/30 transition-colors focus:outline-none cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            {activeDownloadsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-[10px] font-bold text-white flex items-center justify-center font-mono tabular-nums animate-pulse">
                {activeDownloadsCount}
              </span>
            )}
          </button>

          {/* User Account / Profile button */}
          {currentUser ? (
            <button
              onClick={openAccountModal}
              className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-[#1a1133] hover:bg-[#25184a] border border-purple-800/40 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
              title="Account Settings"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt="PFP"
                  className="w-5 h-5 rounded-full object-cover border border-purple-500/40"
                />
              ) : (
                <div
                  className={`w-5 h-5 rounded-full bg-gradient-to-br ${currentUser.avatarColor} flex items-center justify-center text-[10px]`}
                >
                  👤
                </div>
              )}
              <span className="hidden sm:inline truncate max-w-[100px]">@{currentUser.username}</span>
            </button>
          ) : (
            <button
              onClick={openAccountModal}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-900/40 hover:bg-purple-800/50 border border-purple-600/40 text-purple-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav bar row */}
      <div className="md:hidden flex items-center justify-around overflow-x-auto border-t border-purple-900/20 px-2 py-2 bg-[#0b0714]/95">
        <button
          onClick={() => setActiveTab('social')}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'social' ? 'bg-purple-900/50 text-purple-200 font-semibold' : 'text-zinc-400'
          }`}
        >
          Social
        </button>
        <button
          onClick={() => setActiveTab('music')}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'music' ? 'bg-purple-900/50 text-purple-200 font-semibold' : 'text-zinc-400'
          }`}
        >
          Music
        </button>
        <button
          onClick={() => setActiveTab('streaming')}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'streaming' ? 'bg-red-900/50 text-red-200 font-semibold' : 'text-zinc-400'
          }`}
        >
          Streaming
        </button>
        <button
          onClick={() => setActiveTab('credits')}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'credits' ? 'bg-purple-900/50 text-purple-200 font-semibold' : 'text-zinc-400'
          }`}
        >
          Credits
        </button>
        <button
          onClick={() => setActiveTab('dev')}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'dev' ? 'bg-purple-900/50 text-purple-200 font-semibold' : 'text-zinc-400'
          }`}
        >
          Dev Suite
        </button>
      </div>
    </header>
  );
};
