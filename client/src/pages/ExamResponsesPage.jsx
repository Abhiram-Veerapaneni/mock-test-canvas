import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import MathRenderer from '../components/common/MathRenderer';
import api from '../services/api';
import { formatDateTime12h } from '../utils/dateUtils';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Award,
  Loader2,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  BookOpen,
  Filter,
  Calendar,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  FlaskConical
} from 'lucide-react';

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

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    if (filterType === 'CORRECT') return questions.filter((q) => q.isCorrect);
    if (filterType === 'INCORRECT') return questions.filter((q) => q.isAnswered && !q.isCorrect);
    if (filterType === 'UNANSWERED') return questions.filter((q) => !q.isAnswered);
    return questions;
  }, [questions, filterType]);

  const formatSeconds = (sec) => {
    if (!sec || sec <= 0) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return formatDateTime12h(dateStr, { includeYear: true, includeSeconds: true });
  };

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
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50 flex items-center justify-center mx-auto">
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

  const answeredCount = (attempt.correct || 0) + (attempt.incorrect || 0);

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
        <div className="rounded-lg bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none p-6 space-y-6 shadow-none">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Response Sheet & Solutions
                </span>
                {attempt.isPractice ? (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <FlaskConical className="w-3 h-3 text-slate-400" />
                    <span>Practice Session</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Official Proctored</span>
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {exam.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                <span>Submitted: {formatDate(attempt.submittedAt)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Time Taken: <strong className="text-slate-700 dark:text-slate-300 font-medium">{formatSeconds(attempt.timeTakenSeconds)}</strong>
                </span>
              </p>
            </div>

            {/* Score Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 rounded-lg bg-slate-50/50 dark:bg-[#162030]/50 text-center min-w-[320px]">
              <div className="p-3.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Score</span>
                <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums block mt-0.5">
                  {attempt.score} <span className="text-xs font-normal text-slate-400">/ {exam.totalMarks}</span>
                </span>
              </div>
              <div className="p-3.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Accuracy</span>
                <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums block mt-0.5">{attempt.accuracy}%</span>
              </div>
              <div className="p-3.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Correct</span>
                <span className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums block mt-0.5">{attempt.correct}</span>
              </div>
              <div className="p-3.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Incorrect</span>
                <span className="text-2xl font-semibold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums block mt-0.5">{attempt.incorrect}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Navigator Sidebar + Question Review Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Column: Interactive Question Palette & Filters */}
          <div className="lg:col-span-1 space-y-4 sticky top-20">
            {/* Filter Card */}
            <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-4 space-y-3 shadow-none">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filter Questions</span>
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`p-2 rounded-md font-medium text-center border transition-colors cursor-pointer ${
                    filterType === 'ALL'
                      ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:text-white dark:border-indigo-500 shadow-sm'
                      : 'bg-white dark:bg-[#131926] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-[#162030]'
                  }`}
                >
                  All ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('CORRECT')}
                  className={`p-2 rounded-md font-medium text-center border transition-colors cursor-pointer ${
                    filterType === 'CORRECT'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/50 hover:bg-emerald-100/50'
                  }`}
                >
                  Correct ({attempt.correct})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('INCORRECT')}
                  className={`p-2 rounded-md font-medium text-center border transition-colors cursor-pointer ${
                    filterType === 'INCORRECT'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-900/50 hover:bg-rose-100/50'
                  }`}
                >
                  Incorrect ({attempt.incorrect})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('UNANSWERED')}
                  className={`p-2 rounded-md font-medium text-center border transition-colors cursor-pointer ${
                    filterType === 'UNANSWERED'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  Skipped ({attempt.unanswered})
                </button>
              </div>
            </div>

            {/* Question Quick Jump Grid */}
            <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg p-4 space-y-4 shadow-none">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Question Navigator</span>
                <span className="font-mono text-slate-400 dark:text-slate-500 font-normal">
                  {questions.length} Questions
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2.5 place-items-center">
                {questions.map((q, idx) => {
                  const qNum = idx + 1;
                  const isCurrent = activeQuestionIndex === qNum;
                  const isMarked = q.isMarkedForReview || q.markedForReview;

                  let colorClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-[#162030] border border-slate-200 dark:border-slate-700';
                  if (q.isCorrect) {
                    colorClass = 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm';
                  } else if (q.isAnswered && !q.isCorrect) {
                    colorClass = 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm';
                  } else if (isMarked) {
                    colorClass = 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm';
                  }

                  return (
                    <button
                      key={q.questionId || idx}
                      type="button"
                      onClick={() => scrollToQuestion(qNum)}
                      className={`h-9 w-9 rounded-md font-mono text-xs font-semibold relative flex items-center justify-center cursor-pointer select-none focus:outline-none hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-95 transition-all duration-150 ease-out ${colorClass}`}
                      title={`Question ${qNum}: ${q.isCorrect ? 'Correct' : q.isAnswered ? 'Incorrect' : 'Unattempted'}`}
                    >
                      <span>{qNum}</span>
                      {isCurrent && (
                        <span
                          className={`absolute top-1 left-1/2 -translate-x-1/2 h-0.5 w-3.5 rounded-full ${
                            q.isCorrect || (q.isAnswered && !q.isCorrect) || isMarked
                              ? 'bg-white/90'
                              : 'bg-slate-500 dark:bg-slate-400'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend: small 8px dots */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span>Correct</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-400">{attempt.correct ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>Incorrect</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-400">{attempt.incorrect ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full border border-slate-400 bg-slate-100 dark:bg-slate-800/80 shrink-0" />
                    <span>Unattempted</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-400">{attempt.unanswered ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Question Solution Cards */}
          <div className="lg:col-span-3 space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-12 text-center text-slate-400 text-xs shadow-none">
                No questions match the current filter selection.
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const isCorrect = q.isCorrect;
                const isSkipped = !q.isAnswered;

                return (
                  <div
                    key={q.questionId}
                    id={`review-question-${q.questionIndex}`}
                    className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-4 shadow-none transition-colors"
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 text-xs font-semibold flex items-center justify-center">
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
                          onClick={() => setLightboxImage(q.imageAttachment)}
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
                            borderStyle = 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100';
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md shrink-0">
                                <Check className="w-3 h-3" /> Your Answer (Correct)
                              </span>
                            );
                          } else if (isUserSelected && !isCorrectAnswer) {
                            borderStyle = 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-slate-900 dark:text-slate-100';
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-900/50 px-2 py-0.5 rounded-md shrink-0">
                                <X className="w-3 h-3" /> Your Answer (Incorrect)
                              </span>
                            );
                          } else if (isCorrectAnswer) {
                            borderStyle = 'border-emerald-300/70 dark:border-emerald-800/70 bg-emerald-50/25 dark:bg-emerald-950/10 text-slate-900 dark:text-slate-100';
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md shrink-0">
                                <Check className="w-3 h-3" /> Correct Solution
                              </span>
                            );
                          }

                          return (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-md border flex items-start justify-between gap-3 text-xs transition-colors ${borderStyle}`}
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                <span className="font-medium text-slate-400 shrink-0 mt-0.5">
                                  ({letter})
                                </span>
                                <div className="space-y-1">
                                  <MathRenderer text={optText} />
                                  {optImg && (
                                    <img
                                      src={optImg}
                                      alt={`Option ${letter}`}
                                      className="max-h-28 rounded border border-slate-200/80 dark:border-slate-800/80 cursor-zoom-in"
                                      onClick={() => setLightboxImage(optImg)}
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

                    {/* Step-by-Step Pedagogical Explanation */}
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
              })
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
