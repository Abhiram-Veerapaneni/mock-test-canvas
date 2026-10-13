import React from 'react';
import { Image as ImageIcon, HelpCircle } from 'lucide-react';
import MathRenderer from '../common/MathRenderer';

export default function ExamQuestionsTab({
  questions = [],
  exam,
  examId,
  showAnswerKey,
  revealedQuestions,
  onToggleQuestionReveal,
  onPreviewImage,
  navigate
}) {
  if (questions.length === 0) {
    return (
      <div className="p-12 text-center card-base">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No questions added yet
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Click below to author or import questions for this examination.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/create-test?examId=${examId}`)}
          className="mt-4 btn-primary"
        >
          Add Questions Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const qId = q._id ? q._id.toString() : String(idx);
        const isNAT = q.type === 'NAT';
        const correctAnswers = q.correctAnswers || q.correctAnswer || [];
        const isRevealed = showAnswerKey || revealedQuestions.has(qId);

        return (
          <div
            key={qId}
            className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 space-y-4"
          >
            {/* Question Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Question {idx + 1}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400">
                  {q.type || 'MCQ'}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">
                  +{q.marks || exam.markingScheme?.correct || 4} /{' '}
                  {-(q.negativeMarks || Math.abs(exam.markingScheme?.incorrect || 1))} pts
                </span>
                {q.isEdited && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    [Edited]
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="text-slate-400">
                  {q.subject && <span>{q.subject}</span>}
                  {q.topic && <span> • {q.topic}</span>}
                </div>
                {!showAnswerKey && (
                  <button
                    type="button"
                    onClick={() => onToggleQuestionReveal(qId)}
                    className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 underline cursor-pointer"
                  >
                    {isRevealed ? 'Hide Answer' : 'Reveal Answer'}
                  </button>
                )}
              </div>
            </div>

            {/* Statement */}
            {q.questionText && (
              <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                <MathRenderer text={q.questionText} />
              </div>
            )}

            {/* Question Diagram / Image Attachment */}
            {q.imageAttachment && (
              <div className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 inline-block">
                <img
                  src={q.imageAttachment}
                  alt={`Question ${idx + 1} diagram`}
                  onClick={() => onPreviewImage(q.imageAttachment)}
                  className="max-h-56 max-w-full rounded object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
                />
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  <span>Click image to zoom</span>
                </div>
              </div>
            )}

            {/* Options Grid */}
            {!isNAT && Array.isArray(q.options) && q.options.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt, optIdx) => {
                  const optText = typeof opt === 'object' ? opt.text : opt;
                  const optImg = typeof opt === 'object' ? opt.image : null;
                  const isCorrect =
                    isRevealed &&
                    ((Array.isArray(correctAnswers) &&
                      (correctAnswers.includes(optIdx) || correctAnswers.includes(optText))) ||
                      correctAnswers === optIdx ||
                      correctAnswers === optText);

                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-lg border flex items-start gap-2.5 transition-colors ${
                        isCorrect
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60'
                          : 'bg-white dark:bg-[#131926] border-slate-200/80 dark:border-slate-800/80'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded text-xs font-medium flex items-center justify-center shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        {optText && (
                          <div className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                            <MathRenderer text={optText} />
                          </div>
                        )}
                        {optImg && (
                          <img
                            src={optImg}
                            alt={`Option ${String.fromCharCode(65 + optIdx)}`}
                            onClick={() => onPreviewImage(optImg)}
                            className="max-h-24 max-w-full rounded object-contain cursor-zoom-in border border-slate-200 dark:border-slate-700 bg-white"
                          />
                        )}
                      </div>

                      {isCorrect && (
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* NAT correct range */}
            {isNAT &&
              (isRevealed ? (
                <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 text-xs">
                  <span className="font-medium text-emerald-800 dark:text-emerald-300 mr-2">
                    Numerical Correct Range:
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {Array.isArray(correctAnswers)
                      ? correctAnswers.join(' to ')
                      : String(correctAnswers)}
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-400 italic flex items-center justify-between">
                  <span>Numerical Answer (Answer key hidden)</span>
                  <button
                    type="button"
                    onClick={() => onToggleQuestionReveal(qId)}
                    className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 underline cursor-pointer"
                  >
                    Reveal
                  </button>
                </div>
              ))}

            {/* Pedagogical Explanation */}
            {isRevealed && q.explanation && (
              <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Explanation:</span>
                </div>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                  <MathRenderer text={q.explanation} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
