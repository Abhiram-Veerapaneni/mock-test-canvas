import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCheck, CheckCircle2, Loader2, X, Database } from 'lucide-react';
import { formatDateTime12h } from '../../utils/dateUtils';

export default function ConfirmPublishModal({
  isOpen,
  onClose,
  onConfirm,
  isSaving,
  title,
  category,
  durationMinutes,
  questions = [],
  correctMark,
  incorrectMark,
  isScheduled,
  startTime,
  endTime,
  isUnlimitedAttempts,
  maxAttemptsValue,
  allowPracticeMode,
  allowReviewResponses,
  faceCheck,
  audioCheck,
  fullScreenLock,
  objectCheck,
  liveNotifications,
  contributeAllToBank,
  onToggleContributeAll
}) {
  const contributedCount = questions.filter((q) =>
    Boolean(q.contributeToBank !== undefined ? q.contributeToBank : q.isInBank)
  ).length;
  const allContributed = questions.length > 0
    ? contributedCount === questions.length
    : Boolean(contributeAllToBank);
  const isIndeterminate = questions.length > 0 && contributedCount > 0 && contributedCount < questions.length;

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CheckCheck className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Confirm Examination Parameters
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Review your test rules, scheduling window, and proctoring parameters before publishing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Test Meta Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Assessment Details</span>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{title || 'Untitled Assessment'}</div>
            <div className="text-slate-500 dark:text-slate-400">
              {category} · {durationMinutes} mins · {questions.length} Questions
            </div>
            <div className="text-slate-700 dark:text-slate-300 font-medium">
              Total Marks: {questions.length * correctMark} (+{correctMark} / {incorrectMark})
            </div>
          </div>

          {/* Schedule Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Schedule Window</span>
            {isScheduled ? (
              <>
                <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>Scheduled Window</span>
                </span>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                  <strong>Opens:</strong> {formatDateTime12h(startTime)}
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                  <strong>Closes:</strong> {formatDateTime12h(endTime)}
                </div>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Open / Flexible Window</span>
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Candidates can start this assessment at any time.
                </p>
              </>
            )}
          </div>

          {/* Candidate Access & Solutions Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Candidate Access Rules</span>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span>Attempt Limit:</span>
              <strong>{isUnlimitedAttempts ? 'Unlimited (∞)' : `${maxAttemptsValue} Attempts`}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span>Practice Mode:</span>
              <strong className={allowPracticeMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                {allowPracticeMode ? (isScheduled ? 'After schedule ends' : 'Allowed anytime') : 'Disabled'}
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span>View Responses:</span>
              <strong className={allowReviewResponses ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                {allowReviewResponses ? (isScheduled ? 'Released after schedule' : 'Available immediately') : 'Hidden / Disabled'}
              </strong>
            </div>
          </div>

          {/* Proctoring Rules Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Proctoring Enforcement</span>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-400">
              <span className={faceCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                {faceCheck ? '●' : '○'} Face Detection
              </span>
              <span className={audioCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                {audioCheck ? '●' : '○'} Audio Monitor
              </span>
              <span className={fullScreenLock ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                {fullScreenLock ? '●' : '○'} Fullscreen Lock
              </span>
              <span className={objectCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                {objectCheck ? '●' : '○'} Device Detection
              </span>
            </div>
            <div className="text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400">
              Live alerts: <strong>{liveNotifications ? 'Enabled' : 'Disabled'}</strong>
            </div>
          </div>
        </div>

        {/* Question Bank Community Sharing Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Question Bank Contribution</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono">
              {contributedCount} / {questions.length} Items Contributed
            </span>
          </div>

          <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-0.5 cursor-pointer select-none">
            <span className="font-medium">Contribute all questions to bank:</span>
            <input
              type="checkbox"
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate;
              }}
              checked={allContributed}
              onChange={(e) => onToggleContributeAll?.(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-0 cursor-pointer accent-indigo-600"
            />
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            {allContributed
              ? 'All questions in this paper will be contributed to the shared Question Bank upon publishing.'
              : isIndeterminate
              ? `${contributedCount} of ${questions.length} questions will be contributed. Toggle above to contribute all.`
              : 'Questions will remain private to this examination unless marked individually.'}
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2.5 px-4 font-medium cursor-pointer"
          >
            Back to Editing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 font-medium cursor-pointer shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Publish Examination</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
