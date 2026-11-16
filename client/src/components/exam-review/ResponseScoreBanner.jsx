import React from 'react';
import { Clock, ShieldCheck, FlaskConical, Calendar } from 'lucide-react';
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
    return formatDateTime12h(dateStr, { includeYear: true, includeSeconds: false });
  };

  return (
    <div className="rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none px-4 py-3 sm:px-5 sm:py-3.5 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6">
        {/* Left: Identity, Context & Metadata */}
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
            {attempt.isPractice ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/40">
                <FlaskConical className="w-3 h-3 text-amber-500" />
                <span>Practice Session</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/40">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Official Proctored</span>
              </span>
            )}

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Submitted {formatDate(attempt.submittedAt)}</span>
            </span>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Time Taken: <strong className="font-semibold text-slate-700 dark:text-slate-300">{formatSeconds(attempt.timeTakenSeconds)}</strong></span>
            </span>
          </div>

          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
            {exam.title}
          </h1>
        </div>

        {/* Right: Low-Profile High-Density Performance KPI Strip */}
        <div className="flex items-center divide-x divide-slate-200/80 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 rounded-lg bg-slate-50/70 dark:bg-[#162030]/60 p-1 sm:p-1.5 self-start lg:self-auto shrink-0 shadow-xs">
          {/* Score */}
          <div className="px-3 sm:px-3.5 py-0.5 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Score
            </span>
            <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100 tabular-nums leading-tight">
              {attempt.score}
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-0.5">/{exam.totalMarks}</span>
            </span>
          </div>

          {/* Accuracy */}
          <div className="px-3 sm:px-3.5 py-0.5 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Accuracy
            </span>
            <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100 tabular-nums leading-tight">
              {attempt.accuracy}%
            </span>
          </div>

          {/* Correct */}
          <div className="px-3 sm:px-3.5 py-0.5 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Correct
            </span>
            <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight">
              {attempt.correct}
            </span>
          </div>

          {/* Incorrect */}
          <div className="px-3 sm:px-3.5 py-0.5 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Incorrect
            </span>
            <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 tabular-nums leading-tight">
              {attempt.incorrect}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
