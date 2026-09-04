import React, { useMemo } from 'react';
import useExamStore from '../../store/useExamStore';
import { Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ExamHeader({ onSubmitClick }) {
  const { exam, questions, currentIndex, timeRemainingSeconds } = useExamStore();

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
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 select-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Exam Title & Category */}
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60">
            {exam?.category || 'EXAM'}
          </span>
          <div>
            <h1 className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight line-clamp-1">
              {exam?.title || 'Mock Examination'}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              <span>Marks: {exam?.totalMarks || 100}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400">+{exam?.markingScheme?.correct ?? 4}</span>
              <span>/</span>
              <span className="text-rose-600 dark:text-rose-400">{exam?.markingScheme?.incorrect ?? -1}</span>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          {subjects.map((subj) => (
            <div
              key={subj}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                subj === activeSubject
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {subj}
            </div>
          ))}
        </div>

        {/* Question Counter, Timer & Submit */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-medium text-slate-900 dark:text-white">Q {currentIndex + 1}</span>
            <span className="text-slate-400">/</span>
            <span>{questions.length}</span>
          </div>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono text-xs font-semibold tabular-nums transition-colors ${
              isLowTime
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isLowTime ? 'text-rose-500' : 'text-slate-500'}`} />
            <span>{formattedTime}</span>
          </div>

          {/* Submit Exam Button */}
          <button
            onClick={onSubmitClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Submit</span>
          </button>
        </div>
      </div>
    </header>
  );
}
