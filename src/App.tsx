import React, { useState, useEffect, lazy, Suspense } from 'react';
import { TabType, DownloadTask, UserProfile } from './types';
import { AmbientBackground } from './components/AmbientBackground';
import { Navbar } from './components/Navbar';
import { DownloadsDrawer } from './components/DownloadsDrawer';
import { AccountModal } from './components/AccountModal';
import { Footer } from './components/Footer';
import { CursorCat } from './components/CursorCat';
import { CatDownloadReaction } from './components/CatDownloadReaction';

const SocialDownloader = lazy(() => import('./components/SocialDownloader').then(m => ({ default: m.SocialDownloader })));
const MusicDownloader = lazy(() => import('./components/MusicDownloader').then(m => ({ default: m.MusicDownloader })));
const StreamingDownloader = lazy(() => import('./components/StreamingDownloader').then(m => ({ default: m.StreamingDownloader })));
const CreditsPage = lazy(() => import('./components/CreditsPage').then(m => ({ default: m.CreditsPage })));
const DevGateCard = lazy(() => import('./components/DevGateCard').then(m => ({ default: m.DevGateCard })));
const DevDashboard = lazy(() => import('./components/DevDashboard').then(m => ({ default: m.DevDashboard })));

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

    const savedUser = localStorage.getItem('clover_current_user');
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
    localStorage.setItem('clover_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('clover_current_user');
  };

  const handleNoteSent = () => {
    if (currentUser) {
      const updated = { ...currentUser, notesSentCount: currentUser.notesSentCount + 1 };
      setCurrentUser(updated);
      localStorage.setItem('clover_current_user', JSON.stringify(updated));
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
      localStorage.setItem('clover_current_user', JSON.stringify(updated));
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
      <CursorCat />
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

      {/* Main Content View with Code Splitting & Suspense Lazy Loading */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 relative z-10">
        <Suspense fallback={
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <span className="text-xs text-purple-300 font-mono tracking-wider">Loading Cloverspace...</span>
            </div>
          </div>
        }>
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

            {activeTab === 'streaming' && (
              <StreamingDownloader
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
              isAuthorizedClover ? (
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
        </Suspense>
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
