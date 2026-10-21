import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import {
  BookOpen,
  Search,
  PlusCircle,
  Loader2,
  AlertCircle,
  Compass,
  X
} from 'lucide-react';
import DiscardDraftModal from '../components/common/DiscardDraftModal';
import ExamCard from '../components/exam/ExamCard';

export default function DashboardPage() {
  const { user, isAuthenticated, loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const searchDebounceRef = useRef(null);

  // Cloud Draft Discard Modal state
  const [discardDraftModalOpen, setDiscardDraftModalOpen] = useState(false);
  const [draftToDiscard, setDraftToDiscard] = useState(null);
  const [isDiscardingDraft, setIsDiscardingDraft] = useState(false);

  const handlePromptDiscardDraft = (exam, e) => {
    if (e) e.stopPropagation();
    setDraftToDiscard(exam);
    setDiscardDraftModalOpen(true);
  };

  const handleConfirmDiscardDraft = async () => {
    if (!draftToDiscard?._id) return;
    setIsDiscardingDraft(true);
    try {
      await api.delete(`/exams/${draftToDiscard._id}`);
      const uId = user?._id || 'guest';
      try {
        localStorage.removeItem(`pmt_draft_exam_${uId}_${draftToDiscard._id}`);
        localStorage.removeItem(`pmt_draft_exam_${draftToDiscard._id}`);
      } catch (_) {}
      setExams((prev) => prev.filter((ex) => ex._id !== draftToDiscard._id));
      setDiscardDraftModalOpen(false);
      setDraftToDiscard(null);
    } catch (err) {
      console.error('Failed to discard draft from dashboard:', err);
      alert(err.response?.data?.message || 'Failed to discard draft.');
    } finally {
      setIsDiscardingDraft(false);
    }
  };

  const categories = ['ALL', 'JEE', 'NEET', 'GATE', 'APTITUDE', 'CUSTOM'];

  // Initialize native Google One Tap prompt on Dashboard for unauthenticated users
  useEffect(() => {
    if (isAuthenticated) return;

    try {
      if (sessionStorage.getItem('dismissedGoogleOneTap') === 'true') {
        return;
      }
    } catch (_) { }

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId.includes('your_google_client_id')) {
      return;
    }

    let isSubscribed = true;
    let timer = null;

    const initializeGoogle = () => {
      if (window.google?.accounts?.id && isSubscribed) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response?.credential && isSubscribed) {
              const res = await loginWithGoogle(response.credential);
              if (res?.success) {
                try {
                  sessionStorage.removeItem('dismissedGoogleOneTap');
                } catch (_) { }
                fetchExams();
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        timer = setTimeout(() => {
          if (!isSubscribed) return;
          window.google.accounts.id.prompt((notification) => {
            if (notification.isDismissedMoment() || notification.isSkippedMoment()) {
              try {
                sessionStorage.setItem('dismissedGoogleOneTap', 'true');
              } catch (_) { }
              window.google?.accounts?.id?.cancel();
            }
          });
        }, 1200);
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initializeGoogle();
        }
      }, 200);

      return () => {
        clearInterval(interval);
        if (timer) clearTimeout(timer);
        window.google?.accounts?.id?.cancel();
      };
    }

    return () => {
      isSubscribed = false;
      if (timer) clearTimeout(timer);
      window.google?.accounts?.id?.cancel();
    };
  }, [isAuthenticated, loginWithGoogle]);

  const fetchExams = async (showFullLoader = true, searchOverride = null) => {
    if (showFullLoader) {
      setIsLoading(true);
    } else {
      setIsSearching(true);
    }
    setError(null);
    try {
      const activeSearch = searchOverride !== null ? searchOverride : searchQuery;
      const params = { limit: 50 };
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (activeSearch.trim()) params.search = activeSearch.trim();

      const res = await api.get('/exams', { params });
      if (res.data?.success) {
        setExams(res.data.exams || []);
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
      setError('Unable to load available exams. Please try again later.');
    } finally {
      if (showFullLoader) setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchExams(true);
  }, [selectedCategory]);

  // Debounced server search without full-page re-rendering
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      fetchExams(false, searchQuery);
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Instant 0ms client-side filtering on loaded exams for instantaneous response
  const displayExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return exams;

    return exams.filter((exam) => {
      const titleMatch = exam.title?.toLowerCase().includes(q);
      const descMatch = exam.description?.toLowerCase().includes(q);
      const catMatch = exam.category?.toLowerCase().includes(q);
      const creatorMatch = exam.creatorName?.toLowerCase().includes(q);
      return titleMatch || descMatch || catMatch || creatorMatch;
    });
  }, [exams, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    fetchExams(false, searchQuery);
  };

  const handleAuthorExamClick = () => {
    navigate('/create-test');
  };

  const [questionBankCount, setQuestionBankCount] = useState(null);

  // Fetch true Question Bank count from question repository
  useEffect(() => {
    api.get('/questions', { params: { limit: 1 } })
      .then((res) => {
        if (res.data?.success && typeof res.data.total === 'number') {
          setQuestionBankCount(res.data.total);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch question bank count:', err);
      });
  }, []);

  const totalExamQuestions = useMemo(() => {
    return exams.reduce((sum, e) => sum + (e.questionCount || e.questions?.length || 0), 0);
  }, [exams]);

  const totalQuestions = questionBankCount !== null ? questionBankCount : totalExamQuestions;
  const completedAttempts = user?.attemptedTests?.length || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-300 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Assessments
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isAuthenticated ? (
                <>Logged in as <span className="font-medium text-slate-800 dark:text-slate-200">{user?.name || user?.email}</span>. Select an active test to begin.</>
              ) : (
                <>Browse verified competitive exam papers or author custom assessments.</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAuthorExamClick}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm shadow-indigo-600/20 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white dark:shadow-indigo-500/10 text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all duration-150 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Author New Exam</span>
            </button>
          </div>
        </section>

        {/* KPI & Metric Blocks: 3-column border-separated grid rather than separate floating bubble cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-slate-800/80 border border-slate-200/80 rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none">
          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Tests</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
              {displayExams.length}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Ready for testing</p>
          </div>

          <div
            onClick={() => navigate('/question-bank')}
            className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors group"
            title="Browse Question Bank repository"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                Question Bank
              </p>
              <Compass className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </div>
            <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
              {totalQuestions}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">KaTeX math verified</p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed Assessments</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
              {completedAttempts}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
              {completedAttempts > 0 ? 'Full analysis available' : 'Start your first test'}
            </p>
          </div>
        </section>

        {/* Control Bar: Search Input & Category Filters */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests by title or topic..."
              className="w-full pl-8 pr-16 py-1.5 bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-md text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isSearching && (
                <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Stream Filter text tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${isSelected
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white shadow-sm shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                >
                  {cat === 'ALL' ? 'All' : cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Test Cards & List Grid */}
        <section>
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
              <p className="text-xs">Loading tests...</p>
            </div>
          ) : error ? (
            <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border-l-4 border-l-rose-600 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="font-medium text-slate-900 dark:text-slate-100">{error}</span>
              </div>
              <button
                onClick={fetchExams}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs active:scale-[0.98] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 py-1 px-2.5 text-xs rounded-md font-medium transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : displayExams.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:shadow-none p-8">
              {searchQuery.trim() ? (
                <>
                  <Search className="w-6 h-6 text-slate-400 dark:text-slate-400 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    No matching examinations found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300 max-w-sm mx-auto mb-4">
                    No active tests match "{searchQuery}" in category ({selectedCategory}).
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm active:scale-[0.98] dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs py-1.5 px-3 rounded-lg font-medium transition cursor-pointer"
                  >
                    Clear Search Query
                  </button>
                </>
              ) : (
                <>
                  <BookOpen className="w-6 h-6 text-slate-400 dark:text-slate-400 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    No examinations found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300 max-w-sm mx-auto mb-4">
                    No active tests match your filter ({selectedCategory}). You can author a new examination paper in the studio.
                  </p>
                  <button
                    onClick={() => navigate('/create-test')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm shadow-indigo-600/20 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white dark:shadow-indigo-500/10 text-xs py-1.5 px-3 rounded-lg transition cursor-pointer"
                  >
                    Create Exam
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              {displayExams.map((exam) => {
                const questionCount = exam.questionCount || exam.questions?.length || 0;
                const attemptsUsed = exam.userAttemptCount || 0;
                const isDraft = exam.status === 'draft';

                return (
                  <ExamCard
                    key={exam._id}
                    category={exam.category}
                    title={exam.title}
                    description={exam.description}
                    status={exam.status}
                    durationMinutes={exam.durationMinutes}
                    totalMarks={exam.totalMarks || (questionCount * (exam.markingScheme?.correct || 4))}
                    markingScheme={exam.markingScheme}
                    questionsCount={questionCount}
                    maxAttempts={exam.maxAttempts}
                    userAttemptsCount={attemptsUsed}
                    schedule={exam.schedule}
                    proctorSettings={exam.proctorSettings}
                    allowReviewResponses={exam.allowReviewResponses}
                    onClick={() => {
                      if (isDraft) {
                        navigate(`/create-test?examId=${exam._id}`);
                      } else {
                        navigate(`/test/${exam._id}`);
                      }
                    }}
                    onStart={() => {
                      navigate(`/test/${exam._id}`);
                    }}
                    onPractice={
                      exam.allowPracticeMode
                        ? () => {
                            sessionStorage.setItem('active_exam_mode', 'PRACTICE');
                            localStorage.setItem('active_exam_id', exam._id);
                            navigate('/test', { state: { examId: exam._id, isPractice: true } });
                          }
                        : undefined
                    }
                    onReview={() => {
                      navigate(`/test/${exam._id}`);
                    }}
                    onEditDraft={() => {
                      navigate(`/create-test?examId=${exam._id}`);
                    }}
                    onDiscardDraft={() => {
                      handlePromptDiscardDraft(exam);
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Cloud Draft Discard Modal (Requires typing DISCARD) */}
      <DiscardDraftModal
        isOpen={discardDraftModalOpen}
        onClose={() => {
          setDiscardDraftModalOpen(false);
          setDraftToDiscard(null);
        }}
        onConfirm={handleConfirmDiscardDraft}
        examTitle={draftToDiscard?.title || 'Untitled Assessment Draft'}
        isDeleting={isDiscardingDraft}
        isCloudDraft={true}
      />
    </div>
  );
}
