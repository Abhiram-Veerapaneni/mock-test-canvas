import React from 'react';
import {
  Loader2,
  CheckCircle2,
  FlaskConical,
  ShieldAlert,
  CheckCheck,
  ArrowRight
} from 'lucide-react';
import { formatTime12h } from '../../utils/dateUtils';

export default function ExamSubmissionResult({
  isSubmitting,
  snap,
  result,
  isPreview,
  isPractice,
  answeredCount = 0,
  submittedViolations = [],
  attemptId,
  savedResultData,
  submittedExamId,
  examId,
  violationLabels = {},
  navigate
}) {
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
        <p className="text-xs text-slate-500">Grading your answers...</p>
      </div>
    );
  }

  const reviewAttemptId =
    result?.attemptId || savedResultData?.result?.attemptId || attemptId;
  const targetExamId = submittedExamId || examId;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-2xl p-5 sm:p-6 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                Examination Submitted
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {snap?.title || 'Your responses have been recorded.'}
              </p>
            </div>
          </div>

          {isPreview ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              <FlaskConical className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>Preview</span>
            </span>
          ) : isPractice ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Practice</span>
            </span>
          ) : null}
        </div>

        {/* Unified Score Board */}
        {result ? (
          <div className="bg-slate-50 dark:bg-[#0C0F17] rounded-xl p-4 border border-slate-200/70 dark:border-slate-800/70 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Final Score
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                    {result.score}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    / {result.totalMarks ?? snap?.totalMarks ?? 0}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Accuracy
                </span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5 block">
                  {result.accuracy}%
                </span>
              </div>
            </div>

            {/* 3-Column Performance Breakdown */}
            <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-slate-800/80 border-t border-slate-200/70 dark:border-slate-800/70 pt-3 text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Correct</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                  {result.correct}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Wrong</div>
                <div className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
                  {result.incorrect}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Unanswered</div>
                <div className="text-base font-bold text-slate-700 dark:text-slate-300 tabular-nums mt-0.5">
                  {result.unanswered ?? Math.max(0, (snap?.totalQuestions ?? 0) - answeredCount)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-[#0C0F17] rounded-xl p-4 border border-slate-200/70 dark:border-slate-800/70 grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Questions</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                {snap?.totalQuestions ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Answered</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                {answeredCount}
              </div>
            </div>
          </div>
        )}

        {/* Violation log or Clean session badge */}
        {submittedViolations.length > 0 ? (
          <div className="rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/40 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {submittedViolations.length} Proctoring Infraction
                  {submittedViolations.length !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono">Logged</span>
            </div>
            <ul className="divide-y divide-rose-100 dark:divide-rose-900/30 max-h-32 overflow-y-auto">
              {submittedViolations.map((v, i) => (
                <li key={i} className="flex items-center justify-between py-1.5 text-[11px]">
                  <span className="text-slate-700 dark:text-slate-300">
                    {violationLabels[v.type] ?? v.type}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {formatTime12h(v.timestamp, { includeSeconds: true })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 text-xs text-emerald-700 dark:text-emerald-400">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Session Verified</span>
            </div>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
              0 Infractions
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          {reviewAttemptId && (
            <button
              type="button"
              onClick={() => navigate(`/test/${targetExamId}/review/${reviewAttemptId}`)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Review Responses & Solutions</span>
            </button>
          )}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => navigate(`/test/${targetExamId}`)}
              className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm active:scale-[0.98] dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium transition cursor-pointer"
            >
              View Attempts
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm active:scale-[0.98] dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
