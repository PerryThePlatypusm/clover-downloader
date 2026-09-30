import React from 'react';
import { DownloadTask } from '../types';
import { ProgressBar } from './ProgressBar';
import { X, ArrowDownToLine, Trash2 } from 'lucide-react';

interface DownloadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: DownloadTask[];
  onCancelTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onClearAll: () => void;
}

export const DownloadsDrawer: React.FC<DownloadsDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  onCancelTask,
  onRemoveTask,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const activeCount = tasks.filter((t) => t.status === 'downloading' || t.status === 'processing').length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#110b20] border-l border-purple-900/40 text-white flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-purple-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-base font-bold tracking-tight">Download Tasks ({tasks.length})</h3>
                <p className="text-[11px] text-zinc-400">
                  {activeCount > 0 ? `${activeCount} in progress` : 'All tasks settled'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {tasks.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-purple-950/40 transition-colors"
                  title="Clear Finished"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-purple-900/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {tasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-zinc-400">
                <div className="w-16 h-16 rounded-full bg-purple-950/40 border border-purple-800/30 flex items-center justify-center mb-4 text-purple-400">
                  <ArrowDownToLine className="w-7 h-7" />
                </div>
                <h4 className="text-base font-semibold text-white mb-1">No downloads yet</h4>
                <p className="text-xs text-zinc-400 max-w-xs">
                  Paste a link in the Social or Music tab to start high speed downloading.
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <ProgressBar
                  key={task.id}
                  task={task}
                  onCancel={onCancelTask}
                  onRemove={onRemoveTask}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
