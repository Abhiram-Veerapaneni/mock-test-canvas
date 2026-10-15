import React from 'react';
import {
  Eye,
  EyeOff,
  Plus,
  Database,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import MathRenderer from '../common/MathRenderer';

const getOptionLabel = (idx) => String.fromCharCode(65 + idx);

const formatOption = (opt) => {
  if (typeof opt === 'object' && opt !== null) {
    return { text: opt.text || '', image: opt.image || '' };
  }
  return { text: String(opt || ''), image: '' };
};

export default function QuestionListSection({
  questions = [],
  correctMark,
  incorrectMark,
  showAnswerKey,
  setShowAnswerKey,
  onMoveUp,
  onMoveDown,
  onEdit,
  onRemove,
  onToggleContribute,
  onToggleContributeAll,
  onPreviewImage
}) {
  const contributedCount = questions.filter((q) =>
    Boolean(q.contributeToBank !== undefined ? q.contributeToBank : q.isInBank)
  ).length;
  const allContributed = questions.length > 0 && contributedCount === questions.length;
  const isIndeterminate = contributedCount > 0 && contributedCount < questions.length;
  return (
    <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Question Items ({questions.length})
          </h3>
          <span className="text-xs text-slate-400">
            • Re-order or edit questions
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Contribute All to Bank Option */}
          {questions.length > 0 && (
            <label
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border select-none ${
                allContributed
                  ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 font-medium'
                  : 'bg-white dark:bg-[#131926] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              title={
                allContributed
                  ? 'All questions are contributed to the bank. Click to remove all.'
                  : isIndeterminate
                  ? `${contributedCount} of ${questions.length} questions contributed. Click to contribute all.`
                  : 'Contribute all questions to the shared Question Bank'
              }
            >
              <input
                type="checkbox"
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                checked={allContributed}
                onChange={(e) => onToggleContributeAll?.(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-0 cursor-pointer accent-indigo-600"
              />
              <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Contribute All to Bank</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 tabular-nums">
                {contributedCount}/{questions.length}
              </span>
            </label>
          )}

          {/* Client-Side View Adjustment: Answer Key Toggle */}
          <button
            type="button"
            onClick={() => setShowAnswerKey((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${showAnswerKey
              ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 font-medium'
              : 'bg-white dark:bg-[#131926] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            title={showAnswerKey ? 'Hide answer key styling to preview test as candidate' : 'Show verified answer keys'}
          >
            {showAnswerKey ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
            <span>{showAnswerKey ? 'Candidate Preview' : 'Show Answer Key'}</span>
          </button>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tabular-nums">
            Projected Marks: <strong className="text-slate-900 dark:text-slate-100">{questions.length * correctMark} pts</strong>
          </span>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-2">
            <Plus className="w-4 h-4" />
          </div>
          <p className="font-medium text-slate-600 dark:text-slate-400">No questions composed yet.</p>
          <p className="text-xs text-slate-400 mt-0.5">Use the Question Authoring form or AI Ingestion above to add items to this examination.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const isNat = q.questionType === 'NAT';
            const opts = Array.isArray(q.options) ? q.options.map(formatOption) : [];
            const correctIndices = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];

            return (
              <div
                key={q._id || idx}
                className="p-4 sm:p-5 rounded-lg bg-slate-50/40 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {/* Question Item Header with Re-ordering & Edit Actions */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/80 pb-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 font-semibold text-xs flex items-center justify-center tabular-nums">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                      {q.questionType || 'MCQ'}
                    </span>
                    <span className="text-slate-500 text-xs">
                      · {q.subject || 'General'} {q.topic && `· ${q.topic}`}
                    </span>
                    {q.isEdited && (
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                        (Edited)
                      </span>
                    )}
                  </div>

                  {/* Action Buttons: Contribute to Bank, Re-order, Edit, Delete */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Contribute to Bank Toggle */}
                    <label className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors">
                      <input
                        type="checkbox"
                        checked={Boolean(q.contributeToBank !== undefined ? q.contributeToBank : q.isInBank)}
                        onChange={(e) => onToggleContribute(idx, e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-0 cursor-pointer accent-indigo-600"
                      />
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3 text-slate-500" />
                        <span>Contribute to Bank</span>
                      </span>
                    </label>

                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={() => onMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-md bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Move question up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={() => onMoveDown(idx)}
                      disabled={idx === questions.length - 1}
                      className="p-1.5 rounded-md bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Move question down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit Question */}
                    <button
                      type="button"
                      onClick={() => onEdit(idx)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                      title="Edit question and options"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Question */}
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                      title="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question Statement Preview */}
                {q.questionText && (
                  <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
                    <MathRenderer text={q.questionText} />
                  </div>
                )}

                {/* Question Image Attachment Preview */}
                {q.imageAttachment && (
                  <div className="pt-1">
                    <div
                      onClick={() => onPreviewImage(q.imageAttachment)}
                      className="inline-block p-1.5 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-400 transition-all group"
                      title="Click to view high-resolution image"
                    >
                      <img
                        src={q.imageAttachment}
                        alt={`Question ${idx + 1} Diagram`}
                        className="max-h-40 max-w-xs sm:max-w-md rounded object-contain"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 group-hover:underline flex items-center gap-1 mt-1 font-medium">
                        <ExternalLink className="w-3 h-3" /> View full image
                      </span>
                    </div>
                  </div>
                )}

                {/* MCQ / MSQ Options Preview Grid */}
                {!isNat && opts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {opts.map((opt, optIdx) => {
                      const isCorrect = showAnswerKey && correctIndices.includes(optIdx);

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-md border flex items-start gap-2.5 transition-colors text-xs ${isCorrect
                            ? 'bg-emerald-50/50 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                            : 'bg-white dark:bg-[#162030] border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center font-medium text-xs shrink-0 ${isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                              }`}
                          >
                            {isCorrect ? '✓' : getOptionLabel(optIdx)}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                            {opt.text && (
                              <div className="leading-relaxed">
                                <MathRenderer text={opt.text} />
                              </div>
                            )}

                            {opt.image && (
                              <div
                                onClick={() => onPreviewImage(opt.image)}
                                className="cursor-pointer inline-block"
                                title="Click to zoom option picture"
                              >
                                <img
                                  src={opt.image}
                                  alt={`Option ${getOptionLabel(optIdx)} diagram`}
                                  className="max-h-24 max-w-full rounded border border-slate-200 dark:border-slate-700 object-contain bg-white hover:opacity-90 transition-opacity"
                                />
                              </div>
                            )}

                            {isCorrect && showAnswerKey && (
                              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block pt-0.5">
                                Correct Key
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* NAT Numerical Range Display */}
                {isNat && (
                  showAnswerKey ? (
                    <div className="p-2.5 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Accepted Answer Range:</span>
                      <span className="font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40">
                        {correctIndices[0] !== undefined
                          ? correctIndices[0] === correctIndices[1] || correctIndices[1] === undefined
                            ? `${correctIndices[0]}`
                            : `[${correctIndices[0]}, ${correctIndices[1]}]`
                          : 'Not specified'}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-400 italic">
                      Numerical Answer (Candidate preview — answer key hidden)
                    </div>
                  )
                )}

                {/* Pedagogical Explanation Preview */}
                {showAnswerKey && q.explanation && (
                  <div className="p-2.5 rounded-md bg-slate-100/70 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Pedagogical Explanation:</span>
                    </span>
                    <div className="text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                      <MathRenderer text={q.explanation} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
