import React from 'react';
import { Bookmark, X, AlertCircle, Loader2, Cloud } from 'lucide-react';

export default function LeaveDraftModal({
  isOpen,
  onClose,
  onSaveAndLeave,
  onLeaveWithoutSaving,
  isSavingDraft,
  title,
  questionCount = 0,
  errorMessage = ''
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Save Draft to Account?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                You have unsaved changes. Save this draft to your database account so you can continue editing from anywhere.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close and stay on page"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs space-y-2 border border-slate-200/80 dark:border-slate-800">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Assessment title:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[210px]">
              {title?.trim() || 'Untitled Assessment Draft'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Questions in draft:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{questionCount} questions</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400">Local device backup:</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Auto-saved on device
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2.5 px-4 flex-1 cursor-pointer font-medium"
            >
              Stay & Edit
            </button>
            <button
              type="button"
              onClick={onSaveAndLeave}
              disabled={isSavingDraft}
              className="btn-primary text-xs py-2.5 px-4 flex-1 flex items-center justify-center gap-1.5 cursor-pointer font-medium shadow-sm"
            >
              {isSavingDraft ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span>{isSavingDraft ? 'Saving Draft...' : 'Save & Leave'}</span>
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onLeaveWithoutSaving}
              className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer py-1 px-2 rounded hover:underline underline-offset-2"
            >
              Leave without saving to database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
