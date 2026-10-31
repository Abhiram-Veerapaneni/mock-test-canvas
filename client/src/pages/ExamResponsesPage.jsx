import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ResponseScoreBanner from '../components/exam-review/ResponseScoreBanner';
import ResponseQuestionNavigator from '../components/exam-review/ResponseQuestionNavigator';
import ResponseQuestionCard from '../components/exam-review/ResponseQuestionCard';
import api from '../services/api';
import { formatDateTime12h } from '../utils/dateUtils';
import { Loader2, AlertCircle, ArrowLeft, X, ExternalLink } from 'lucide-react';

export default function ExamResponsesPage() {
  const { testId, attemptId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'CORRECT' | 'INCORRECT' | 'UNANSWERED'
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(1);
  const [lightboxImage, setLightboxImage] = useState(null);

  const fetchReview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    try {
      const res = await api.get(`/submissions/attempt/${attemptId}/review`);
      if (res.data?.success) {
        setData(res.data);
      } else {
        throw new Error(res.data?.message || 'Failed to load question responses');
      }
    } catch (err) {
      console.error('[ExamResponsesPage] Error fetching review:', err);
      const msg = err.response?.data?.message || err.message || 'Could not load response review.';
      setError(msg);
      if (err.response?.data?.scheduledEndTime) {
        setErrorDetails({ scheduledEndTime: err.response.data.scheduledEndTime });
      }
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const exam = data?.exam;
  const attempt = data?.attempt;
  const questions = attempt?.questions || [];

  const filteredQuestions = useMemo(() => {
    if (filterType === 'CORRECT') return questions.filter((q) => q.isCorrect);
    if (filterType === 'INCORRECT') return questions.filter((q) => q.isAnswered && !q.isCorrect);
    if (filterType === 'UNANSWERED') return questions.filter((q) => !q.isAnswered);
    return questions;
  }, [questions, filterType]);

  const scrollToQuestion = (idx) => {
    setActiveQuestionIndex(idx);
    const el = document.getElementById(`review-question-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-600 dark:text-slate-400 mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Retrieving verified response sheet & solutions...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-8 space-y-4 shadow-none w-full">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Response Sheet Unavailable</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              {error}
            </p>
            {errorDetails?.scheduledEndTime && (
              <div className="p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-mono">
                Scheduled Release Time: {formatDateTime12h(errorDetails.scheduledEndTime, { includeYear: true })}
              </div>
            )}
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => navigate(testId ? `/test/${testId}` : '/dashboard')}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Assessment Overview</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <BackButton to={`/test/${testId || exam._id}`} label="Return to Assessment" />
          <Breadcrumbs
            items={[
              { label: 'Assessments', to: '/dashboard' },
              { label: exam.title || 'Exam', to: `/test/${testId || exam._id}` },
              { label: 'Response Sheet & Solutions' }
            ]}
          />
        </div>

        {/* Hero Performance Header Banner */}
        <ResponseScoreBanner exam={exam} attempt={attempt} />

        {/* Main Content Layout: Navigator Sidebar + Question Review Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Column: Interactive Question Palette & Filters */}
          <div className="lg:col-span-1 space-y-4 sticky top-20">
            <ResponseQuestionNavigator
              questions={questions}
              attempt={attempt}
              filterType={filterType}
              setFilterType={setFilterType}
              activeQuestionIndex={activeQuestionIndex}
              onScrollToQuestion={scrollToQuestion}
            />
          </div>

          {/* Right Column: Detailed Question Solution Cards */}
          <div className="lg:col-span-3 space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-12 text-center text-slate-400 text-xs shadow-none">
                No questions match the current filter selection.
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <ResponseQuestionCard
                  key={q.questionId}
                  question={q}
                  onPreviewImage={setLightboxImage}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-3xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 space-y-3 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Image Preview</h3>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center bg-slate-100 dark:bg-[#0C0F17] rounded-md overflow-hidden p-2 border border-slate-200/80 dark:border-slate-800/80">
              <img src={lightboxImage} alt="Diagram preview" className="max-h-[65vh] w-auto object-contain" />
            </div>
            <div className="flex justify-end">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 flex items-center gap-1 font-medium"
              >
                <span>Open original in new tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
