import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X, Loader2, AlertCircle } from 'lucide-react';

export default function DeleteExamModal({
  isOpen,
  onClose,
  onConfirm,
  examTitle = 'Untitled Assessment',
  isDeleting = false,
  questionsCount = 0,
  attemptsCount = 0
}) {
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmInput('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmed = confirmInput.trim().toUpperCase() === 'DELETE';

  const handleConfirm = () => {
    if (!isConfirmed) {
      setError('Please type DELETE to confirm permanent removal.');
      return;
    }
    setError('');
    onConfirm();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isConfirmed && !isDeleting) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Delete Assessment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                This will permanently remove this assessment from the database. This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Assessment Details Summary */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Assessment:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[210px]">
              {examTitle.trim() || 'Untitled Assessment'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Questions:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {questionsCount} questions
            </span>
          </div>
          {attemptsCount > 0 && (
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Candidate attempts:</span>
              <span className="font-medium text-rose-600 dark:text-rose-400">
                {attemptsCount} recorded
              </span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Associated questions (not saved to question bank) and all attempt history will be deleted.
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-1.5">
          <label className="block text-xs text-slate-600 dark:text-slate-400">
            Type <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px]">DELETE</code> to confirm:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => {
              setConfirmInput(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type DELETE to confirm"
            disabled={isDeleting}
            autoFocus
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:focus:border-rose-400 dark:focus:ring-rose-400 transition-colors"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-secondary text-xs py-2.5 px-4 flex-1 cursor-pointer font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmed || isDeleting}
            className={`text-xs py-2.5 px-4 flex-1 flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all shadow-xs ${
              isConfirmed && !isDeleting
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-[0.98]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60 cursor-not-allowed'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>Delete Assessment</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

