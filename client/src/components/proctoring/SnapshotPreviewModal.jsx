import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

export default function SnapshotPreviewModal({ snapshot, previewImage, onClose }) {
  const data = snapshot || previewImage;

  useEffect(() => {
    if (!data) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, onClose]);

  if (!data) return null;

  const formattedTime = data.timestamp
    ? new Date(data.timestamp).toLocaleTimeString()
    : new Date().toLocaleTimeString();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Live Proctoring Snapshot"
      className="fixed inset-0 z-[10000] bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm p-5 text-zinc-900 dark:text-zinc-100 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Live Proctoring Snapshot</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {data.userName || 'Student'} · {data.type || 'Snapshot'} · {formattedTime}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close snapshot modal"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-md overflow-hidden bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 max-h-[60vh] flex items-center justify-center p-2">
          <img
            src={data.imageUrl}
            alt="Captured proctoring violation"
            className="max-h-[58vh] w-auto object-contain rounded"
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
            Violation: {data.type || 'General'}
            {data.trustScore !== undefined && (
              <>
                {' '}· Trust Score:{' '}
                <strong className="text-rose-600 dark:text-rose-400 tabular-nums">{data.trustScore}%</strong>
              </>
            )}
          </span>
          {data.imageUrl && (
            <a
              href={data.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors"
            >
              <span>Full Resolution</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
