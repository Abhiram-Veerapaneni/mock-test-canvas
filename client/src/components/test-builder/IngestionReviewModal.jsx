import React, { useState } from 'react';
import MathRenderer from '../common/MathRenderer';
import {
  Sparkles,
  CheckCircle2,
  X,
  Trash2,
  Plus,
  Eye,
  Edit3,
  HelpCircle,
  FileText,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const SUBJECT_OPTIONS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Aptitude', 'General'];

export default function IngestionReviewModal({
  isOpen,
  fileName,
  initialQuestions = [],
  onConfirm,
  onClose,
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [expandedIndex, setExpandedIndex] = useState(0); // auto-expand first item
  const [previewMode, setPreviewMode] = useState({}); // { [index]: true/false }

  if (!isOpen) return null;

  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    const newOptions = [...updated[qIndex].options];
    newOptions[optIndex] = value;
    updated[qIndex].options = newOptions;
    setQuestions(updated);
  };

  const handleAddOption = (qIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length >= 6) return;
    const nextChar = String.fromCharCode(65 + updated[qIndex].options.length);
    updated[qIndex].options = [...updated[qIndex].options, `Option ${nextChar}`];
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) return;
    updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
    // Re-index correctAnswers
    updated[qIndex].correctAnswers = updated[qIndex].correctAnswers
      .filter((idx) => idx !== optIndex)
      .map((idx) => (idx > optIndex ? idx - 1 : idx));
    if (updated[qIndex].correctAnswers.length === 0) {
      updated[qIndex].correctAnswers = [0];
    }
    setQuestions(updated);
  };

  const handleCorrectAnswerToggle = (qIndex, optIndex) => {
    const updated = [...questions];
    const q = updated[qIndex];
    if (q.questionType === 'MCQ') {
      q.correctAnswers = [optIndex];
    } else if (q.questionType === 'MSQ') {
      if (q.correctAnswers.includes(optIndex)) {
        if (q.correctAnswers.length > 1) {
          q.correctAnswers = q.correctAnswers.filter((i) => i !== optIndex);
        }
      } else {
        q.correctAnswers = [...q.correctAnswers, optIndex].sort((a, b) => a - b);
      }
    }
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    if (expandedIndex >= updated.length) {
      setExpandedIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleAddNewQuestion = () => {
    const newQ = {
      id: `manual_${Date.now()}`,
      questionText: 'New question with formula $\\sqrt{x}$',
      questionType: 'MCQ',
      subject: 'Physics',
      topic: 'General',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswers: [0],
      explanation: '',
    };
    setQuestions([...questions, newQ]);
    setExpandedIndex(questions.length);
  };

  const handleConfirmAll = () => {
    // Strip client IDs before adding to draft
    const cleanQuestions = questions.map(({ id, ...rest }) => rest);
    onConfirm(cleanQuestions);
  };

  const togglePreview = (index) => {
    setPreviewMode((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="max-w-4xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  AI Ingestion Review Studio
                </h2>
                <span className="text-xs text-zinc-400 tabular-nums">
                  ({questions.length} Parsed)
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-zinc-400" />
                <span className="truncate max-w-[280px] sm:max-w-md font-medium text-zinc-700 dark:text-zinc-300">
                  {fileName || 'Uploaded Document'}
                </span>
                <span>· Review and refine LaTeX formulas before importing</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Question List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No questions remaining in this batch
              </p>
              <button
                onClick={handleAddNewQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question Manually</span>
              </button>
            </div>
          ) : (
            questions.map((q, qIndex) => {
              const isExpanded = expandedIndex === qIndex;
              const isPreview = previewMode[qIndex];

              return (
                <div
                  key={q.id || qIndex}
                  className={`rounded-lg border transition-colors overflow-hidden ${
                    isExpanded
                      ? 'border-zinc-400 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/30'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {/* Collapsed Bar / Summary Header */}
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? -1 : qIndex)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-white dark:bg-zinc-900"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 shrink-0">
                        #{qIndex + 1}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0 border border-zinc-200 dark:border-zinc-700">
                        {q.questionType}
                      </span>

                      <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0 font-medium">
                        {q.subject}
                      </span>

                      <p className="text-xs text-zinc-800 dark:text-zinc-200 truncate">
                        {q.questionText}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(qIndex);
                        }}
                        title="Delete question"
                        className="p-1 rounded-md text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="text-zinc-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Form Body */}
                  {isExpanded && (
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/40">
                      {/* Meta Grid: Subject, Topic, Question Type */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                            Subject
                          </label>
                          <select
                            value={q.subject}
                            onChange={(e) => handleUpdateQuestion(qIndex, 'subject', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-md text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                          >
                            {SUBJECT_OPTIONS.map((subj) => (
                              <option key={subj} value={subj}>
                                {subj}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                            Topic
                          </label>
                          <input
                            type="text"
                            value={q.topic || ''}
                            onChange={(e) => handleUpdateQuestion(qIndex, 'topic', e.target.value)}
                            placeholder="e.g. Kinematics, Calculus"
                            className="w-full px-3 py-1.5 rounded-md text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
                            Question Type
                          </label>
                          <select
                            value={q.questionType}
                            onChange={(e) =>
                              handleUpdateQuestion(qIndex, 'questionType', e.target.value)
                            }
                            className="w-full px-3 py-1.5 rounded-md text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                          >
                            <option value="MCQ">Single Choice (MCQ)</option>
                            <option value="MSQ">Multiple Select (MSQ)</option>
                            <option value="NAT">Numerical Answer (NAT)</option>
                          </select>
                        </div>
                      </div>

                      {/* Question Text with Live LaTeX Toggle */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                            <span>Question Text (LaTeX supported)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => togglePreview(qIndex)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                          >
                            {isPreview ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{isPreview ? 'Edit Source' : 'Preview Render'}</span>
                          </button>
                        </div>

                        {isPreview ? (
                          <div className="p-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 min-h-[72px]">
                            <MathRenderer text={q.questionText} />
                          </div>
                        ) : (
                          <textarea
                            rows={3}
                            value={q.questionText}
                            onChange={(e) =>
                              handleUpdateQuestion(qIndex, 'questionText', e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-md text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 leading-relaxed"
                            placeholder="Enter question text with LaTeX formulas like $\frac{a}{b}$ or $\sqrt{x}$..."
                          />
                        )}
                      </div>

                      {/* Options Section (For MCQ and MSQ) */}
                      {q.questionType !== 'NAT' ? (
                        <div className="space-y-2.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                              Options & Correct Answer ({q.questionType === 'MCQ' ? 'Single Choice' : 'Multi-Select'})
                            </span>
                            {q.options.length < 6 && (
                              <button
                                type="button"
                                onClick={() => handleAddOption(qIndex)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Option</span>
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            {q.options.map((opt, optIndex) => {
                              const isCorrect = q.correctAnswers?.includes(optIndex);
                              const optionLabel = String.fromCharCode(65 + optIndex);

                              return (
                                <div
                                  key={optIndex}
                                  className={`flex items-center gap-2.5 p-2 rounded-md border transition-colors ${
                                    isCorrect
                                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30'
                                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                                  }`}
                                >
                                  {/* Radio / Checkbox for Correct Answer */}
                                  <button
                                    type="button"
                                    onClick={() => handleCorrectAnswerToggle(qIndex, optIndex)}
                                    title={isCorrect ? 'Marked as Correct' : 'Mark as Correct'}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-medium text-xs shrink-0 cursor-pointer transition-colors ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                                  >
                                    {isCorrect ? <Check className="w-3.5 h-3.5" /> : optionLabel}
                                  </button>

                                  {/* Option Text Input */}
                                  <div className="flex-1 min-w-0">
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) =>
                                        handleOptionChange(qIndex, optIndex, e.target.value)
                                      }
                                      className="w-full px-2 py-0.5 rounded text-xs bg-transparent border-0 focus:outline-none text-zinc-900 dark:text-zinc-100 font-mono"
                                      placeholder={`Option ${optionLabel} text or formula...`}
                                    />
                                  </div>

                                  {/* Rendered Preview Snippet */}
                                  <div className="hidden sm:block max-w-[200px] truncate text-xs text-zinc-500 dark:text-zinc-400 px-2 py-0.5 border-l border-zinc-200 dark:border-zinc-700">
                                    <MathRenderer text={opt} />
                                  </div>

                                  {/* Remove Option Button */}
                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(qIndex, optIndex)}
                                      className="p-1 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* NAT (Numerical) Input */
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block">
                            Numerical Correct Answer
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={q.correctAnswers?.[0] ?? ''}
                            onChange={(e) =>
                              handleUpdateQuestion(qIndex, 'correctAnswers', [
                                parseFloat(e.target.value) || 0,
                              ])
                            }
                            placeholder="e.g. 42 or 3.14"
                            className="w-full sm:w-64 px-3 py-1.5 rounded-md text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                          />
                        </div>
                      )}

                      {/* Explanation Field */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block">
                          Solution Explanation (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={q.explanation || ''}
                          onChange={(e) =>
                            handleUpdateQuestion(qIndex, 'explanation', e.target.value)
                          }
                          placeholder="Provide solution steps or reasoning (LaTeX formulas supported)..."
                          className="w-full px-3 py-1.5 rounded-md text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 leading-relaxed"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Add Question Button in Review Studio */}
          <button
            type="button"
            onClick={handleAddNewQuestion}
            className="w-full py-2.5 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center justify-center gap-2 text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Question Manually</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Cancel & Discard
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-zinc-500 hidden sm:inline">
              Ready to import {questions.length} questions
            </span>
            <button
              type="button"
              disabled={questions.length === 0}
              onClick={handleConfirmAll}
              className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Add to Exam</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
