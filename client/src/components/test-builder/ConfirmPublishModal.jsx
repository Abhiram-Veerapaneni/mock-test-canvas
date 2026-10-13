import React from 'react';
import { CheckCheck, CheckCircle2, Loader2, X } from 'lucide-react';
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
  liveNotifications
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-6 space-y-5 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <CheckCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Confirm Examination Parameters</h3>
              <p className="text-xs text-slate-500">
                Review your test rules, scheduling window, and proctoring parameters before publishing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Test Meta Card */}
          <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Assessment Details</span>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{title}</div>
            <div className="text-slate-500">
              {category} · {durationMinutes} mins · {questions.length} Questions
            </div>
            <div className="text-slate-700 dark:text-slate-300 font-medium">
              Total Marks: {questions.length * correctMark} (+{correctMark} / {incorrectMark})
            </div>
          </div>

          {/* Schedule Card */}
          <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Schedule Window</span>
            {isScheduled ? (
              <>
                <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
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
                <p className="text-slate-500 text-[11px]">
                  Candidates can start this assessment at any time.
                </p>
              </>
            )}
          </div>

          {/* Candidate Access & Solutions Card */}
          <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/60 space-y-1.5">
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
          <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/60 space-y-1.5">
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
            <div className="text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700 text-slate-500">
              Live alerts: <strong>{liveNotifications ? 'Enabled' : 'Disabled'}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4"
          >
            Back to Editing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="btn-primary text-xs py-2 px-5 flex items-center gap-2"
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
    </div>
  );
}
