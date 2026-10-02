import React, { useState, useEffect } from 'react';
import { TabType, DownloadTask, UserProfile } from './types';
import { AmbientBackground } from './components/AmbientBackground';
import { Navbar } from './components/Navbar';
import { DownloadsDrawer } from './components/DownloadsDrawer';
import { AccountModal } from './components/AccountModal';
import { Footer } from './components/Footer';
import { CatDownloadReaction } from './components/CatDownloadReaction';
import { SocialDownloader } from './components/SocialDownloader';
import { MusicDownloader } from './components/MusicDownloader';
import { CreditsPage } from './components/CreditsPage';
import { DevGateCard } from './components/DevGateCard';
import { DevDashboard } from './components/DevDashboard';
import { safeLocalStorage } from './utils/storage';

export default function App() {
  const isDevSite =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('-dev-') ||
      window.location.search.includes('dev=true') ||
      window.location.hash.includes('dev'));

  const [activeTab, setActiveTab] = useState<TabType>(isDevSite ? 'dev' : 'social');
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [completedDownloadTitle, setCompletedDownloadTitle] = useState<string | null>(null);

  const isAuthorizedClover =
    currentUser?.username?.toLowerCase() === 'clover';

  // Load persistent user profile & set document title
  useEffect(() => {
    document.title = activeTab === 'dev' ? 'Clover Downloader (Dev)' : 'Clover Downloader';

    const savedAccent = safeLocalStorage.getItem('clover_accent_color');
    if (savedAccent) {
      document.documentElement.style.setProperty('--accent-color', savedAccent);
    }

    const savedUser = safeLocalStorage.getItem('clover_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        // fallback
      }
    }
  }, [activeTab]);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    safeLocalStorage.setItem('clover_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    safeLocalStorage.removeItem('clover_current_user');
  };

  const handleNoteSent = () => {
    if (currentUser) {
      const updated = { ...currentUser, notesSentCount: currentUser.notesSentCount + 1 };
      setCurrentUser(updated);
      safeLocalStorage.setItem('clover_current_user', JSON.stringify(updated));
    }
  };

  // Download Task Handlers with live dev tracking
  const handleStartDownload = (newTask: DownloadTask) => {
    setTasks((prev) => [newTask, ...prev]);

    // Live sync to backend analytics for clover dev dashboard
    fetch('/api/dev/track-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: newTask.platform,
        format: newTask.format,
        title: newTask.title,
        sizeMB: newTask.totalSizeMB,
      }),
    }).catch(() => {});

    if (currentUser) {
      const updated = { ...currentUser, downloadsCount: currentUser.downloadsCount + 1 };
      setCurrentUser(updated);
      safeLocalStorage.setItem('clover_current_user', JSON.stringify(updated));
    }
  };

  const handleUpdateTask = (updatedTask: DownloadTask) => {
    setTasks((prev) => {
      const old = prev.find((t) => t.id === updatedTask.id);
      if (old && old.status !== 'completed' && updatedTask.status === 'completed') {
        setCompletedDownloadTitle(updatedTask.title);
      }
      return prev.map((t) => (t.id === updatedTask.id ? { ...updatedTask } : t));
    });
  };

  const handleCancelTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'failed' as const } : t))
    );
  };

  const handleRemoveTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearAllTasks = () => {
    setTasks((prev) => prev.filter((t) => t.status === 'downloading' || t.status === 'processing'));
  };

  const activeTasksCount = tasks.filter(
    (t) => t.status === 'downloading' || t.status === 'processing'
  ).length;

  return (
    <div className="relative min-h-screen flex flex-col text-[#eae5f8] selection:bg-purple-600/30 selection:text-purple-200">
      {completedDownloadTitle && (
        <CatDownloadReaction
          title={completedDownloadTitle}
          onClose={() => setCompletedDownloadTitle(null)}
        />
      )}

      {/* Ambient glowing purple background */}
      <AmbientBackground />

      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeDownloadsCount={activeTasksCount}
        openDownloadsList={() => setIsDownloadsOpen(true)}
        currentUser={currentUser}
        openAccountModal={() => setIsAccountModalOpen(true)}
        isDevSite={isDevSite}
        onOpenDevDashboard={() => setActiveTab('dev')}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 relative z-10">
        <div key={activeTab} className="page-enter">
          {activeTab === 'social' && (
            <SocialDownloader
              onStartDownload={handleStartDownload}
              onUpdateTask={handleUpdateTask}
              activeTasks={tasks}
              onCancelTask={handleCancelTask}
              onRemoveTask={handleRemoveTask}
            />
          )}

          {activeTab === 'music' && (
            <MusicDownloader
              onStartDownload={handleStartDownload}
              onUpdateTask={handleUpdateTask}
              activeTasks={tasks}
              onCancelTask={handleCancelTask}
              onRemoveTask={handleRemoveTask}
            />
          )}

          {activeTab === 'credits' && (
            <CreditsPage
              currentUser={currentUser}
              onOpenAccountModal={() => setIsAccountModalOpen(true)}
              onNoteSent={handleNoteSent}
            />
          )}

          {/* Separate Dev Suite Page */}
          {activeTab === 'dev' && (
            currentUser?.role === 'user' ? (
              <div className="py-20 text-center space-y-4">
                <h2 className="text-xl font-bold text-rose-400">Access Denied</h2>
                <p className="text-sm text-zinc-400">You do not have permission to access the developer page.</p>
                <button
                  onClick={() => setActiveTab('social')}
                  className="py-2 px-4 rounded-xl bg-purple-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            ) : isAuthorizedClover ? (
              <DevDashboard
                currentUser={currentUser!}
                onLogout={handleLogout}
                onSwitchToLivePreview={() => setActiveTab('social')}
              />
            ) : (
              <DevGateCard onAuthorized={handleLogin} />
            )
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Slide-out active downloads task list drawer */}
      <DownloadsDrawer
        isOpen={isDownloadsOpen}
        onClose={() => setIsDownloadsOpen(false)}
        tasks={tasks}
        onCancelTask={handleCancelTask}
        onRemoveTask={handleRemoveTask}
        onClearAll={handleClearAllTasks}
      />

      {/* Account / 2FA / Profile modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </div>
  );
}
