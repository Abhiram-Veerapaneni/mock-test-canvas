import React from 'react';
import Modal from '../common/Modal';

export default function ExamSubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  answeredCount = 0,
  remainingCount = 0
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Examination Submission"
    >
      <div className="space-y-4 text-xs">
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Are you sure you wish to submit? Once submitted, answers cannot be modified.
        </p>
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-medium">Answered</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm tabular-nums">{answeredCount}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-medium">Unanswered</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold text-sm tabular-nums">{remainingCount}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm transition-colors cursor-pointer"
          >
            Submit Exam
          </button>
        </div>
      </div>
    </Modal>
  );
}
