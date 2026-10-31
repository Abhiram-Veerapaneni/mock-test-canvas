import React from 'react';
import { Clock, ShieldCheck, FlaskConical } from 'lucide-react';
import { formatDateTime12h } from '../../utils/dateUtils';

export default function ResponseScoreBanner({ exam, attempt }) {
  const formatSeconds = (sec) => {
    if (!sec || sec <= 0) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return formatDateTime12h(dateStr, { includeYear: true, includeSeconds: true });
  };

  return (
    <div className="rounded-lg bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none p-6 space-y-6 shadow-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Response Sheet & Solutions
            </span>
            {attempt.isPractice ? (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <FlaskConical className="w-3 h-3 text-slate-400" />
                <span>Practice Session</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Official Proctored</span>
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {exam.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
            <span>Submitted: {formatDate(attempt.submittedAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Time Taken: <strong className="text-slate-700 dark:text-slate-300 font-medium">{formatSeconds(attempt.timeTakenSeconds)}</strong>
            </span>
          </p>
        </div>

        {/* Score Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 rounded-lg bg-slate-50/50 dark:bg-[#162030]/50 text-center min-w-[320px]">
          <div className="p-3.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Score</span>
            <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums block mt-0.5">
              {attempt.score} <span className="text-xs font-normal text-slate-400">/ {exam.totalMarks}</span>
            </span>
          </div>
          <div className="p-3.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Accuracy</span>
            <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums block mt-0.5">{attempt.accuracy}%</span>
          </div>
          <div className="p-3.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Correct</span>
            <span className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums block mt-0.5">{attempt.correct}</span>
          </div>
          <div className="p-3.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Incorrect</span>
            <span className="text-2xl font-semibold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums block mt-0.5">{attempt.incorrect}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

