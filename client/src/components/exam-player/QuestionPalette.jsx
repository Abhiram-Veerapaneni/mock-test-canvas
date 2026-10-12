import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import useExamStore from '../../store/useExamStore';

export default function QuestionPalette() {
  const {
    questions,
    currentIndex,
    questionStatus,
    answers,
    goToQuestion
  } = useExamStore();

  // Helper to resolve the visual state of a question
  const getQuestionVisualState = (q, idx) => {
    const isCurrent = idx === currentIndex;
    const ans = answers[q._id];
    const hasAnswer = ans !== undefined && ans !== null && (Array.isArray(ans) ? ans.length > 0 : String(ans).trim() !== '');
    const st = questionStatus[q._id] || 'NOT_VISITED';

    // 1. Answered & Marked for Review -> purple with green tick
    if (st === 'ANSWERED_AND_MARKED_FOR_REVIEW' || (hasAnswer && st === 'MARKED_FOR_REVIEW')) {
      return 'ANSWERED_AND_MARKED';
    }
    // 2. Review (without answer) -> purple
    if (st === 'MARKED_FOR_REVIEW') {
      return 'MARKED_FOR_REVIEW';
    }
    // 3. Answered -> green
    if (st === 'ANSWERED' || hasAnswer) {
      return 'ANSWERED';
    }
    // 4. Currently selected question that is not yet answered -> blue
    if (isCurrent && !hasAnswer) {
      return 'SELECTED_UNANSWERED';
    }
    // 5. Left without answering -> red
    if (st === 'NOT_ANSWERED') {
      return 'NOT_ANSWERED';
    }
    // 6. Not visited -> neutral gray
    return 'NOT_VISITED';
  };

  // Compute status metrics for the legend
  const counts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let notVisited = 0;
    let markedForReview = 0;
    let answeredAndMarked = 0;
    let selectedUnanswered = 0;

    questions.forEach((q, idx) => {
      const state = getQuestionVisualState(q, idx);
      if (state === 'ANSWERED') answered++;
      else if (state === 'NOT_ANSWERED') notAnswered++;
      else if (state === 'MARKED_FOR_REVIEW') markedForReview++;
      else if (state === 'ANSWERED_AND_MARKED') answeredAndMarked++;
      else if (state === 'SELECTED_UNANSWERED') selectedUnanswered++;
      else notVisited++;
    });

    return { answered, notAnswered, notVisited, markedForReview, answeredAndMarked, selectedUnanswered };
  }, [questions, questionStatus, currentIndex, answers]);

  const getStatusBadgeStyle = (visualState, isCurrent) => {
    const base = 'relative font-mono font-bold text-xs rounded-xl flex items-center justify-center transition-all cursor-pointer select-none';
    const ring = isCurrent ? ' ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-[#111827] z-10 scale-105 shadow-md' : '';

    switch (visualState) {
      case 'SELECTED_UNANSWERED':
        // Rule 1: Selected question not yet answered -> Blue
        return `${base} bg-blue-600 hover:bg-blue-700 text-white shadow-xs${ring}`;
      case 'NOT_ANSWERED':
        // Rule 2: Left without answering -> Red
        return `${base} bg-rose-600 hover:bg-rose-700 text-white shadow-xs${ring}`;
      case 'MARKED_FOR_REVIEW':
        // Rule 3: Review -> Purple
        return `${base} bg-purple-600 hover:bg-purple-700 text-white shadow-xs${ring}`;
      case 'ANSWERED_AND_MARKED':
        // Rule 4: Answered & Review -> Purple (with green tick)
        return `${base} bg-purple-600 hover:bg-purple-700 text-white shadow-xs${ring}`;
      case 'ANSWERED':
        // Rule 5: Answered -> Green
        return `${base} bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs${ring}`;
      case 'NOT_VISITED':
      default:
        return `${base} bg-slate-100 dark:bg-[#1f2937] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800${ring}`;
    }
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 bg-white dark:bg-[#111827] border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 flex flex-col h-auto md:h-full overflow-hidden select-none shrink-0 transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex items-center justify-between shrink-0">
        <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Question Palette
        </h2>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-800">
          {questions.length} Questions
        </span>
      </div>

      {/* Grid of question buttons */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const visualState = getQuestionVisualState(q, idx);
            const isAnsweredAndMarked = visualState === 'ANSWERED_AND_MARKED';

            return (
              <button
                key={q._id || idx}
                type="button"
                onClick={() => goToQuestion(idx)}
                className={`h-9 w-full ${getStatusBadgeStyle(visualState, isCurrent)}`}
                title={`Question ${idx + 1}: ${visualState.replace(/_/g, ' ')}`}
              >
                <span>{idx + 1}</span>
                {/* Rule 4: Answered and Review has a green tick */}
                {isAnsweredAndMarked && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111827] flex items-center justify-center shadow-xs z-10"
                    title="Answered & Marked for Review"
                  >
                    <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Palette Status Legend */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#1f2937]/50 space-y-2.5 text-xs shrink-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Palette Legend
        </div>
        <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 text-[11px]">
          {/* Rule 1: Selected (Not Yet Answered) -> Blue */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-[10px] text-white shadow-2xs ring-1 ring-blue-400">
              {counts.selectedUnanswered}
            </span>
            <span className="truncate">Selected (Unanswered)</span>
          </div>

          {/* Rule 2: Left without answering -> Red */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-rose-600 flex items-center justify-center font-bold text-[10px] text-white shadow-2xs">
              {counts.notAnswered}
            </span>
            <span className="truncate">Left (Unanswered)</span>
          </div>

          {/* Rule 5: Answered -> Green */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-[10px] text-white shadow-2xs">
              {counts.answered}
            </span>
            <span className="truncate">Answered</span>
          </div>

          {/* Rule 3: Review -> Purple */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-[10px] text-white shadow-2xs">
              {counts.markedForReview}
            </span>
            <span className="truncate">Review</span>
          </div>

          {/* Rule 4: Answered and Review -> Purple with a green tick */}
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-[10px] text-white shadow-2xs">
              <span>{counts.answeredAndMarked}</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-slate-900 flex items-center justify-center">
                <Check className="w-2 h-2 text-white stroke-[3.5]" />
              </span>
            </div>
            <span className="truncate">Ans & Review</span>
          </div>

          {/* Not Visited -> Neutral Gray */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-[#1f2937] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-[10px]">
              {counts.notVisited}
            </span>
            <span className="truncate">Not Visited</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
