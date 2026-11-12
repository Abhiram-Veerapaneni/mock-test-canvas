import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Database,
  Search,
  X,
  Filter,
  CheckSquare,
  Square,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Plus
} from 'lucide-react';
import api from '../../services/api';
import MathRenderer from '../common/MathRenderer';
import { normalizeBankQuestionForDraft } from '../../utils/testDraftHelper';

export default function ImportQuestionBankModal({
  isOpen,
  onClose,
  existingQuestions = [],
  onImport
}) {
  if (!isOpen) return null;

  const [questions, setQuestions] = useState([]);
  const [streams, setStreams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStream, setSelectedStream] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL' | 'MCQ' | 'MSQ' | 'NAT'
  const [hideExisting, setHideExisting] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection map: questionId -> raw question object
  const [selectedMap, setSelectedMap] = useState(new Map());

  // Expanded card options
  const [expandedCards, setExpandedCards] = useState(new Set());

  // Existing questions IDs set for duplicate check
  const existingIdSet = useMemo(() => {
    const s = new Set();
    (existingQuestions || []).forEach((q) => {
      if (q._id) s.add(String(q._id));
      if (q.questionText) s.add(q.questionText.trim().toLowerCase());
    });
    return s;
  }, [existingQuestions]);

  const isAlreadyInExam = useCallback(
    (q) => {
      if (!q) return false;
      if (q._id && existingIdSet.has(String(q._id))) return true;
      if (q.questionText && existingIdSet.has(q.questionText.trim().toLowerCase())) return true;
      return false;
    },
    [existingIdSet]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch streams on mount
  useEffect(() => {
    api.get('/questions/meta/streams')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.streams)) {
          setStreams(res.data.streams);
        }
      })
      .catch((err) => console.warn('Could not load streams:', err?.message));
  }, []);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        stream: selectedStream !== 'ALL' ? selectedStream : undefined,
        type: selectedType !== 'ALL' ? selectedType : undefined,
        search: debouncedSearch.trim() || undefined
      };

      const res = await api.get('/questions', { params });
      if (res.data?.success) {
        setQuestions(res.data.questions || []);
        setTotalCount(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      } else {
        throw new Error(res.data?.message || 'Failed to load questions');
      }
    } catch (err) {
      console.error('Fetch question bank error:', err);
      setError(err.response?.data?.message || err.message || 'Error loading Question Bank.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, selectedStream, selectedType, debouncedSearch]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Filter out existing if toggle is on
  const displayedQuestions = useMemo(() => {
    if (!hideExisting) return questions;
    return questions.filter((q) => !isAlreadyInExam(q));
  }, [questions, hideExisting, isAlreadyInExam]);

  // Select / Deselect a single question
  const toggleSelectQuestion = (q) => {
    const id = q._id || q.questionText;
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, q);
      }
      return next;
    });
  };

  // Select all non-duplicate questions on current page
  const handleSelectAllOnPage = () => {
    const selectable = displayedQuestions.filter((q) => !isAlreadyInExam(q));
    const allSelected = selectable.every((q) => selectedMap.has(q._id || q.questionText));

    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (allSelected) {
        selectable.forEach((q) => next.delete(q._id || q.questionText));
      } else {
        selectable.forEach((q) => next.set(q._id || q.questionText, q));
      }
      return next;
    });
  };

  // Toggle card options expansion
  const toggleCardExpansion = (id) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Handle Import Click
  const handleConfirmImport = () => {
    const selectedList = Array.from(selectedMap.values());
    if (selectedList.length === 0) return;

    const normalized = selectedList
      .map(normalizeBankQuestionForDraft)
      .filter(Boolean);

    onImport(normalized);
    onClose();
  };

  const selectedCount = selectedMap.size;
  const isAllPageSelected =
    displayedQuestions.length > 0 &&
    displayedQuestions
      .filter((q) => !isAlreadyInExam(q))
      .every((q) => selectedMap.has(q._id || q.questionText));

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="max-w-4xl w-full max-h-[90vh] bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Import from Question Bank</span>
                <span className="text-[11px] font-mono text-slate-400 font-normal">
                  {totalCount} total
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Browse verified questions and insert them directly into your examination.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-slate-50/75 dark:bg-[#0C0F17]/75 border-b border-slate-200/80 dark:border-slate-800/80 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions by text, formula, topic..."
                className="input-base text-xs pl-8 pr-7 py-1.5 w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Selects */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Stream Select */}
              <select
                value={selectedStream}
                onChange={(e) => {
                  setSelectedStream(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-md bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Streams</option>
                {streams.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              {/* Question Type Select */}
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-md bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Question Types</option>
                <option value="MCQ">Single Choice (MCQ)</option>
                <option value="MSQ">Multiple Choice (MSQ)</option>
                <option value="NAT">Numerical (NAT)</option>
              </select>

              {/* Hide duplicates checkbox */}
              <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white dark:bg-[#131926] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 text-xs select-none cursor-pointer hover:bg-slate-50 dark:hover:bg-[#162030]">
                <input
                  type="checkbox"
                  checked={hideExisting}
                  onChange={(e) => setHideExisting(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-0"
                />
                <span>Hide already in test</span>
              </label>
            </div>
          </div>

          {/* Quick Action Selection Bar */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <button
              type="button"
              onClick={handleSelectAllOnPage}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium cursor-pointer"
            >
              {isAllPageSelected ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Deselect Page</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Select All on Page</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-400">
              Showing {displayedQuestions.length} item{displayedQuestions.length !== 1 ? 's' : ''} (Page {page} of {totalPages})
            </span>
          </div>
        </div>

        {/* Scrollable Questions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-xs">Loading Question Bank items...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchQuestions}
                className="btn-secondary text-xs px-2.5 py-1"
              >
                Retry
              </button>
            </div>
          ) : displayedQuestions.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs space-y-1">
              <Database className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
              <p className="font-medium text-slate-600 dark:text-slate-400">No questions match your criteria.</p>
              <p className="text-[11px] text-slate-400">Try adjusting your search terms or filters above.</p>
            </div>
          ) : (
            displayedQuestions.map((q) => {
              const qId = q._id || q.questionText;
              const inExam = isAlreadyInExam(q);
              const isSelected = selectedMap.has(qId);
              const isExpanded = expandedCards.has(qId);
              const isNat = q.questionType === 'NAT';
              const options = Array.isArray(q.options) ? q.options : [];

              return (
                <div
                  key={qId}
                  onClick={() => !inExam && toggleSelectQuestion(q)}
                  className={`border rounded-lg p-3.5 text-xs transition-all duration-150 ${
                    inExam
                      ? 'bg-slate-50/60 dark:bg-[#0C0F17]/50 border-slate-200/60 dark:border-slate-800/60 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-indigo-50/30 border-indigo-400 dark:border-indigo-600 ring-1 ring-indigo-500/30 dark:bg-indigo-950/20 cursor-pointer'
                      : 'bg-white border-slate-200/80 dark:bg-[#131926] dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="pt-0.5 shrink-0">
                      {inExam ? (
                        <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectQuestion(q)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-0 cursor-pointer accent-indigo-600"
                        />
                      )}
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Meta Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Stream / Subject */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {q.stream || q.subject || 'General'}
                        </span>

                        {/* Topic */}
                        {q.topic && q.topic !== 'General' && (
                          <span className="px-2 py-0.5 rounded text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40">
                            {q.topic}
                          </span>
                        )}

                        {/* Type badge */}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                          {q.questionType || 'MCQ'}
                        </span>

                        {/* In Exam Badge */}
                        {inExam && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                            Already in exam
                          </span>
                        )}
                      </div>

                      {/* Question Text with KaTeX */}
                      <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-xs">
                        <MathRenderer text={q.questionText} />
                      </div>

                      {/* Image Attachment Preview */}
                      {q.imageAttachment && (
                        <div className="pt-1">
                          <img
                            src={q.imageAttachment}
                            alt="Question attachment"
                            className="max-h-36 max-w-xs object-contain rounded border border-slate-200 dark:border-slate-800"
                          />
                        </div>
                      )}

                      {/* Expandable Options Preview */}
                      {!isNat && options.length > 0 && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCardExpansion(qId);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                          >
                            <span>{isExpanded ? 'Hide Options' : `Show ${options.length} Options`}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-md bg-slate-50/75 dark:bg-[#0C0F17]/75 border border-slate-200/60 dark:border-slate-800/60">
                              {options.map((opt, optIdx) => {
                                const optText = typeof opt === 'object' ? opt.text : String(opt);
                                const isCorrect = Array.isArray(q.correctAnswers) && q.correctAnswers.includes(optIdx);
                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-2 rounded text-xs flex items-start gap-2 border ${
                                      isCorrect
                                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                                        : 'bg-white dark:bg-[#131926] border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <span className="font-semibold font-mono text-[11px] text-slate-400">
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <MathRenderer text={optText} />
                                    </div>
                                    {isCorrect && (
                                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                                        ✓ Key
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-white dark:bg-[#131926] border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          {/* Pagination Controls */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] text-slate-500 font-mono px-2">
              {page} / {totalPages || 1}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedMap(new Map())}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 transition-colors cursor-pointer"
              >
                Clear ({selectedCount})
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030] text-xs font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedCount === 0}
              className="px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-xs font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import {selectedCount > 0 ? `${selectedCount} Questions` : 'Questions'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

