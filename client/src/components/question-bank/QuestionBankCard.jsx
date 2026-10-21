import React, { useState, useMemo, useEffect } from 'react';
import MathRenderer from '../common/MathRenderer';
import {
  Edit3,
  Trash2,
  Tag,
  BookOpen,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  HelpCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function QuestionBankCard({
  question,
  showAnswerKey = false,
  forceExpand = false,
  onEdit,
  onDelete
}) {
  const [isExpanded, setIsExpanded] = useState(forceExpand);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCardAnswerRevealed, setIsCardAnswerRevealed] = useState(showAnswerKey);

  // Sync with forceExpand (e.g., from "Show Details for All" toggle)
  useEffect(() => {
    setIsExpanded(forceExpand);
  }, [forceExpand]);

  // Sync with global showAnswerKey toggle
  useEffect(() => {
    setIsCardAnswerRevealed(showAnswerKey);
  }, [showAnswerKey]);

  const isNat = question.questionType === 'NAT';
  const hasOptions = Array.isArray(question.options) && question.options.length > 0;
  const hasAnswerData = Boolean(
    (question.correctAnswers && question.correctAnswers.length > 0) ||
    question.explanation
  );

  // Answers are displayed ONLY when details tab is expanded AND show answer is clicked/active
  const isAnswerVisible = Boolean(isExpanded && isCardAnswerRevealed);

  const handleToggleAnswer = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setIsCardAnswerRevealed(true);
    } else {
      setIsCardAnswerRevealed((prev) => !prev);
    }
  };

  // Human-readable formatted answers string
  const formattedAnswers = useMemo(() => {
    if (!question.correctAnswers || !Array.isArray(question.correctAnswers) || question.correctAnswers.length === 0) {
      return '';
    }
    if (isNat) {
      if (question.correctAnswers[0] === question.correctAnswers[1] || question.correctAnswers[1] === undefined) {
        return `${question.correctAnswers[0]}`;
      }
      return `[${question.correctAnswers[0]}, ${question.correctAnswers[1]}]`;
    }
    return question.correctAnswers
      .map((idx) => {
        if (typeof idx === 'number') {
          return `Option ${String.fromCharCode(65 + idx)}`;
        }
        return String(idx);
      })
      .join(', ');
  }, [question.correctAnswers, isNat]);

  const contributorName = question.bankAddedBy?.name || 'Community Contributor';
  const formattedDate = question.createdAt
    ? new Date(question.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    : '';

  return (
    <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-md transition-all duration-150 dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none dark:hover:border-slate-700 dark:hover:bg-[#162030] rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Stream Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
            <BookOpen className="w-3 h-3 text-slate-500" />
            <span>{question.stream || question.subject || 'General'}</span>
          </span>

          {/* Non-MCQ Type Badge (Omit standard MCQ) */}
          {question.questionType && question.questionType !== 'MCQ' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              {question.questionType}
            </span>
          )}

          {question.isEdited && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              (Edited)
            </span>
          )}
        </div>

        {/* Contributor Action Controls (only if isContributor) */}
        {question.isContributor && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(question)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors cursor-pointer"
              title="Edit question"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Delete question from bank"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Question Statement */}
      <div className="space-y-2">
        <div className={`text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans ${!isExpanded ? 'line-clamp-3' : ''}`}>
          {question.questionText ? (
            <MathRenderer text={question.questionText} />
          ) : (
            <span className="italic text-slate-400">Diagram-only question</span>
          )}
        </div>

        {/* Question Image Attachment */}
        {question.imageAttachment && (
          <div className="pt-1">
            <img
              src={question.imageAttachment}
              alt="Question Diagram"
              className="max-h-36 max-w-full rounded-lg border border-slate-200/80 dark:border-slate-800/80 object-contain bg-white dark:bg-[#0C0F17] p-1"
            />
          </div>
        )}

      </div>

      {/* Expanded Details: Options, Answers & Explanation */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          {/* Options for MCQ / MSQ */}
          {!isNat && hasOptions && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {question.options.map((opt, oIdx) => {
                const optText = typeof opt === 'object' ? (opt.text || '') : opt;
                const optImg = typeof opt === 'object' ? (opt.image || '') : '';
                const isCorrect = isAnswerVisible && question.correctAnswers?.includes(oIdx);

                return (
                  <div
                    key={oIdx}
                    className={`p-2 rounded-lg border flex items-start gap-2 ${isCorrect
                      ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-100 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#162030] border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[11px] font-semibold shrink-0 ${isCorrect
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <div className="flex-1 min-w-0">
                      {optText && <MathRenderer text={optText} inline />}
                      {optImg && (
                        <img
                          src={optImg}
                          alt="Option diagram"
                          className="max-h-20 max-w-full rounded mt-1 border object-contain bg-white"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Correct Answer Display for NAT */}
          {isNat && isAnswerVisible && question.correctAnswers && (
            <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">Accepted Value:</span>
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                {formattedAnswers}
              </span>
            </div>
          )}

          {/* Explanation if visible */}
          {isAnswerVisible && question.explanation && (
            <div className="p-2.5 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <span className="font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider text-blue-700 dark:text-blue-300">
                <HelpCircle className="w-3.5 h-3.5" /> Explanation
              </span>
              <MathRenderer text={question.explanation} />
            </div>
          )}
        </div>
      )}

      {/* Bottom Metadata & Expand Toggle */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {Array.isArray(question.tags) && question.tags.length > 0 ? (
            question.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400"
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{tag}</span>
              </span>
            ))
          ) : (
            <span className="text-slate-400 text-[10px]">No tags</span>
          )}
        </div>

        {/* Contributor & Action Buttons */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="flex items-center gap-1 text-[11px]">
            <User className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[120px]">{contributorName}</span>
            {formattedDate && <span>· {formattedDate}</span>}
          </span>

          {hasAnswerData && (
            <button
              type="button"
              onClick={handleToggleAnswer}
              className={`flex items-center gap-1 font-medium text-[11px] cursor-pointer transition-colors ${isAnswerVisible
                  ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                  : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline'
                }`}
              title={isAnswerVisible ? 'Hide answer for this question' : 'Show answer for this question'}
            >
              {isAnswerVisible ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  <span>Hide Answer</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  <span>Show Answer</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-[11px] cursor-pointer"
          >
            <span>{isExpanded ? 'Less' : 'Details'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Inline Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border-l-4 border-l-rose-600 border border-slate-200 dark:border-slate-800 text-xs space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Are you sure you want to remove this question from the Question Bank?</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            This action cannot be undone. Active tests using this question may retain references.
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete(question._id);
              }}
              className="px-2.5 py-1 rounded bg-rose-600 text-white font-medium hover:bg-rose-700 cursor-pointer"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
