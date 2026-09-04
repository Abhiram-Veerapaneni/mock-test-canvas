import React, { useMemo } from 'react';
import useExamStore from '../../store/useExamStore';

export default function QuestionPalette() {
  const {
    questions,
    currentIndex,
    questionStatus,
    goToQuestion
  } = useExamStore();

  // Compute status metrics
  const counts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let notVisited = 0;
    let markedForReview = 0;
    let answeredAndMarked = 0;

    questions.forEach((q) => {
      const st = questionStatus[q._id] || 'NOT_VISITED';
      if (st === 'ANSWERED') answered++;
      else if (st === 'NOT_ANSWERED') notAnswered++;
      else if (st === 'MARKED_FOR_REVIEW') markedForReview++;
      else if (st === 'ANSWERED_AND_MARKED_FOR_REVIEW') answeredAndMarked++;
      else notVisited++;
    });

    return { answered, notAnswered, notVisited, markedForReview, answeredAndMarked };
  }, [questions, questionStatus]);

  const getStatusBadgeStyle = (status, isCurrent) => {
    let base = 'relative font-mono font-medium text-xs rounded-lg flex items-center justify-center transition-colors cursor-pointer select-none';
    let ring = isCurrent ? ' ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 z-10' : '';

    switch (status) {
      case 'ANSWERED':
        return `${base} bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs${ring}`;
      case 'NOT_ANSWERED':
        return `${base} bg-rose-600 hover:bg-rose-700 text-white shadow-xs${ring}`;
      case 'MARKED_FOR_REVIEW':
        return `${base} bg-amber-500 hover:bg-amber-600 text-white shadow-xs${ring}`;
      case 'ANSWERED_AND_MARKED_FOR_REVIEW':
        return `${base} bg-amber-500 hover:bg-amber-600 text-white shadow-xs${ring}`;
      case 'NOT_VISITED':
      default:
        return `${base} bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700${ring}`;
    }
  };

  return (
    <aside className="w-full md:w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Question Palette
        </h2>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
          {questions.length} Items
        </span>
      </div>

      {/* Grid of question buttons */}
      <div className="flex-1 p-3.5 overflow-y-auto">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const st = questionStatus[q._id] || 'NOT_VISITED';
            const isCurrent = idx === currentIndex;
            const isAnsweredAndMarked = st === 'ANSWERED_AND_MARKED_FOR_REVIEW';

            return (
              <button
                key={q._id || idx}
                type="button"
                onClick={() => goToQuestion(idx)}
                className={`h-8 w-full ${getStatusBadgeStyle(st, isCurrent)}`}
                title={`Question ${idx + 1}: ${st.replace(/_/g, ' ')}`}
              >
                <span>{idx + 1}</span>
                {isAnsweredAndMarked && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 shadow-xs"
                    title="Answered & Marked for Review"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Palette Legend */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2 text-xs">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
          Status Legend
        </div>
        <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-emerald-600 flex items-center justify-center font-bold text-[9px] text-white">
              {counts.answered}
            </span>
            <span className="truncate">Answered</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-rose-600 flex items-center justify-center font-bold text-[9px] text-white">
              {counts.notAnswered}
            </span>
            <span className="truncate">Not Answered</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center font-bold text-[9px] text-white">
              {counts.markedForReview}
            </span>
            <span className="truncate">Marked</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative w-4 h-4 rounded bg-amber-500 flex items-center justify-center font-bold text-[9px] text-white">
              <span>{counts.answeredAndMarked}</span>
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-slate-900" />
            </div>
            <span className="truncate">Ans & Marked</span>
          </div>

          <div className="flex items-center gap-1.5 col-span-2">
            <span className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-[9px]">
              {counts.notVisited}
            </span>
            <span>Not Visited</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
