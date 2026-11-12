import React from 'react';
import { CheckSquare, Square, X, FilePlus, Loader2 } from 'lucide-react';

export default function QuestionBankBatchBar({
  selectedCount = 0,
  totalOnPage = 0,
  isAllPageSelected = false,
  onToggleSelectAllPage,
  onClearSelection,
  onAddToTest,
  isAdding = false
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 mx-auto max-w-xl z-40 px-4 transition-all duration-200">
      <div className="bg-white/95 dark:bg-[#131926]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.45)] rounded-2xl p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3">
        {/* Left Info & Select All Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-100 dark:border-indigo-800/50">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{selectedCount} selected</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            {totalOnPage > 0 && (
              <button
                type="button"
                onClick={onToggleSelectAllPage}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                {isAllPageSelected ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Deselect page</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Select page ({totalOnPage})</span>
                  </>
                )}
              </button>
            )}

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <button
              type="button"
              onClick={onClearSelection}
              className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Right Action Button */}
        <div className="flex items-center gap-2">
          {/* Mobile-only clear button */}
          <button
            type="button"
            onClick={onClearSelection}
            className="sm:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onAddToTest}
            disabled={isAdding}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <FilePlus className="w-3.5 h-3.5" />
                <span>Add to Test Creator</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

