import React from 'react';
import { DownloadTask } from '../types';
import { getPlatformInfo, triggerFileDownload, createPlayableBlob } from '../utils/mediaUtils';
import { ArrowDown, CheckCircle2, AlertCircle, X, DownloadCloud, Sparkles } from 'lucide-react';

interface ProgressBarProps {
  task: DownloadTask;
  onCancel?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ task, onCancel, onRemove }) => {
  const platformInfo = getPlatformInfo(task.platform);

  const handleSaveToDevice = async () => {
    if (task.url && (task.url.startsWith('/api/') || task.url.startsWith('http'))) {
      const a = document.createElement('a');
      a.href = task.url;
      a.download = task.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const blob = await createPlayableBlob(task.title, task.format, task.quality, task.url);
    if (blob) {
      triggerFileDownload(blob, task.fileName);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-purple-900/40 bg-[#140e24]/90 p-4 transition-all duration-300 hover:border-purple-700/50 shadow-lg shadow-purple-950/20">
      {/* Background glow when downloading */}
      {task.status === 'downloading' && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-indigo-600/5 to-transparent pointer-events-none transition-opacity"
          style={{ width: `${task.progress}%` }}
        />
      )}

      {/* Top row: Title and status */}
      <div className="flex items-start justify-between gap-3 mb-2 relative z-10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {/* Platform badge */}
            <span
              className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: platformInfo.color }}
            >
              {platformInfo.name}
            </span>
            <span className="text-xs text-purple-300 font-mono font-medium">
              {task.format.toUpperCase()} · {task.quality}
            </span>
          </div>

          <h4 className="text-sm font-semibold text-white truncate max-w-md" title={task.title}>
            {task.title}
          </h4>
          <p className="text-xs text-zinc-400 truncate">{task.author}</p>
        </div>

        {/* Actions / Status icon */}
        <div className="flex items-center gap-2 shrink-0">
          {task.status === 'completed' ? (
            <button
              onClick={handleSaveToDevice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-medium transition-colors"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Save File</span>
            </button>
          ) : task.status === 'downloading' || task.status === 'processing' ? (
            <button
              onClick={() => onCancel && onCancel(task.id)}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Cancel Download"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}

          {onRemove && (
            <button
              onClick={() => onRemove(task.id)}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors"
              title="Remove"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="relative w-full h-2 bg-[#201538] rounded-full overflow-hidden my-3">
        <div
          className={`h-full transition-all duration-150 ease-out rounded-full ${
            task.status === 'completed'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
              : task.status === 'failed'
              ? 'bg-rose-500'
              : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-violet-400'
          }`}
          style={{
            width: `${Math.min(
              100,
              Math.max(
                2,
                task.status === 'completed'
                  ? 100
                  : (task.downloadedSizeMB / Math.max(0.1, task.totalSizeMB)) * 100
              )
            )}%`,
          }}
        />
      </div>

      {/* Bottom stats row */}
      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono tabular-nums">
        <div className="flex items-center gap-3">
          <span className="text-purple-300 font-semibold">
            {Math.min(
              100,
              task.status === 'completed'
                ? 100
                : (task.downloadedSizeMB / Math.max(0.1, task.totalSizeMB)) * 100
            ).toFixed(0)}
            %
          </span>
          <span>·</span>
          <span>
            {task.downloadedSizeMB.toFixed(1)} MB / {task.totalSizeMB.toFixed(1)} MB
          </span>
          {task.status === 'downloading' && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                <ArrowDown className="w-3 h-3 animate-bounce" />
                {task.speedMBs.toFixed(1)} MB/s
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.status === 'downloading' && (
            <span className="text-zinc-500">ETA: {task.etaSeconds.toFixed(1)}s</span>
          )}
          {task.status === 'processing' && (
            <span className="text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" /> Muxing audio...
            </span>
          )}
          {task.status === 'completed' && (
            <span className="text-emerald-400 flex items-center gap-1 font-sans font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready for device
            </span>
          )}
          {task.status === 'failed' && (
            <span className="text-rose-400 flex items-center gap-1 font-sans">
              <AlertCircle className="w-3.5 h-3.5" /> Failed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
