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

    // 1. Answered & Marked for Review
    if (st === 'ANSWERED_AND_MARKED_FOR_REVIEW' || (hasAnswer && st === 'MARKED_FOR_REVIEW')) {
      return isCurrent ? 'ANSWERED_MARKED_CURRENT' : 'ANSWERED_AND_MARKED';
    }
    // 2. Review (without answer)
    if (st === 'MARKED_FOR_REVIEW') {
      return isCurrent ? 'MARKED_CURRENT' : 'MARKED_FOR_REVIEW';
    }
    // 3. Answered + Selected (Current View)
    if ((st === 'ANSWERED' || hasAnswer) && isCurrent) {
      return 'ANSWERED_CURRENT';
    }
    // 4. Answered (Not currently selected)
    if (st === 'ANSWERED' || hasAnswer) {
      return 'ANSWERED';
    }
    // 5. Selected but Unanswered (Active Focus)
    if (isCurrent && !hasAnswer) {
      return 'SELECTED_UNANSWERED';
    }
    // 6. Skipped / Negative State (Action Needed)
    if (st === 'NOT_ANSWERED') {
      return 'NOT_ANSWERED';
    }
    // 7. Not visited -> neutral gray
    return 'NOT_VISITED';
  };

  // Compute status metrics for the legend
  const counts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let notVisited = 0;
    let markedForReview = 0;
    let activeView = 0;

    questions.forEach((q, idx) => {
      const state = getQuestionVisualState(q, idx);
      if (idx === currentIndex) activeView++;
      if (state === 'ANSWERED' || state === 'ANSWERED_CURRENT') answered++;
      else if (state === 'NOT_ANSWERED') notAnswered++;
      else if (state === 'MARKED_FOR_REVIEW' || state === 'ANSWERED_AND_MARKED' || state === 'ANSWERED_MARKED_CURRENT' || state === 'MARKED_CURRENT') markedForReview++;
      else if (state === 'NOT_VISITED') notVisited++;
    });

    return { answered, notAnswered, notVisited, markedForReview, activeView };
  }, [questions, questionStatus, currentIndex, answers]);

  const getButtonStyles = (visualState) => {
    const base = 'w-9 h-9 md:w-10 md:h-10 rounded-md flex items-center justify-center font-semibold text-[13px] transition cursor-pointer select-none relative focus:outline-none';

    switch (visualState) {
      // 3. Answered + Selected: Emerald green with top blue accent line
      case 'ANSWERED_CURRENT':
        return `${base} bg-emerald-600 text-white shadow-sm hover:bg-emerald-700`;
      
      // 2. Answered: Emerald green base
      case 'ANSWERED':
        return `${base} bg-emerald-600 text-white shadow-sm hover:bg-emerald-700`;

      // 4. Selected but Unanswered (Active Focus): Blue state
      case 'SELECTED_UNANSWERED':
        return `${base} bg-blue-600 text-white hover:bg-blue-700 shadow-sm`;

      // 5. Attempt Unsaved / Flagged (Markup/Review)
      case 'MARKED_FOR_REVIEW':
      case 'MARKED_CURRENT':
      case 'ANSWERED_AND_MARKED':
      case 'ANSWERED_MARKED_CURRENT':
        return `${base} bg-amber-500 text-white hover:bg-amber-600 shadow-sm`;

      // 6. Skipped / Negative State (Action Needed)
      case 'NOT_ANSWERED':
        return `${base} bg-rose-500 text-white hover:bg-rose-600`;

      // 1. Default (Not Visited): Gray-scale neutral outline
      case 'NOT_VISITED':
      default:
        return `${base} bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-[#162030] dark:border-slate-700 dark:text-slate-300`;
    }
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 bg-white dark:bg-[#131926] border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-slate-800/80 flex flex-col h-auto md:h-full overflow-hidden select-none shrink-0 transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Question Palette</span>
          <span className="font-mono text-slate-400 dark:text-slate-500 font-normal">
            {questions.length} Questions
          </span>
        </div>
      </div>

      {/* Grid of question buttons */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-5 gap-2.5 md:gap-3 place-items-center">
          {questions.map((q, idx) => {
            const visualState = getQuestionVisualState(q, idx);
            const isCurrent = idx === currentIndex;
            const isAnsweredCurrent = visualState === 'ANSWERED_CURRENT';
            const isAnsweredAndMarked = visualState === 'ANSWERED_AND_MARKED' || visualState === 'ANSWERED_MARKED_CURRENT';

            return (
              <button
                key={q._id || idx}
                type="button"
                onClick={() => goToQuestion(idx)}
                className={getButtonStyles(visualState)}
                title={`Question ${idx + 1}: ${visualState.replace(/_/g, ' ')}`}
              >
                <span>{idx + 1}</span>

                {/* Answered + Selected: small horizontal blue accent line centered on top edge */}
                {(isAnsweredCurrent || (isCurrent && visualState !== 'SELECTED_UNANSWERED')) && (
                  <span className="w-4 h-0.5 rounded-full bg-blue-400 absolute top-1 left-1/2 -translate-x-1/2" />
                )}

                {/* Answered & Marked: small check tick */}
                {isAnsweredAndMarked && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-slate-900 flex items-center justify-center z-10"
                    title="Answered & Marked for Review"
                  >
                    <Check className="w-2 h-2 text-white stroke-[3.5]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Palette Status Legend */}
      <div className="mt-auto border-t border-slate-100 dark:border-slate-800/80 p-4 pt-4 flex flex-col gap-2.5 shrink-0 bg-white dark:bg-[#131926]">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            <span>Active View</span>
          </div>
          <span className="font-mono tabular-nums text-slate-400">{counts.activeView}</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
            <span>Answered</span>
          </div>
          <span className="font-mono tabular-nums text-slate-400">{counts.answered}</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>Marked for Review</span>
          </div>
          <span className="font-mono tabular-nums text-slate-400">{counts.markedForReview}</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>Skipped / Unanswered</span>
          </div>
          <span className="font-mono tabular-nums text-slate-400">{counts.notAnswered}</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full border border-slate-400 bg-slate-100 dark:bg-slate-800/80 shrink-0" />
            <span>Unvisited</span>
          </div>
          <span className="font-mono tabular-nums text-slate-400">{counts.notVisited}</span>
        </div>
      </div>
    </aside>
  );
}
