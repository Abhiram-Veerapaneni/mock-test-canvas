import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useExamStore from '../store/useExamStore';
import useProctorStore from '../store/useProctorStore';
import api from '../services/api';
import ExamHeader from '../components/exam-player/ExamHeader';
import QuestionCanvas from '../components/exam-player/QuestionCanvas';
import QuestionPalette from '../components/exam-player/QuestionPalette';
import Modal from '../components/common/Modal';
import useExamTimer from '../hooks/useExamTimer';
import useBrowserLockdown from '../hooks/useBrowserLockdown';
import {
  Loader2, AlertCircle, CheckCircle2, ArrowRight,
  Maximize, ShieldAlert, Trophy, Target, XCircle, MinusCircle, AlertTriangle, ShieldOff
} from 'lucide-react';

export default function ExamSessionPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const {
    exam,
    questions,
    initExam,
    isInitialized,
    answers,
    clearStoredSession,
  } = useExamStore();

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreenBlocked, setIsFullscreenBlocked] = useState(false);

  // Per-violation warning popup
  const [violationWarning, setViolationWarning] = useState({ open: false, type: null });
  // Trust-score-zero termination modal
  const [trustZeroModal, setTrustZeroModal] = useState(false);
  const [trustZeroCountdown, setTrustZeroCountdown] = useState(5);

  // ── Proctor store ─────────────────────────────────────────────────────────────
  const { violations, violationCount, addViolation, resetProctor } = useProctorStore();

  // Graded result from the server
  const [gradedResult, setGradedResult] = useState(null);
  // Snapshot metadata captured before clearStoredSession()
  const [submittedSnapshot, setSubmittedSnapshot] = useState(null);

  // Friendly labels for violation types
  const VIOLATION_LABELS = {
    TAB_SWITCH: 'Tab Switch Detected',
    WINDOW_BLUR: 'Window Focus Lost',
    FULLSCREEN_EXIT: 'Fullscreen Exited',
  };

  // ── Violation handler → delegates to proctor store ───────────────────────────
  const handleViolation = useCallback((type) => {
    addViolation(type);
    console.warn(`[Lockdown] Violation: ${type}`);
  }, [addViolation]);

  // ── Show warning popup after each violation (skip during fullscreen blocker) ──
  const { trustScore } = useProctorStore();
  useEffect(() => {
    if (violationCount === 0 || isSubmitted || isFullscreenBlocked) return;
    const latest = violations[violations.length - 1];
    if (!latest) return;
    setViolationWarning({ open: true, type: latest.type });
    const t = setTimeout(() => setViolationWarning({ open: false, type: null }), 4000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [violationCount]);

  // ── Trust score zero → auto-terminate exam ───────────────────────────────────
  useEffect(() => {
    if (trustScore !== 0 || isSubmitted || !isInitialized) return;
    setTrustZeroModal(true);
    setViolationWarning({ open: false, type: null });
    setTrustZeroCountdown(5);

    // Countdown ticker
    const interval = setInterval(() => {
      setTrustZeroCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);

    // Auto-submit after 5 s
    const submitTimer = setTimeout(() => {
      setTrustZeroModal(false);
      doSubmit();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(submitTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trustScore]);

  // ── Submit to API, grade on server ────────────────────────────────────────────
  const doSubmit = useCallback(async () => {
    const currentExam = useExamStore.getState().exam;
    const currentAnswers = useExamStore.getState().answers;
    const currentQuestions = useExamStore.getState().questions;

    // Snapshot metadata before wiping store
    if (currentExam) {
      setSubmittedSnapshot({
        title: currentExam.title,
        markingScheme: currentExam.markingScheme,
        totalMarks: currentExam.totalMarks,
        totalQuestions: currentQuestions.length,
      });
    }

    setIsSubmitting(true);

    // Convert answers map: { questionId -> [selectedAnswers] }
    // The store answers object is keyed by question._id (e.g. { "67c9...": [1] })
    const answersByQuestionId = {};
    if (currentQuestions && currentAnswers) {
      Object.entries(currentAnswers).forEach(([key, selectedArr]) => {
        if (!Array.isArray(selectedArr) || selectedArr.length === 0) return;

        // 1. Direct match by question _id
        const matchedById = currentQuestions.find(
          (q) => q._id?.toString() === key || q.id?.toString() === key
        );
        if (matchedById?._id) {
          answersByQuestionId[matchedById._id.toString()] = selectedArr;
          return;
        }

        // 2. Numeric index fallback
        const idx = Number(key);
        if (!isNaN(idx) && currentQuestions[idx]?._id) {
          answersByQuestionId[currentQuestions[idx]._id.toString()] = selectedArr;
        }
      });
    }

    try {
      const res = await api.post('/submissions/submit', {
        examId: currentExam?._id || examId,
        answers: answersByQuestionId,
      });
      if (res.data?.success) {
        setGradedResult(res.data.result);
      }
    } catch (err) {
      console.error('[Submit] Error:', err);
      // Still mark as submitted even if API fails — show local snapshot
    } finally {
      setIsSubmitting(false);
      clearStoredSession();
      setIsSubmitted(true);
    }
  }, [clearStoredSession, examId]);

  // ── 3.1 Drift-free Web Worker timer ──────────────────────────────────────────
  const handleTimerExpired = useCallback(() => {
    doSubmit();
  }, [doSubmit]);

  useExamTimer({
    active: isInitialized && !isSubmitted,
    onExpired: handleTimerExpired,
  });

  // ── 3.2 Browser lockdown ──────────────────────────────────────────────────────
  const { dismissBlocker } = useBrowserLockdown({
    active: isInitialized && !isSubmitted,
    onViolation: handleViolation,
  });

  useEffect(() => {
    const onBlock = () => setIsFullscreenBlocked(true);
    const onUnblock = () => setIsFullscreenBlocked(false);
    window.addEventListener('lockdown:block', onBlock);
    window.addEventListener('lockdown:unblock', onUnblock);
    return () => {
      window.removeEventListener('lockdown:block', onBlock);
      window.removeEventListener('lockdown:unblock', onUnblock);
    };
  }, []);

  // ── Exam fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const loadExam = async () => {
      setIsLoading(true);
      setFetchError(null);
      // Reset proctor state for each fresh session
      resetProctor();
      try {
        const res = await api.get(`/exams/${examId}`);
        if (res.data?.success && res.data.exam) {
          if (isMounted) initExam(res.data.exam);
        } else {
          throw new Error('Invalid exam payload');
        }
      } catch (err) {
        console.error('Error loading exam:', err);
        if (isMounted) setFetchError(err.response?.data?.message || 'Could not load examination.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (examId) loadExam();
    return () => { isMounted = false; };
  }, [examId, resetProctor]);

  const handleConfirmSubmit = () => {
    setIsSubmitModalOpen(false);
    doSubmit();
  };

  const answeredCount = Object.values(answers).filter(
    (arr) => Array.isArray(arr) && arr.length > 0
  ).length;
  const remainingCount = Math.max(0, questions.length - answeredCount);

  // ── Submitted / Results Screen ────────────────────────────────────────────────
  if (isSubmitted || isSubmitting) {
    const snap = submittedSnapshot;
    const result = gradedResult;

    if (isSubmitting) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
          <p className="text-xs text-slate-500">Grading your answers...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-900 dark:text-slate-100">
        <div className="max-w-md w-full space-y-4">

          {/* Header card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Examination Submitted</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {snap?.title || 'Your answers have been recorded.'}
            </p>
          </div>

          {/* Score card */}
          {result ? (
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">Your Score</span>
              </div>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-5xl font-bold tabular-nums">{result.score}</span>
                <span className="text-blue-200 text-base mb-1">/ {result.totalMarks ?? snap?.totalMarks ?? '?'}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/10 rounded-xl p-2">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="w-3 h-3 text-blue-200" />
                    <span className="text-[10px] text-blue-200 uppercase">Accuracy</span>
                  </div>
                  <div className="text-lg font-bold">{result.accuracy}%</div>
                </div>
                <div className="bg-white/10 rounded-xl p-2">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    <span className="text-[10px] text-blue-200 uppercase">Correct</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-300">{result.correct}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-2">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <XCircle className="w-3 h-3 text-rose-300" />
                    <span className="text-[10px] text-blue-200 uppercase">Wrong</span>
                  </div>
                  <div className="text-lg font-bold text-rose-300">{result.incorrect}</div>
                </div>
              </div>
            </div>
          ) : (
            // Fallback if API failed — show attempted count
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-medium mb-1">Total Questions</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{snap?.totalQuestions ?? 0}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-medium mb-1">Answered</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{answeredCount}</div>
                </div>
              </div>
            </div>
          )}

          {/* Unanswered + violations summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <MinusCircle className="w-3.5 h-3.5" />
                <span>Unanswered: <strong className="text-slate-700 dark:text-slate-300">{result?.unanswered ?? (snap?.totalQuestions ?? 0) - answeredCount}</strong></span>
              </div>
              {violations.length > 0 && (
                <div className="flex items-center gap-1.5 text-rose-500">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{violations.length} violation{violations.length !== 1 ? 's' : ''} recorded</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/exam/${examId}`)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              View Attempts
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-medium">Preparing test environment...</p>
      </div>
    );
  }

  if (fetchError || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-900 dark:text-slate-100">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center shadow-xs">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Examination Unavailable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{fetchError || 'Unable to locate examination.'}</p>
          <button
            onClick={() => navigate(`/exam/${examId}`)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
          >
            Back to Exam Page
          </button>
        </div>
      </div>
    );
  }

  // ── Main Exam UI ──────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* 1. Header */}
      <ExamHeader
        onSubmitClick={() => setIsSubmitModalOpen(true)}
        violationCount={violationCount}
      />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <QuestionCanvas />
        <QuestionPalette />
      </div>

      {/* 3. Fullscreen Blocked Overlay */}
      {isFullscreenBlocked && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-sm w-full">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center mx-auto mb-5 animate-pulse">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Fullscreen Mode Exited</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-1">
              Exiting fullscreen during an examination is a proctoring violation. This incident has been recorded.
            </p>
            <p className="text-xs text-rose-400 font-medium mb-7">Violations recorded: {violations.length}</p>
            <button
              onClick={dismissBlocker}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 shadow-lg shadow-blue-600/20"
            >
              <Maximize className="w-4 h-4" />
              Re-enter Fullscreen to Continue
            </button>
            <p className="text-[11px] text-slate-600 mt-4">Your exam progress has been preserved.</p>
          </div>
        </div>
      )}

      {/* 4a. Per-violation warning popup — centered modal with blurred backdrop */}
      {violationWarning.open && (
        <div className="fixed inset-0 z-[9998] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-2xl shadow-2xl shadow-rose-500/20 w-full max-w-sm overflow-hidden">
            {/* Coloured top bar */}
            <div className="h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
            <div className="p-5">
              {/* Icon + title */}
              <div className="flex items-start gap-3 mb-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                    Proctoring Violation
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {VIOLATION_LABELS[violationWarning.type] ?? violationWarning.type}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase font-medium text-rose-400 mb-0.5">Violations</p>
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">{violationCount}</p>
                </div>
                <div className={`border rounded-xl p-3 text-center ${
                  trustScore >= 70
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900'
                    : trustScore >= 40
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-100 dark:border-orange-900'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900'
                }`}>
                  <p className="text-[10px] uppercase font-medium text-slate-400 mb-0.5">Trust Score</p>
                  <p className={`text-xl font-bold tabular-nums ${
                    trustScore >= 70 ? 'text-amber-600 dark:text-amber-400'
                    : trustScore >= 40 ? 'text-orange-600 dark:text-orange-400'
                    : 'text-rose-600 dark:text-rose-400'
                  }`}>{trustScore}<span className="text-xs font-normal opacity-60">/100</span></p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mb-4">
                Repeated violations will result in automatic exam termination.
              </p>

              {/* OK button */}
              <button
                onClick={() => setViolationWarning({ open: false, type: null })}
                className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold transition-all duration-150"
              >
                OK, I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4b. Trust-score-zero termination modal */}
      {trustZeroModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-2xl shadow-2xl shadow-rose-500/20 w-full max-w-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-rose-600 to-rose-400" />
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 flex items-center justify-center mx-auto mb-4">
                <ShieldOff className="w-7 h-7 text-rose-500" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Exam Terminated</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Your trust score has reached <strong className="text-rose-500">zero</strong> due to repeated proctoring violations.
                The examination is being automatically submitted.
              </p>
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-3 mb-4">
                <p className="text-[10px] uppercase font-medium text-rose-400 mb-1">Total Violations</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">{violationCount}</p>
              </div>
              <p className="text-xs text-slate-400">
                Submitting in <span className="font-bold text-rose-500 tabular-nums">{trustZeroCountdown}s</span>…
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Confirm Examination Submission"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you wish to submit? Once submitted, answers cannot be modified.
          </p>
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Answered</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm tabular-nums">{answeredCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Unanswered</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold text-sm tabular-nums">{remainingCount}</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
