import React from 'react';
import MathRenderer from '../common/MathRenderer';
import { HelpCircle, Check, X } from 'lucide-react';

export default function ResponseQuestionCard({ question: q, onPreviewImage }) {
  const isCorrect = q.isCorrect;
  const isSkipped = !q.isAnswered;

  return (
    <div
      id={`review-question-${q.questionIndex}`}
      className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-4 shadow-none transition-colors"
    >
      {/* Question Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-md bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center shadow-xs">
            {q.questionIndex}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
              {q.subject || 'General'}
            </span>
            {q.topic && q.topic !== 'General' && (
              <span className="text-[10px] text-slate-400">({q.topic})</span>
            )}
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {q.questionType || 'MCQ'}
            </span>
          </div>
        </div>

        {/* Marks / Status Badge */}
        <div>
          {isCorrect ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>+{q.marksAwarded} Marks</span>
            </span>
          ) : isSkipped ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>0 Marks (Skipped)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{q.marksAwarded} Marks</span>
            </span>
          )}
        </div>
      </div>

      {/* Question Statement */}
      <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed pl-0.5 font-normal">
        <MathRenderer text={q.questionText} />
      </div>

      {/* Image Attachment (if any) */}
      {q.imageAttachment && (
        <div className="rounded-md overflow-hidden bg-slate-100 dark:bg-[#0C0F17] p-2 border border-slate-200/80 dark:border-slate-800/80 max-w-md">
          <img
            src={q.imageAttachment}
            alt="Question diagram"
            className="max-h-52 w-auto object-contain cursor-zoom-in rounded"
            onClick={() => onPreviewImage(q.imageAttachment)}
          />
        </div>
      )}

      {/* Options List with Verified Badges */}
      {Array.isArray(q.options) && q.options.length > 0 && (
        <div className="space-y-2 pt-1">
          {q.options.map((opt, oIdx) => {
            const letter = String.fromCharCode(65 + oIdx);
            const optText = typeof opt === 'object' ? (opt.text || '') : opt;
            const optImg = typeof opt === 'object' ? (opt.image || '') : '';

            const isUserSelected = (q.selectedAnswers || []).includes(oIdx);
            const isCorrectAnswer = (q.correctAnswers || []).includes(oIdx);

            let borderStyle = 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] text-slate-800 dark:text-slate-200';
            let badgeEl = null;

            if (isUserSelected && isCorrectAnswer) {
              borderStyle = 'border-emerald-500 dark:border-emerald-500 ring-1 ring-emerald-500/20 bg-white dark:bg-[#131926] text-slate-900 dark:text-slate-100 shadow-xs';
              badgeEl = (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Your Answer (Correct)
                </span>
              );
            } else if (isUserSelected && !isCorrectAnswer) {
              borderStyle = 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500/20 bg-white dark:bg-[#131926] text-slate-900 dark:text-slate-100 shadow-xs';
              badgeEl = (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                  <X className="w-3.5 h-3.5 stroke-[2.5]" /> Your Answer (Incorrect)
                </span>
              );
            } else if (isCorrectAnswer) {
              borderStyle = 'border-emerald-500/80 dark:border-emerald-500/80 bg-white dark:bg-[#131926] text-slate-900 dark:text-slate-100';
              badgeEl = (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Correct Solution
                </span>
              );
            }

            return (
              <div
                key={oIdx}
                className={`p-3 rounded-md border flex items-start justify-between gap-3 text-xs transition-colors ${borderStyle}`}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span className={`w-5 h-5 rounded flex items-center justify-center font-medium text-xs shrink-0 ${
                    isCorrectAnswer
                      ? 'bg-emerald-600 text-white'
                      : isUserSelected
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {letter}
                  </span>
                  <div className="space-y-1">
                    <MathRenderer text={optText} />
                    {optImg && (
                      <img
                        src={optImg}
                        alt={`Option ${letter}`}
                        className="max-h-28 rounded border border-slate-200/80 dark:border-slate-800/80 cursor-zoom-in"
                        onClick={() => onPreviewImage(optImg)}
                      />
                    )}
                  </div>
                </div>
                {badgeEl}
              </div>
            );
          })}
        </div>
      )}

      {/* Step-by-Step Explanation */}
      {q.explanation && (
        <div className="p-4 rounded-md bg-slate-50 dark:bg-[#162030]/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1.5 mt-3">
          <span className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Detailed Solution & Explanation:</span>
          </span>
          <div className="text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
            <MathRenderer text={q.explanation} />
          </div>
        </div>
      )}
    </div>
  );
}

