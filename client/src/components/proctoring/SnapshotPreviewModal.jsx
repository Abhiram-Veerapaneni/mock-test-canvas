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
      className="fixed inset-0 z-[10000] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] rounded-2xl overflow-hidden shadow-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Proctoring Snapshot</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data.userName || 'Student'} • {data.type || 'Snapshot'} • {formattedTime}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close snapshot modal"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#151f32] dark:hover:bg-[#243147] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors border border-slate-200/80 dark:border-[#334155]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0f172a] border border-slate-200/80 dark:border-[#334155] max-h-[60vh] flex items-center justify-center">
          <img
            src={data.imageUrl}
            alt="Captured proctoring violation"
            className="max-h-[60vh] w-auto object-contain"
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            Violation: {data.type || 'General'}
            {data.trustScore !== undefined && (
              <>
                {' '}• Trust Score:{' '}
                <strong className="text-rose-600 dark:text-rose-400">{data.trustScore}%</strong>
              </>
            )}
          </span>
          {data.imageUrl && (
            <a
              href={data.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
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
