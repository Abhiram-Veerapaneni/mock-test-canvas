import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Bookmark, AlertTriangle, Trash2 } from 'lucide-react';

export default function LogoutDraftModal({
  isOpen,
  onClose,
  onSaveAndLogout,
  onDiscardAndLogout,
  draftTitle = 'Untitled Assessment Draft',
  questionCount = 0,
  isSaving = false
}) {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Reset confirmation state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setShowDiscardConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-slate-900 dark:text-slate-100 transition-all">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Unsaved Draft Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                You have unsaved changes on this device. Save this draft to your database account or delete it permanently from local storage before signing out:
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Draft Overview */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs space-y-2 border border-slate-200/80 dark:border-slate-800">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Assessment title:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[210px]">
              {draftTitle.trim() || 'Untitled Assessment Draft'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Questions in draft:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{questionCount} questions</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400">Database status:</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes on local device
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={onSaveAndLogout}
            disabled={isSaving}
            className="btn-primary text-xs py-2.5 px-4 w-full flex items-center justify-center gap-1.5 cursor-pointer font-medium shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to database & signing out...</span>
              </>
            ) : (
              <span>Save to Database & Sign Out</span>
            )}
          </button>

          {!showDiscardConfirm ? (
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="btn-secondary text-xs py-2 px-3 cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(true)}
                disabled={isSaving}
                className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60"
              >
                Discard changes and sign-out
              </button>
            </div>
          ) : (
            /* Expanded Confirmation Check */
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Are you sure you want to discard your changes?
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    All unsaved questions and modifications on this device will be permanently lost.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="btn-secondary text-xs py-1.5 px-3 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onDiscardAndLogout}
                  className="text-xs py-1.5 px-3.5 font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Discard & Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
