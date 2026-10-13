import React from 'react';
import { Clock, X, AlertTriangle } from 'lucide-react';

export default function DraftRestoredToast({
  draftRestored,
  draftRestoredTime,
  questionCount = 0,
  toastConfirmDiscard,
  setToastConfirmDiscard,
  onDiscard,
  onDismiss,
  setDraftToastHovered
}) {
  if (!draftRestored) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      onMouseEnter={() => setDraftToastHovered(true)}
      onMouseLeave={() => setDraftToastHovered(false)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-lg text-xs animate-in slide-in-from-bottom-4 fade-in duration-200"
    >
      {!toastConfirmDiscard ? (
        <>
          <Clock className="w-4 h-4 text-slate-400 stroke-[2] shrink-0" />
          <span className="text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
            Draft restored{draftRestoredTime ? ` from ${draftRestoredTime}` : ''} ({questionCount} question{questionCount !== 1 ? 's' : ''})
          </span>
          <button
            type="button"
            onClick={() => setToastConfirmDiscard(true)}
            className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium px-2 py-1 rounded transition-colors ml-auto cursor-pointer"
            title="Discard restored local draft changes"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
            title="Dismiss notification"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <>
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
            Discard local changes?
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => setToastConfirmDiscard(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Discard
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
