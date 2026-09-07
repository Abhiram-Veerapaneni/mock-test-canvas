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
    let base = 'relative font-mono font-bold text-xs rounded-xl flex items-center justify-center transition-all cursor-pointer select-none';
    let ring = isCurrent ? ' ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-[#111827] z-10 scale-105 shadow-xs' : '';

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
        return `${base} bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80${ring}`;
    }
  };

  return (
    <aside className="w-full md:w-80 bg-white dark:bg-[#111827] border-t md:border-t-0 md:border-l border-slate-200/90 dark:border-[#1f293d] flex flex-col h-auto md:h-full overflow-hidden select-none shrink-0 transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-[#1f293d] bg-white dark:bg-[#111827] flex items-center justify-between shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Question Palette
        </h2>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
          {questions.length} Questions
        </span>
      </div>

      {/* Grid of question buttons */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-5 gap-2.5">
          {questions.map((q, idx) => {
            const st = questionStatus[q._id] || 'NOT_VISITED';
            const isCurrent = idx === currentIndex;
            const isAnsweredAndMarked = st === 'ANSWERED_AND_MARKED_FOR_REVIEW';

            return (
              <button
                key={q._id || idx}
                type="button"
                onClick={() => goToQuestion(idx)}
                className={`h-9 w-full ${getStatusBadgeStyle(st, isCurrent)}`}
                title={`Question ${idx + 1}: ${st.replace(/_/g, ' ')}`}
              >
                <span>{idx + 1}</span>
                {isAnsweredAndMarked && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-[#111827] shadow-xs"
                    title="Answered & Marked for Review"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Palette Status Legend */}
      <div className="p-4 border-t border-slate-200/80 dark:border-[#1f293d] bg-slate-50/80 dark:bg-[#090d16]/70 space-y-2.5 text-xs shrink-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Status Overview
        </div>
        <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-[10px] text-white shadow-2xs">
              {counts.answered}
            </span>
            <span className="truncate">Answered</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-rose-600 flex items-center justify-center font-bold text-[10px] text-white shadow-2xs">
              {counts.notAnswered}
            </span>
            <span className="truncate">Not Answered</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-[10px] text-white shadow-2xs">
              {counts.markedForReview}
            </span>
            <span className="truncate">Marked</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-[10px] text-white shadow-2xs">
              <span>{counts.answeredAndMarked}</span>
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-slate-900" />
            </div>
            <span className="truncate">Ans & Marked</span>
          </div>

          <div className="flex items-center gap-2 col-span-2 pt-1 border-t border-slate-200/60 dark:border-[#1f293d]">
            <span className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-[10px]">
              {counts.notVisited}
            </span>
            <span>Not Visited</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
