import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshContainerProps {
  onRefresh: () => void;
  children: React.ReactNode;
}

export const PullToRefreshContainer: React.FC<PullToRefreshContainerProps> = ({ onRefresh, children }) => {
  const [pullDist, setPullDist] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 2) {
      startYRef.current = e.touches[0].clientY;
    } else {
      startYRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === 0 || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    if (diff > 0 && window.scrollY <= 2) {
      setPullDist(Math.min(120, diff * 0.45));
    } else {
      setPullDist(0);
    }
  };

  const handleTouchEnd = () => {
    if (refreshing) return;
    if (pullDist > 65) {
      setRefreshing(true);
      setPullDist(70);
      onRefresh();
      setTimeout(() => {
        setRefreshing(false);
        setPullDist(0);
      }, 700);
    } else {
      setPullDist(0);
    }
    startYRef.current = 0;
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      {/* Pull indicator */}
      {(pullDist > 5 || refreshing) && (
        <div
          className="absolute inset-x-0 top-0 flex items-center justify-center pointer-events-none transition-transform z-30 overflow-hidden"
          style={{ height: `${Math.max(0, pullDist)}px` }}
        >
          <div className="flex items-center gap-2 py-2 px-4 rounded-full bg-[#1e123a] border border-purple-800/60 text-purple-200 text-xs shadow-lg animate-in fade-in">
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${refreshing || pullDist > 65 ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Resetting Downloader...' : pullDist > 65 ? 'Release to reset' : 'Pull down to reset'}</span>
          </div>
        </div>
      )}
      <div style={{ transform: `translateY(${pullDist > 0 ? pullDist * 0.3 : 0}px)`, transition: pullDist === 0 ? 'transform 0.2s ease-out' : 'none' }}>
        {children}
      </div>
    </div>
  );
};
