import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import MathRenderer from '../components/common/MathRenderer';
import api from '../services/api';
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
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const scrollToQuestion = (idx) => {
    const el = document.getElementById(`review-question-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#edf2f9] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Retrieving verified response sheet & solutions...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#edf2f9] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="card-base p-8 space-y-4 shadow-xl border border-slate-200/80 dark:border-[#334155] w-full">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Response Sheet Unavailable</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              {error}
            </p>
            {errorDetails?.scheduledEndTime && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 font-mono">
                Scheduled Release Time: {new Date(errorDetails.scheduledEndTime).toLocaleString()}
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
    <div className="min-h-screen bg-[#edf2f9] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
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
        <div className="rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 border border-blue-500/30">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold uppercase tracking-wider backdrop-blur-xs">
                  <Award className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Response Sheet & Key</span>
                </span>
                {attempt.isPractice ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[11px] font-semibold">
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Practice Attempt</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[11px] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Official Proctored</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">
                {exam.title}
              </h1>
              <p className="text-xs text-blue-100 flex items-center gap-3 flex-wrap">
                <span>Submitted: {formatDate(attempt.submittedAt)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Time Taken: <strong>{formatSeconds(attempt.timeTakenSeconds)}</strong>
                </span>
              </p>
            </div>

            {/* Score Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-xs text-center min-w-[320px]">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">Score</span>
                <span className="text-2xl font-extrabold text-white block mt-0.5">
                  {attempt.score} <span className="text-xs font-normal text-blue-200">/ {exam.totalMarks}</span>
                </span>
              </div>
              <div className="border-l border-white/15">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">Accuracy</span>
                <span className="text-2xl font-extrabold text-white block mt-0.5">{attempt.accuracy}%</span>
              </div>
              <div className="border-l border-white/15">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Correct</span>
                <span className="text-2xl font-extrabold text-white block mt-0.5">{attempt.correct}</span>
              </div>
              <div className="border-l border-white/15">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-300">Incorrect</span>
                <span className="text-2xl font-extrabold text-white block mt-0.5">{attempt.incorrect}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Navigator Sidebar + Question Review Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Column: Interactive Question Palette & Filters */}
          <div className="lg:col-span-1 space-y-5 sticky top-20">
            {/* Filter Card */}
            <div className="card-base p-4 space-y-3 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Filter Questions</span>
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`p-2 rounded-lg font-semibold text-center border transition-all ${
                    filterType === 'ALL'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 dark:bg-[#151f32] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-[#334155]'
                  }`}
                >
                  All ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('CORRECT')}
                  className={`p-2 rounded-lg font-semibold text-center border transition-all ${
                    filterType === 'CORRECT'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                  }`}
                >
                  Correct ({attempt.correct})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('INCORRECT')}
                  className={`p-2 rounded-lg font-semibold text-center border transition-all ${
                    filterType === 'INCORRECT'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                  }`}
                >
                  Incorrect ({attempt.incorrect})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('UNANSWERED')}
                  className={`p-2 rounded-lg font-semibold text-center border transition-all ${
                    filterType === 'UNANSWERED'
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'
                  }`}
                >
                  Skipped ({attempt.unanswered})
                </button>
              </div>
            </div>

            {/* Question Quick Jump Grid */}
            <div className="card-base p-4 space-y-3 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Question Navigator
              </span>
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1.5">
                {questions.map((q, idx) => {
                  let bgStyle = 'bg-slate-100 text-slate-600 dark:bg-[#151f32] dark:text-slate-400 border-slate-200/80 dark:border-[#334155]';
                  if (q.isCorrect) {
                    bgStyle = 'bg-emerald-500 text-white border-emerald-600';
                  } else if (q.isAnswered && !q.isCorrect) {
                    bgStyle = 'bg-rose-500 text-white border-rose-600';
                  }

                  return (
                    <button
                      key={q.questionId || idx}
                      type="button"
                      onClick={() => scrollToQuestion(idx + 1)}
                      className={`h-8 rounded-lg font-bold text-xs border flex items-center justify-center cursor-pointer transition-transform hover:scale-105 ${bgStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-2 border-t border-slate-100 dark:border-[#334155] grid grid-cols-3 gap-1 text-[10px] text-slate-500 dark:text-slate-400 text-center">
                <span className="flex items-center justify-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Correct
                </span>
                <span className="flex items-center justify-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Incorrect
                </span>
                <span className="flex items-center justify-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Skipped
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Question Solution Cards */}
          <div className="lg:col-span-3 space-y-5">
            {filteredQuestions.length === 0 ? (
              <div className="card-base p-12 text-center text-slate-400 text-xs">
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
                    className={`card-base p-5 sm:p-6 space-y-4 shadow-sm border transition-all ${
                      isCorrect
                        ? 'border-emerald-500/30 dark:border-emerald-500/20'
                        : isSkipped
                        ? 'border-slate-200/80 dark:border-[#334155]'
                        : 'border-rose-500/30 dark:border-rose-500/20'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-[#334155] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                          {q.questionIndex}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {q.subject || 'General'}
                          </span>
                          {q.topic && q.topic !== 'General' && (
                            <span className="text-[10px] text-slate-400">({q.topic})</span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-[#151f32] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-[#334155]">
                            {q.questionType || 'MCQ'}
                          </span>
                        </div>
                      </div>

                      {/* Marks / Status Badge */}
                      <div>
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>+{q.marksAwarded} Marks</span>
                          </span>
                        ) : isSkipped ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                            <span>0 Marks (Skipped)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{q.marksAwarded} Marks</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Statement */}
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed pl-1">
                      <MathRenderer text={q.questionText} />
                    </div>

                    {/* Image Attachment (if any) */}
                    {q.imageAttachment && (
                      <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0f172a] p-2 border border-slate-200/80 dark:border-[#334155] max-w-md">
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

                          let borderStyle = 'border-slate-200/80 dark:border-[#334155] bg-white dark:bg-[#1e293b]';
                          let badgeEl = null;

                          if (isUserSelected && isCorrectAnswer) {
                            borderStyle = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-xs';
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 shrink-0">
                                <Check className="w-3 h-3" /> Your Answer (Correct)
                              </span>
                            );
                          } else if (isUserSelected && !isCorrectAnswer) {
                            borderStyle = 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 shadow-xs';
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-700 shrink-0">
                                <X className="w-3 h-3" /> Your Answer (Incorrect)
                              </span>
                            );
                          } else if (isCorrectAnswer) {
                            borderStyle = 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
                            badgeEl = (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-300/60 dark:border-emerald-800 shrink-0">
                                <Check className="w-3 h-3" /> Correct Solution
                              </span>
                            );
                          }

                          return (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs transition-colors ${borderStyle}`}
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
                                  ({letter})
                                </span>
                                <div className="space-y-1">
                                  <MathRenderer text={optText} />
                                  {optImg && (
                                    <img
                                      src={optImg}
                                      alt={`Option ${letter}`}
                                      className="max-h-28 rounded border border-slate-200/80 dark:border-[#334155] cursor-zoom-in"
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
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151f32] border border-slate-200/80 dark:border-[#334155] text-xs space-y-1.5 mt-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
          className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-3xl w-full card-base p-5 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Image Preview</h3>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#151f32]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center bg-slate-100 dark:bg-[#0f172a] rounded-xl overflow-hidden p-2 border border-slate-200/80 dark:border-[#334155]">
              <img src={lightboxImage} alt="Diagram preview" className="max-h-[65vh] w-auto object-contain" />
            </div>
            <div className="flex justify-end">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
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
