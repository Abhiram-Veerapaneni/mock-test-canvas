import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
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
  Trophy,
  CalendarDays,
  Infinity as InfinityIcon,
  Radio,
  FileText,
  Target,
  Sparkles
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

  if (isLoadingExam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f293d] rounded-2xl p-6 text-center shadow-lg">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-5">{error || 'Exam not found.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* Navigation & Breadcrumbs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <BackButton to="/dashboard" label="Return to Dashboard" />
          <Breadcrumbs
            items={[
              { label: 'Assessments', to: '/dashboard' },
              { label: exam.title }
            ]}
          />
        </div>

        {/* ── Main Hero Card ────────────────────────────────────────────────── */}
        <section className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60">
                  {exam.category}
                </span>
                {hasAttempted && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60">
                    Attempted
                  </span>
                )}
                {exam.proctorSettings?.faceCheck !== false && (
                  <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    AI Proctored
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {exam.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                {exam.description || 'Comprehensive proctored examination covering competitive syllabus standards with real-time biometric and environment verification.'}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="shrink-0 flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {user && (exam.creatorId?._id === user._id || exam.creatorId === user._id) && (
                <>
                  <button
                    onClick={() => navigate(`/test/${examId}/audit`)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200/80 dark:border-blue-800/80 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Violation Logs & Reports</span>
                  </button>

                  <button
                    onClick={() => setIsLiveMonitorOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
                    <span>Live Console</span>
                  </button>
                </>
              )}

              {isExhausted ? (
                <button
                  disabled
                  className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-semibold text-xs cursor-not-allowed"
                >
                  Attempts Exhausted
                </button>
              ) : hasAttempted ? (
                <button
                  onClick={handleStartExam}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Exam</span>
                </button>
              ) : (
                <button
                  onClick={handleStartExam}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Proctored Exam</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Stats Metric Strip ─────────────────────────────────────── */}
          <div className="pt-6 border-t border-slate-100 dark:border-[#1f293d] grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#090d16]/70 border border-slate-200/60 dark:border-[#1f293d]">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Duration</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{exam.durationMinutes} mins</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#090d16]/70 border border-slate-200/60 dark:border-[#1f293d]">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Questions</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{exam.questions?.length ?? 0}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#090d16]/70 border border-slate-200/60 dark:border-[#1f293d]">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Marking Scheme</div>
                <div className="text-sm font-bold tabular-nums">
                  <span className="text-emerald-600 dark:text-emerald-400">+{exam.markingScheme?.correct ?? 4}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-rose-600 dark:text-rose-400">{exam.markingScheme?.incorrect ?? -1}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#090d16]/70 border border-slate-200/60 dark:border-[#1f293d]">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Allowed Attempts</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1 tabular-nums">
                  {attemptsUsed}
                  <span className="text-slate-400">/</span>
                  {isUnlimited
                    ? <InfinityIcon className="w-3.5 h-3.5 text-slate-500 inline" />
                    : maxAttempts}
                </div>
              </div>
            </div>
          </div>

          {/* Subject Pills */}
          {subjects.length > 0 && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mr-1">Modules:</span>
              {subjects.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-700 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ── Polished "Best Score" Hero Banner ──────────────────────────────── */}
        {bestAttempt && (
          <section
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
            }}
            className="rounded-2xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden border border-blue-400/30"
          >
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-semibold uppercase tracking-wider backdrop-blur-xs">
                  <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Personal Best Performance</span>
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-4xl sm:text-5xl font-extrabold tabular-nums tracking-tight">{bestAttempt.score}</span>
                  <span className="text-blue-100 text-sm font-medium">/ {exam.totalMarks} points</span>
                </div>
                <p className="text-xs text-blue-100/90">
                  Recorded on {formatDate(bestAttempt.submittedAt || bestAttempt.createdAt)}
                </p>
              </div>

              {/* Stat Column Metrics with Strict Vertical Alignment */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 bg-black/15 p-4 rounded-xl border border-white/10 backdrop-blur-xs text-center min-w-[280px]">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-blue-200">Accuracy</span>
                  <span className="text-xl sm:text-2xl font-bold tabular-nums text-white mt-1">{bestAttempt.accuracy}%</span>
                </div>
                <div className="flex flex-col items-center border-x border-white/15 px-3 sm:px-6">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Correct</span>
                  <span className="text-xl sm:text-2xl font-bold tabular-nums text-white mt-1">{bestAttempt.correct ?? '—'}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-rose-300">Incorrect</span>
                  <span className="text-xl sm:text-2xl font-bold tabular-nums text-white mt-1">{bestAttempt.incorrect ?? '—'}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Attempt History Table ─────────────────────────────────────── */}
        <section className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-[#1f293d] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Attempt History & Analytics</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Historical breakdown of your evaluation logs and score progression</p>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tabular-nums">
              {attemptsUsed} {attemptsUsed === 1 ? 'Attempt' : 'Attempts'} Logged
            </span>
          </div>

          {isLoadingAttempts ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : attempts.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No attempts logged yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Begin this assessment to record your verified test results, question breakdowns, and timing.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#1f293d] bg-slate-50/75 dark:bg-[#090d16]/70 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th scope="col" className="py-3 px-5">Attempt</th>
                    <th scope="col" className="py-3 px-5">Submission Date</th>
                    <th scope="col" className="py-3 px-5 text-center">Answered</th>
                    <th scope="col" className="py-3 px-5 text-center">Unanswered</th>
                    <th scope="col" className="py-3 px-5 text-right">Score</th>
                    <th scope="col" className="py-3 px-5 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1f293d] text-xs">
                  {attempts.map((attempt, idx) => {
                    const attemptNumber = attemptsUsed - idx;
                    const totalQ = exam.questions?.length || 0;

                    let answeredCount = 0;
                    if (typeof attempt.correct === 'number' || typeof attempt.incorrect === 'number') {
                      answeredCount = (attempt.correct || 0) + (attempt.incorrect || 0);
                    } else if (Array.isArray(attempt.responses)) {
                      answeredCount = attempt.responses.filter((r) => r.selectedAnswers?.length > 0).length;
                    }

                    const unansweredCount = typeof attempt.unanswered === 'number'
                      ? attempt.unanswered
                      : Math.max(0, totalQ - answeredCount);

                    const isLatest = idx === 0;

                    return (
                      <tr
                        key={attempt._id || idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                              #{attemptNumber}
                            </span>
                            {isLatest && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                                Latest
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            <span className="tabular-nums">{formatDate(attempt.submittedAt || attempt.createdAt)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50 tabular-nums">
                            {answeredCount}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 tabular-nums">
                            {unansweredCount}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap font-bold">
                          <span className="text-slate-900 dark:text-white text-sm tabular-nums">
                            {attempt.score}
                          </span>
                          <span className="text-slate-400 text-xs font-normal">
                            {' '}/ {exam.totalMarks} pts
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap font-bold">
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
