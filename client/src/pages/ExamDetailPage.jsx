import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import api from '../services/api';
import useExamStore from '../store/useExamStore';
import useAuthStore from '../store/useAuthStore';
import ExamLiveMonitorModal from '../components/proctoring/ExamLiveMonitorModal';
import {
  Clock,
  BookOpen,
  Award,
  ShieldCheck,
  Play,
  RotateCcw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  CalendarDays,
  Infinity as InfinityIcon,
  Radio,
  FileText
} from 'lucide-react';

export default function ExamDetailPage() {
  const { testId, examId: routeExamId } = useParams();
  const examId = testId || routeExamId;
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [isLoadingExam, setIsLoadingExam] = useState(true);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveMonitorOpen, setIsLiveMonitorOpen] = useState(false);

  const { user } = useAuthStore();

  const fetchExam = useCallback(async () => {
    try {
      const res = await api.get(`/exams/${examId}`);
      if (res.data?.success) setExam(res.data.exam);
      else throw new Error('Failed to load exam');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load exam details.');
    } finally {
      setIsLoadingExam(false);
    }
  }, [examId]);

  const fetchAttempts = useCallback(async () => {
    try {
      const res = await api.get(`/submissions/my/${examId}`);
      if (res.data?.success) setAttempts(res.data.attempts || []);
    } catch {
      // Silently ignore — user may have no attempts yet
    } finally {
      setIsLoadingAttempts(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExam();
    fetchAttempts();
  }, [fetchExam, fetchAttempts]);

  const handleStartExam = () => {
    if (!examId) return;
    localStorage.setItem('active_exam_id', examId);
    useExamStore.getState().setActiveExamId(examId);
    navigate('/test', { state: { examId } });
  };

  const attemptsUsed = attempts.length;
  const maxAttempts = exam?.maxAttempts ?? null;
  const isUnlimited = maxAttempts === null;
  const attemptsLeft = isUnlimited ? Infinity : Math.max(0, maxAttempts - attemptsUsed);
  const isExhausted = !isUnlimited && attemptsLeft === 0;
  const hasAttempted = attemptsUsed > 0;

  const bestAttempt = attempts.length > 0
    ? attempts.reduce((best, a) => (a.score > best.score ? a : best), attempts[0])
    : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getAccuracyColor = (acc) => {
    if (acc >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (acc >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoadingExam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error || 'Exam not found.'}</p>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const subjects = exam.questions
    ? [...new Set(exam.questions.map((q) => q.subject || 'General'))]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Back link */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>

        {/* ── Hero Banner ────────────────────────────────────────────────── */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60">
                  {exam.category}
                </span>
                {hasAttempted && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60">
                    Attempted
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{exam.title}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                {exam.description || 'Comprehensive proctored examination covering competitive entrance syllabus.'}
              </p>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {user && (exam.creatorId?._id === user._id || exam.creatorId === user._id) && (
                <>
                  <button
                    onClick={() => navigate(`/test/${examId}/audit`)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Violation Logs & Reports</span>
                  </button>

                  <button
                    onClick={() => setIsLiveMonitorOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-medium text-xs border border-slate-700/80 transition-colors shadow-xs cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>Live Console</span>
                  </button>
                </>
              )}

              {isExhausted ? (
                <button disabled className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium text-sm cursor-not-allowed">
                  Attempts Exhausted
                </button>
              ) : hasAttempted ? (
                <button
                  onClick={handleStartExam}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake Exam
                </button>
              ) : (
                <button
                  onClick={handleStartExam}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Exam
                </button>
              )}
            </div>
          </div>

          {/* ── Stats row ─────────────────────────────────────────────── */}
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-medium">Duration</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{exam.durationMinutes} mins</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-medium">Questions</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{exam.questions?.length ?? 0}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-medium">Marking</div>
                <div className="text-sm font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400">+{exam.markingScheme?.correct ?? 4}</span>
                  {' / '}
                  <span className="text-rose-600 dark:text-rose-400">{exam.markingScheme?.incorrect ?? -1}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-medium">Attempts</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  {attemptsUsed}
                  <span className="text-slate-400">/</span>
                  {isUnlimited
                    ? <InfinityIcon className="w-4 h-4 text-slate-500" />
                    : maxAttempts}
                </div>
              </div>
            </div>
          </div>

          {/* Subjects */}
          {subjects.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {subjects.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {s}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ── Best Score Card (if attempted) ──────────────────────────────── */}
        {bestAttempt && (
          <section className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">Best Score</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold tabular-nums">{bestAttempt.score}</span>
              <span className="text-blue-200 text-sm mb-1">/ {exam.totalMarks}</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-blue-200">Accuracy</div>
                <div className="text-base font-bold">{bestAttempt.accuracy}%</div>
              </div>
              <div>
                <div className="text-xs text-blue-200">Correct</div>
                <div className="text-base font-bold text-emerald-300">{bestAttempt.correct ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-blue-200">Incorrect</div>
                <div className="text-base font-bold text-rose-300">{bestAttempt.incorrect ?? '—'}</div>
              </div>
            </div>
          </section>
        )}

        {/* ── Attempts History Table ─────────────────────────────────────── */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Attempt History</h2>
              <p className="text-xs text-slate-400 mt-0.5">Track your progress and performance across all attempts (most recent first)</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {attemptsUsed} {attemptsUsed === 1 ? 'Attempt' : 'Attempts'}
            </span>
          </div>

          {isLoadingAttempts ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          ) : attempts.length === 0 ? (
            <div className="py-12 text-center px-6">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No attempts yet.</p>
              <p className="text-xs text-slate-400 mt-1">Start the exam to record your first attempt.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th scope="col" className="py-3 px-5">Attempt</th>
                    <th scope="col" className="py-3 px-5">Date & Time</th>
                    <th scope="col" className="py-3 px-5 text-center">Answered</th>
                    <th scope="col" className="py-3 px-5 text-center">Unanswered</th>
                    <th scope="col" className="py-3 px-5 text-right">Score (Points)</th>
                    <th scope="col" className="py-3 px-5 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {attempts.map((attempt, idx) => {
                    const attemptNumber = attemptsUsed - idx;
                    const totalQ = exam.questions?.length || 0;
                    
                    // Answered count calculation
                    let answeredCount = 0;
                    if (typeof attempt.correct === 'number' || typeof attempt.incorrect === 'number') {
                      answeredCount = (attempt.correct || 0) + (attempt.incorrect || 0);
                    } else if (Array.isArray(attempt.responses)) {
                      answeredCount = attempt.responses.filter((r) => r.selectedAnswers?.length > 0).length;
                    }

                    // Unanswered count calculation
                    const unansweredCount = typeof attempt.unanswered === 'number'
                      ? attempt.unanswered
                      : Math.max(0, totalQ - answeredCount);

                    const isLatest = idx === 0;

                    return (
                      <tr
                        key={attempt._id || idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* 1. Attempt Number */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                              #{attemptNumber}
                            </span>
                            {isLatest && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50">
                                Latest
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Date & Time */}
                        <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(attempt.submittedAt || attempt.createdAt)}</span>
                          </div>
                        </td>

                        {/* 3. Answered */}
                        <td className="py-3.5 px-5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50 tabular-nums">
                            {answeredCount}
                          </span>
                        </td>

                        {/* 4. Unanswered */}
                        <td className="py-3.5 px-5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 tabular-nums">
                            {unansweredCount}
                          </span>
                        </td>

                        {/* 5. Score (Points) */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap font-semibold">
                          <span className="text-slate-900 dark:text-white text-sm tabular-nums">
                            {attempt.score}
                          </span>
                          <span className="text-slate-400 text-xs font-normal">
                            {' '}/ {exam.totalMarks} pts
                          </span>
                        </td>

                        {/* 6. Accuracy */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap font-medium">
                          <span className={`tabular-nums text-xs ${getAccuracyColor(attempt.accuracy)}`}>
                            {attempt.accuracy}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Live Proctoring Modal for Creator */}
        {isLiveMonitorOpen && (
          <ExamLiveMonitorModal
            examId={examId}
            examTitle={exam.title}
            onClose={() => setIsLiveMonitorOpen(false)}
          />
        )}
      </main>
    </div>
  );
}
