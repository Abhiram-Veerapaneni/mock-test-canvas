import React, { useMemo } from 'react';
import useExamStore from '../../store/useExamStore';
import useProctorStore from '../../store/useProctorStore';
import { Clock, ShieldCheck, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ExamHeader({ onSubmitClick }) {
  const { exam, questions, currentIndex, timeRemainingSeconds } = useExamStore();
  const { violationCount, trustScore } = useProctorStore();

  const formattedTime = useMemo(() => {
    const hours = Math.floor(timeRemainingSeconds / 3600);
    const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
    const seconds = timeRemainingSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemainingSeconds]);

  const currentQuestion = questions[currentIndex];

  // Derive unique subject sections
  const subjects = useMemo(() => {
    if (!questions) return [];
    return Array.from(new Set(questions.map((q) => q.subject || 'General')));
  }, [questions]);

  const activeSubject = currentQuestion?.subject || 'General';
  const isLowTime = timeRemainingSeconds < 300; // Under 5 mins

  return (
    <header className="w-full bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border-b border-slate-200/90 dark:border-[#1f293d] px-4 sm:px-6 py-2.5 select-none transition-colors duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Exam Title & Category */}
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60">
            {exam?.category || 'EXAM'}
          </span>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight line-clamp-1">
              {exam?.title || 'Mock Examination'}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              <span>Marks: <strong className="text-slate-700 dark:text-slate-300 tabular-nums">{exam?.totalMarks || 100}</strong></span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">+{exam?.markingScheme?.correct ?? 4}</span>
              <span>/</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold tabular-nums">{exam?.markingScheme?.incorrect ?? -1}</span>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-[#090d16] p-1 rounded-xl border border-slate-200/80 dark:border-[#1f293d]">
          {subjects.map((subj) => (
            <div
              key={subj}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                subj === activeSubject
                  ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {subj}
            </div>
          ))}
        </div>

        {/* Question Counter, Timer & Submit */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#090d16] px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-[#1f293d] tabular-nums">
            <span className="font-bold text-slate-900 dark:text-white">Q {currentIndex + 1}</span>
            <span className="text-slate-400">/</span>
            <span>{questions.length}</span>
          </div>

          {/* Violation Badge + Trust Score */}
          {violationCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold tabular-nums">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{violationCount}</span>
              </div>

              <div className="hidden sm:block">
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-bold tabular-nums ${
                  trustScore >= 70
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400'
                    : trustScore >= 40
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900 text-orange-600 dark:text-orange-400'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{trustScore}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Timer Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono tracking-wider tabular-nums transition-colors ${
              isLowTime
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse'
                : 'bg-slate-50 dark:bg-[#090d16] border-slate-200/90 dark:border-[#1f293d] text-slate-800 dark:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedTime}</span>
          </div>

          {/* Submit Test Button */}
          <button
            type="button"
            onClick={onSubmitClick}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all cursor-pointer hover:shadow-md"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </div>
    </header>
  );
}
