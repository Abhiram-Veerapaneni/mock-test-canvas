import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/common/Navbar';
import QuestionBankSidebar from '../components/question-bank/QuestionBankSidebar';
import QuestionBankCard from '../components/question-bank/QuestionBankCard';
import AddQuestionModal from '../components/question-bank/AddQuestionModal';
import GenerateExamModal from '../components/question-bank/GenerateExamModal';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import {
  Plus,
  Zap,
  Search,
  Database,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export default function QuestionBankPage() {
  const { isAuthenticated, openAuthModal } = useAuthStore();

  // Filters & Search
  const [selectedStream, setSelectedStream] = useState('ALL');
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination & Data
  const [questions, setQuestions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(12);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');

  // Client-Side View Adjustment: Answer Key visibility
  const [showAnswerKeys, setShowAnswerKeys] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bank_show_answer_keys');
      return saved !== null ? saved === 'true' : false; // default false for self-testing in bank
    }
    return false;
  });

  const handleToggleAnswerKeys = () => {
    setShowAnswerKeys((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('bank_show_answer_keys', String(next));
      }
      return next;
    });
  };

  // Repository Overall Meta
  const [overallStreamCount, setOverallStreamCount] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Debounce search input
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  };

  // Fetch overall repository stats
  useEffect(() => {
    api.get('/questions/meta/streams')
      .then((res) => {
        if (res.data?.success) {
          setOverallStreamCount(res.data.streams?.length || 0);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        stream: selectedStream && selectedStream !== 'ALL' ? selectedStream : undefined,
        tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
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
      console.error('Fetch questions error:', err);
      setError(err.response?.data?.message || err.message || 'Error loading question bank.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, selectedStream, selectedTags, debouncedSearch]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Handlers for sidebar filters
  const handleSelectStream = (st) => {
    setSelectedStream(st);
    setPage(1);
  };

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedStream('ALL');
    setSelectedTags([]);
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
  };

  // Add & Edit Actions
  const handleOpenAddModal = () => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Sign In to Contribute',
        subtitle: 'Log in to add and share questions in the shared Question Bank.',
        onSuccess: () => {
          setQuestionToEdit(null);
          setIsAddModalOpen(true);
        }
      });
      return;
    }
    setQuestionToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleEditQuestion = (q) => {
    setQuestionToEdit(q);
    setIsAddModalOpen(true);
  };

  const handleOpenGenerateModal = () => {
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Sign In to Generate Practice Test',
        subtitle: 'Log in to instantly generate custom examinations from the question pool.',
        onSuccess: () => setIsGenerateModalOpen(true)
      });
      return;
    }
    setIsGenerateModalOpen(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      const res = await api.delete(`/questions/${questionId}`);
      if (res.data?.success) {
        setNotificationMsg(res.data.message || 'Question deleted successfully.');
        setTimeout(() => setNotificationMsg(''), 4000);
        if (questions.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else {
          fetchQuestions();
        }
      }
    } catch (err) {
      console.error('Delete question error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete question.');
    }
  };

  const handleModalSuccess = (savedQuestion, isEdit) => {
    setNotificationMsg(
      isEdit ? 'Question updated successfully.' : 'Question added to Question Bank!'
    );
    setTimeout(() => setNotificationMsg(''), 4000);
    fetchQuestions();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner / Success Toast */}
        {notificationMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{notificationMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotificationMsg('')}
              className="text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-100 font-semibold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Question Bank
              </h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Global repository of verified STEM questions. Filter by stream and tags, contribute problems, or instantly generate practice exams.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>

            <button
              type="button"
              onClick={handleOpenGenerateModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Generate Practice Exam</span>
            </button>
          </div>
        </div>

        {/* Stat Strip & Search Bar Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Stat Strip */}
          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {totalCount} {totalCount === 1 ? 'question' : 'questions'} available
            </span>
            <span>·</span>
            <span>{overallStreamCount} distinct streams</span>
            {selectedStream !== 'ALL' && (
              <>
                <span>·</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Filtered by {selectedStream}
                </span>
              </>
            )}
          </div>

          {/* Toolbar Right: Answer Key View Adjustment & Search Input */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Client-Side View Adjustment: Answer Key Toggle */}
            <button
              type="button"
              onClick={handleToggleAnswerKeys}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer border shrink-0 ${
                showAnswerKeys
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 font-medium'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title={showAnswerKeys ? 'Hide verified answers across cards for practice' : 'Display verified answers across question cards'}
            >
              {showAnswerKeys ? <EyeOff className="w-3.5 h-3.5 text-zinc-500" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
              <span>{showAnswerKeys ? 'Hide Answers' : 'Show Answers'}</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search problem text..."
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Main Content Layout: Sidebar + Grid */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Filters Sidebar */}
          <QuestionBankSidebar
            selectedStream={selectedStream}
            onSelectStream={handleSelectStream}
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
            onClearFilters={handleClearFilters}
          />

          {/* Questions Grid & Pagination */}
          <div className="flex-1 w-full space-y-6">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-400 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                <span className="text-xs">Loading Question Bank...</span>
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center space-y-3">
                <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
                <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
                <button
                  type="button"
                  onClick={fetchQuestions}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-xs font-medium border text-zinc-700 dark:text-zinc-300"
                >
                  Retry
                </button>
              </div>
            ) : questions.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    No questions found
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    {debouncedSearch || selectedStream !== 'ALL' || selectedTags.length > 0
                      ? 'No items matched your current filter criteria. Try adjusting or resetting your search filters.'
                      : 'The question bank is currently empty. Be the first contributor to add a question!'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  {(selectedStream !== 'ALL' || selectedTags.length > 0 || debouncedSearch) && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-white cursor-pointer"
                  >
                    + Add New Question
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {questions.map((q) => (
                    <QuestionBankCard
                      key={q._id}
                      question={q}
                      showAnswerKey={showAnswerKeys}
                      onEdit={handleEditQuestion}
                      onDelete={handleDeleteQuestion}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                    <span>
                      Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)} of {totalCount} questions
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <span className="px-2 font-medium text-zinc-800 dark:text-zinc-200">
                        {page} / {totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add / Edit Question Modal */}
      <AddQuestionModal
        isOpen={isAddModalOpen}
        questionToEdit={questionToEdit}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Generate Random Exam Modal */}
      <GenerateExamModal
        isOpen={isGenerateModalOpen}
        initialStream={selectedStream}
        initialTags={selectedTags}
        onClose={() => setIsGenerateModalOpen(false)}
      />
    </div>
  );
}
