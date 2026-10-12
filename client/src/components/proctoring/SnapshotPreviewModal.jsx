import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { formatTime12h } from '../../utils/dateUtils';

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

  const formattedTime = formatTime12h(data.timestamp || new Date(), { includeSeconds: true });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Live Proctoring Snapshot"
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg overflow-hidden shadow-sm p-5 text-slate-900 dark:text-slate-100 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Live Proctoring Snapshot</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {data.userName || 'Student'} · {data.type || 'Snapshot'} · {formattedTime}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close snapshot modal"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-md overflow-hidden bg-[#F8FAFC] dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 max-h-[60vh] flex items-center justify-center p-2">
          <img
            src={data.imageUrl}
            alt="Captured proctoring violation"
            className="max-h-[58vh] w-auto object-contain rounded"
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
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
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors"
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
