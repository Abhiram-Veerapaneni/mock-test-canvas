import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  ShieldOff,
  Maximize
} from 'lucide-react';

export default function ExamLockdownOverlays({
  isPractice,
  isFullscreenUnsupported,
  isFullscreenBlocked,
  isWindowBlurred,
  violationWarning,
  violationCount,
  trustScore,
  finalWarningModal,
  trustZeroModal,
  trustZeroCountdown,
  violationLabels = {},
  onDismissBlocker,
  onDismissWindowBlur,
  onDismissViolationWarning,
  onDismissFinalWarning
}) {
  if (isPractice) return null;

  return (
    <>
      {/* Fullscreen not supported warning banner */}
      {isFullscreenUnsupported && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-xs font-semibold text-center py-2 px-4 shadow-sm">
          ⚠️ Fullscreen mode is not supported in this browser. Proctoring may be limited.
        </div>
      )}

      {/* Fullscreen Blocked Overlay */}
      {isFullscreenBlocked && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white dark:bg-[#131926] border border-slate-100 dark:border-slate-800/80 rounded-lg p-6 md:p-8 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="bg-red-50 text-red-600 border border-red-100/50 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h2 className="text-slate-900 dark:text-slate-100 font-semibold tracking-tight text-lg text-center mb-2">
              Fullscreen Mode Exited
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed text-center mb-5 max-w-sm mx-auto">
              Exiting fullscreen during an examination is a recorded proctoring infraction. Your answers and timer have been paused until re-entry.
            </p>
            <div className="w-full text-center bg-red-50/70 border border-red-100 py-2.5 px-4 rounded-md text-[12px] font-semibold text-red-700 tracking-wide mb-6 dark:bg-red-950/40 dark:border-red-900/40 dark:text-red-400 tabular-nums">
              Total Infractions Recorded: {violationCount}
            </div>
            <button
              onClick={onDismissBlocker}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white shadow-sm shadow-indigo-600/20 active:scale-[0.98] text-sm font-medium py-2.5 rounded-md transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Maximize className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              <span>Re-enter Fullscreen to Continue Exam</span>
            </button>
            <p className="text-slate-400 text-[11px] text-center mt-4">All progress is safely preserved in real-time.</p>
          </div>
        </div>
      )}

      {/* Alt+Tab / Window Blur Overlay */}
      {isWindowBlurred && !isFullscreenBlocked && (
        <div className="fixed inset-0 z-[9997] bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white dark:bg-[#131926] border border-slate-100 dark:border-slate-800/80 rounded-lg p-6 md:p-8 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="bg-amber-50 text-amber-600 border border-amber-100/50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h2 className="text-slate-900 dark:text-slate-100 font-semibold tracking-tight text-lg text-center mb-2">
              Window Focus Lost
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed text-center mb-5 max-w-sm mx-auto">
              You switched away from the exam window. This event has been recorded in your candidate proctoring audit log.
            </p>
            <button
              onClick={onDismissWindowBlur}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white shadow-sm shadow-indigo-600/20 active:scale-[0.98] text-sm font-medium py-2.5 rounded-md transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Click to Return to Exam</span>
            </button>
            <p className="text-slate-400 text-[11px] text-center mt-4">All progress is safely preserved in real-time.</p>
          </div>
        </div>
      )}

      {/* Per-violation warning popup */}
      {violationWarning.open && (
        <div className="fixed inset-0 z-[9998] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg shadow-sm w-full max-w-sm overflow-hidden">
            <div className="h-1 bg-rose-500" />
            <div className="p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="shrink-0 w-9 h-9 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                    Proctoring Infraction
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {violationLabels[violationWarning.type] ?? violationWarning.type}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <div className="bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 rounded-md p-3 text-center">
                  <p className="text-[10px] uppercase font-medium text-rose-700 dark:text-rose-400 mb-0.5">Violations</p>
                  <p className="text-xl font-semibold text-rose-700 dark:text-rose-300 tabular-nums">{violationCount}</p>
                </div>
                <div
                  className={`border rounded-md p-3 text-center ${
                    trustScore >= 70
                      ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/60'
                      : trustScore >= 40
                      ? 'bg-orange-50/60 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-900/60'
                      : 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/60'
                  }`}
                >
                  <p className="text-[10px] uppercase font-medium text-slate-500 dark:text-slate-400 mb-0.5">Trust Score</p>
                  <p
                    className={`text-xl font-semibold tabular-nums ${
                      trustScore >= 70
                        ? 'text-amber-700 dark:text-amber-400'
                        : trustScore >= 40
                        ? 'text-orange-700 dark:text-orange-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {trustScore}
                    <span className="text-xs font-normal opacity-60">/100</span>
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mb-5">
                Repeated infractions will result in immediate examination termination.
              </p>

              <button
                onClick={onDismissViolationWarning}
                className="w-full py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white shadow-sm shadow-indigo-600/20 active:scale-[0.98] text-xs font-medium transition-all cursor-pointer shadow-sm"
              >
                I Acknowledge & Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* S4: Final warning modal */}
      {finalWarningModal && (
        <div className="fixed inset-0 z-[9998] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg shadow-sm w-full max-w-sm overflow-hidden">
            <div className="h-1 bg-amber-500" />
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">Critical Final Warning</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your candidate trust score has dropped to{' '}
                  <strong className="text-amber-600 dark:text-amber-400 tabular-nums">{trustScore}/100</strong>.{' '}
                  Any further violation will trigger automatic termination.
                </p>
              </div>
              <button
                onClick={onDismissFinalWarning}
                className="w-full py-2.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-all cursor-pointer shadow-sm"
              >
                I Understand — Resume Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trust-score-zero termination modal */}
      {trustZeroModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg shadow-sm w-full max-w-sm overflow-hidden">
            <div className="h-1 bg-rose-600" />
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center mx-auto">
                <ShieldOff className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">Assessment Terminated</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your trust score reached <strong className="text-rose-600 dark:text-rose-400">zero</strong> due to persistent infractions.
                  The test session is being finalized.
                </p>
              </div>
              <div className="bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 rounded-md p-3.5">
                <p className="text-[10px] uppercase font-medium text-rose-700 dark:text-rose-400 mb-1">Total Violations</p>
                <p className="text-3xl font-semibold text-rose-700 dark:text-rose-300 tabular-nums">{violationCount}</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submitting answers in <span className="font-mono font-medium text-rose-600 dark:text-rose-400 tabular-nums">{trustZeroCountdown}s</span>…
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
