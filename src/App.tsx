import React, { useState, useEffect } from 'react';
import { TabType, DownloadTask, UserProfile } from './types';
import { AmbientBackground } from './components/AmbientBackground';
import { Navbar } from './components/Navbar';
import { SocialDownloader } from './components/SocialDownloader';
import { MusicDownloader } from './components/MusicDownloader';
import { StreamingDownloader } from './components/StreamingDownloader';
import { DownloadsDrawer } from './components/DownloadsDrawer';
import { AccountModal } from './components/AccountModal';
import { DevGateCard } from './components/DevGateCard';
import { DevDashboard } from './components/DevDashboard';
import { CreditsPage } from './components/CreditsPage';
import { Footer } from './components/Footer';

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

      {/* Main Content View with Separate Dev Page and Smooth Page Transitions */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 relative z-10">
        <div key={activeTab} className="page-enter">
          {activeTab === 'social' && (
            <SocialDownloader
              onStartDownload={handleStartDownload}
              activeTasks={tasks}
              onCancelTask={handleCancelTask}
              onRemoveTask={handleRemoveTask}
            />
          )}

          {activeTab === 'music' && (
            <MusicDownloader
              onStartDownload={handleStartDownload}
              activeTasks={tasks}
              onCancelTask={handleCancelTask}
              onRemoveTask={handleRemoveTask}
            />
          )}

          {activeTab === 'streaming' && (
            <StreamingDownloader
              onStartDownload={handleStartDownload}
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
      </main>

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Downloads Queue Drawer */}
      <DownloadsDrawer
        isOpen={isDownloadsOpen}
        onClose={() => setIsDownloadsOpen(false)}
        tasks={tasks}
        onCancelTask={handleCancelTask}
        onRemoveTask={handleRemoveTask}
        onClearAll={handleClearAllTasks}
      />

      {/* Account Modal for Public Users */}
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
