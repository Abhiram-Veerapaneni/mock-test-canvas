import React from 'react';
import { AlertCircle, Loader2, Eye } from 'lucide-react';

export default function RevealQuestionsModal({
  isOpen,
  onClose,
  onConfirm,
  isRevealing
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-xl w-full max-w-md shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Reveal Questions & Solutions?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This practice exam was generated from the question bank. Revealing the questions will expose the statements, answer keys, and explanations.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <div className="font-medium text-slate-800 dark:text-slate-200">Before you continue:</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            • If you plan to <strong>take this test yourself</strong>, viewing the questions beforehand will spoil your test practice.
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            • If you are <strong>conducting this test for others</strong> or want to <strong>modify it in Studio</strong>, proceed to unlock authoring mode.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isRevealing}
            className="btn-secondary text-xs py-2 px-3.5 cursor-pointer"
          >
            Keep Hidden (Take Test First)
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRevealing}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
          >
            {isRevealing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Revealing...</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Reveal Questions & Studio Access</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
