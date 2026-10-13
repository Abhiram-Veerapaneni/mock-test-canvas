import React from 'react';
import {
  Loader2,
  CheckCheck,
  Cloud,
  Eye,
  Bookmark,
  Trash2,
  CheckCircle2
} from 'lucide-react';

export default function TestCreationHeader({
  title,
  setTitle,
  existingExamId,
  examStatus,
  autoSaveStatus,
  lastSavedTime,
  questionCount = 0,
  isSaving,
  isSavingDraft,
  isDiscardingCloud,
  hasDraftOrContent,
  onPreviewPaper,
  onSaveDraft,
  onDiscardDraft,
  onPublish
}) {
  return (
    <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-none">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Examination Title
          </span>
          {existingExamId && (
            <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  examStatus === 'draft' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <span>{examStatus === 'draft' ? 'Draft' : 'Published'}</span>
            </span>
          )}

          {/* Local Storage Auto-save Status Indicator */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 transition-all">
            {autoSaveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                <span className="text-slate-600 dark:text-slate-400">Saving draft locally...</span>
              </>
            ) : autoSaveStatus === 'saved' ? (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">
                  Draft saved in local storage {lastSavedTime ? `(${new Date(lastSavedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
                </span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Local storage sync enabled</span>
              </>
            )}
          </div>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. JEE Advanced Full Mock 01 (Click to edit title)"
          className="w-full text-base sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 focus:bg-slate-50 dark:focus:bg-slate-950 rounded-md px-2.5 py-1 -ml-2.5 transition-all outline-none"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0">
        <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#162030] px-3 py-1.5 rounded-md border border-slate-200/80 dark:border-slate-800/80">
          Questions: <strong className="text-slate-900 dark:text-slate-100 tabular-nums font-semibold">{questionCount}</strong>
        </div>

        {/* Preview Question Paper Modal Button */}
        <button
          type="button"
          onClick={onPreviewPaper}
          disabled={questionCount === 0}
          title={questionCount === 0 ? "Add questions to preview paper" : "Preview question paper in dark/light mode and PDF export"}
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>Preview Paper</span>
        </button>

        {/* Save as Draft Button */}
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSavingDraft || isSaving}
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          {isSavingDraft ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Draft...</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
              <span>Save Draft</span>
            </>
          )}
        </button>

        {/* Discard Draft Button */}
        {hasDraftOrContent && (
          <button
            type="button"
            onClick={onDiscardDraft}
            disabled={isSavingDraft || isSaving || isDiscardingCloud}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/50 cursor-pointer"
            title="Discard draft and remove uncommitted changes"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Discard Draft</span>
          </button>
        )}

        {/* Publish Button */}
        <button
          type="button"
          onClick={onPublish}
          disabled={isSaving || isSavingDraft || questionCount === 0}
          className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{examStatus === 'published' ? 'Save Changes' : 'Publish Examination'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
