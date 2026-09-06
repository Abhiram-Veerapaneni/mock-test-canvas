import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Maximize, ShieldAlert, Trophy, Target, XCircle, MinusCircle,
  AlertTriangle, ShieldOff, Clock as ClockIcon,
} from 'lucide-react';

// Bug #3 fix: moved outside component so it's not re-created on every render
const VIOLATION_LABELS = {
  TAB_SWITCH: 'Tab Switch Detected',
  WINDOW_BLUR: 'Window Focus Lost',
  FULLSCREEN_EXIT: 'Fullscreen Exited',
  EXTENDED_ABSENCE: 'Extended Tab Absence',
};

// S4: Show final-warning modal when trust score first drops to/below this threshold
const FINAL_WARNING_THRESHOLD = 30;

export default function ExamSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Resolve examId from location state, localStorage, or Zustand store
  const examId =
    location.state?.examId ||
    (typeof window !== 'undefined' ? localStorage.getItem('active_exam_id') : null) ||
    useExamStore.getState().activeExamId;

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
  const [isFullscreenUnsupported, setIsFullscreenUnsupported] = useState(false);
  // Alt+Tab / window-blur overlay
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  // True when auto-fullscreen failed (browser requires gesture) — show a gate screen
  const [needsFullscreenGate, setNeedsFullscreenGate] = useState(false);

  // Per-violation warning popup
  const [violationWarning, setViolationWarning] = useState({ open: false, type: null });
  // Bug #5 fix: track the auto-dismiss timer so OK can cancel it
  const violationTimerRef = useRef(null);

  // Trust-score-zero termination modal
  const [trustZeroModal, setTrustZeroModal] = useState(false);
  const [trustZeroCountdown, setTrustZeroCountdown] = useState(5);

  // S4: Final warning modal (shown once when trust score ≤ FINAL_WARNING_THRESHOLD)
  const [finalWarningModal, setFinalWarningModal] = useState(false);
  const finalWarningShownRef = useRef(false);

  // Bug #4 fix: single useProctorStore subscription (also pulls activeExamId for reset scoping)
  const { violations, violationCount, trustScore, addViolation, resetProctor, activeExamId } = useProctorStore();

  // Graded result from the server
  const [gradedResult, setGradedResult] = useState(null);
  // Snapshot metadata captured before clearStoredSession()
  const [submittedSnapshot, setSubmittedSnapshot] = useState(null);
  // Snapshot violations before resetProctor()
  const [submittedViolations, setSubmittedViolations] = useState([]);
  // Preserved examId for after-submission review navigation
  const [submittedExamId, setSubmittedExamId] = useState(examId);

  // Bug #2 fix: ref so trust-score effect always calls the latest doSubmit
  const doSubmitRef = useRef(null);

  // ── Violation handler → delegates to proctor store ───────────────────────────
  const handleViolation = useCallback((type) => {
    const recorded = addViolation(type);
    if (recorded) {
      console.warn(`[Lockdown] Violation: ${type}`);
    }
  }, [addViolation]);

  // ── Show violation warning popup after each new violation ────────────────────
  // Skip when the fullscreen blocker is already covering the screen.
  useEffect(() => {
    if (violationCount === 0 || isSubmitted || isFullscreenBlocked) return;
    const latest = violations[violations.length - 1];
    if (!latest) return;

    // Bug #5 fix: cancel previous auto-dismiss before opening new modal
    clearTimeout(violationTimerRef.current);
    setViolationWarning({ open: true, type: latest.type });
    violationTimerRef.current = setTimeout(
      () => setViolationWarning({ open: false, type: null }),
      4000,
    );
    return () => clearTimeout(violationTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [violationCount]);

  // ── S4: Final warning when trust score first drops to/below threshold ────────
  useEffect(() => {
    if (
      trustScore <= FINAL_WARNING_THRESHOLD &&
      trustScore > 0 &&
      !finalWarningShownRef.current &&
      isInitialized &&
      !isSubmitted
    ) {
      finalWarningShownRef.current = true;
      setFinalWarningModal(true);
      // Close the per-violation modal if it's open
      clearTimeout(violationTimerRef.current);
      setViolationWarning({ open: false, type: null });
    }
  }, [trustScore, isInitialized, isSubmitted]);

  // ── Trust score zero → auto-terminate exam ───────────────────────────────────
  useEffect(() => {
    if (trustScore !== 0 || isSubmitted || !isInitialized) return;
    setTrustZeroModal(true);
    setFinalWarningModal(false);
    clearTimeout(violationTimerRef.current);
    setViolationWarning({ open: false, type: null });
    setTrustZeroCountdown(5);

    // Countdown ticker
    const interval = setInterval(() => {
      setTrustZeroCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);

    // Auto-submit after 5 s — Bug #2 fix: use ref so doSubmit is never stale
    const submitTimer = setTimeout(() => {
      setTrustZeroModal(false);
      doSubmitRef.current?.();
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
    const currentViolations = useProctorStore.getState().violations;

    // Snapshot metadata & violations before wiping store
    if (currentExam) {
      setSubmittedSnapshot({
        title: currentExam.title,
        markingScheme: currentExam.markingScheme,
        totalMarks: currentExam.totalMarks,
        totalQuestions: currentQuestions.length,
      });
    }
    setSubmittedViolations(currentViolations);
    setSubmittedExamId(currentExam?._id || examId);

    setIsSubmitting(true);

    // Convert answers map: { questionId → [selectedAnswers] }
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
      // S5: Include violations in submission payload so the server can persist them
      const res = await api.post('/submissions/submit', {
        examId: currentExam?._id || examId,
        answers: answersByQuestionId,
        violations: currentViolations,
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('active_exam_id');
      }
      useExamStore.getState().setActiveExamId?.(null);
      setIsSubmitted(true);
    }
  }, [clearStoredSession, examId]);

  // Bug #2 fix: keep doSubmitRef always pointing to the latest doSubmit
  useEffect(() => { doSubmitRef.current = doSubmit; }, [doSubmit]);

  // ── 3.1 Drift-free Web Worker timer ──────────────────────────────────────────
  const handleTimerExpired = useCallback(() => {
    doSubmit();
  }, [doSubmit]);

  // Edge case fix: capture stopTimer so we can halt the worker on manual submit
  const { stopTimer } = useExamTimer({
    active: isInitialized && !isSubmitted,
    onExpired: handleTimerExpired,
  });

  // Wrap doSubmit to stop the timer first
  const handleConfirmSubmit = useCallback(() => {
    stopTimer();
    setIsSubmitModalOpen(false);
    doSubmit();
  }, [stopTimer, doSubmit]);

  // ── 3.2 Browser lockdown ──────────────────────────────────────────────────────
  const { dismissBlocker } = useBrowserLockdown({
    active: isInitialized && !isSubmitted,
    onViolation: handleViolation,
  });

  useEffect(() => {
    const onBlock = () => setIsFullscreenBlocked(true);
    const onUnblock = () => {
      setIsFullscreenBlocked(false);
      setNeedsFullscreenGate(false);
    };
    // S6: Handle browsers where fullscreen is not supported
    const onNoFullscreen = () => setIsFullscreenUnsupported(true);
    // Alt+Tab overlay
    const onWindowBlur = () => setIsWindowBlurred(true);
    const onWindowFocus = () => setIsWindowBlurred(false);
    // Fullscreen auto-enter failed (browser needs gesture)
    const onFullscreenGate = () => setNeedsFullscreenGate(true);
    window.addEventListener('lockdown:block', onBlock);
    window.addEventListener('lockdown:unblock', onUnblock);
    window.addEventListener('lockdown:nofullscreen', onNoFullscreen);
    window.addEventListener('lockdown:windowblur', onWindowBlur);
    window.addEventListener('lockdown:windowfocus', onWindowFocus);
    window.addEventListener('lockdown:fullscreengate', onFullscreenGate);
    return () => {
      window.removeEventListener('lockdown:block', onBlock);
      window.removeEventListener('lockdown:unblock', onUnblock);
      window.removeEventListener('lockdown:nofullscreen', onNoFullscreen);
      window.removeEventListener('lockdown:windowblur', onWindowBlur);
      window.removeEventListener('lockdown:windowfocus', onWindowFocus);
      window.removeEventListener('lockdown:fullscreengate', onFullscreenGate);
    };
  }, []);

  // ── Tab-return wall-clock correction ─────────────────────────────────────────
  // When the user returns from a hidden tab, deduct the actual elapsed wall-clock
  // time from the timer. This prevents students from "pausing" the timer by
  // backgrounding the tab — browser-throttled workers don't count real time.
  // If away for more than 30s, an additional EXTENDED_ABSENCE violation fires.
  useEffect(() => {
    const handleTabReturn = (e) => {
      if (!isInitialized || isSubmitted) return;
      const elapsedSeconds = Math.floor(e.detail.elapsedMs / 1000);
      if (elapsedSeconds <= 0) return;

      // Deduct actual elapsed time from timer
      const currentTime = useExamStore.getState().timeRemainingSeconds;
      const newTime = Math.max(0, currentTime - elapsedSeconds);
      useExamStore.getState().setTimeRemaining(newTime);

      console.warn(`[Timer] Tab was hidden for ${elapsedSeconds}s — timer adjusted to ${newTime}s`);

      if (newTime <= 0) {
        // Time ran out while tab was hidden — submit immediately
        stopTimer();
        doSubmitRef.current?.();
        return;
      }

      // Extended absence penalty: additional violation if away > 30 seconds
      if (elapsedSeconds > 30) {
        // Scale deduction by how long they were absent
        let extraDeduction;
        if (elapsedSeconds > 120) extraDeduction = 20;      // 2+ min: severe
        else if (elapsedSeconds > 60) extraDeduction = 15;  // 1–2 min: high
        else extraDeduction = 10;                            // 30–60s: moderate

        addViolation('EXTENDED_ABSENCE', extraDeduction);
        console.warn(`[Proctor] Extended absence (${elapsedSeconds}s) — trust penalty: -${extraDeduction}`);
      }
    };

    window.addEventListener('lockdown:tabreturn', handleTabReturn);
    return () => window.removeEventListener('lockdown:tabreturn', handleTabReturn);
  }, [isInitialized, isSubmitted, stopTimer, addViolation]);

  // ── Exam fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    // If no active exam was initiated or cached, redirect away from /test
    if (!examId) {
      navigate('/dashboard', { replace: true });
      return;
    }

    let isMounted = true;

    const loadExam = async () => {
      setIsLoading(true);
      setFetchError(null);
      finalWarningShownRef.current = false;
      // Only reset proctor state when starting a DIFFERENT exam or a FRESH attempt.
      // On same-exam refresh, preserve the existing violations and trust score.
      const currentActiveExamId = useProctorStore.getState().activeExamId;
      const isFreshAttempt = !localStorage.getItem(`mock_test_session_${examId}`);
      if (currentActiveExamId !== examId || isFreshAttempt) {
        resetProctor(examId);
      }

      try {
        const [examRes, attemptsRes] = await Promise.all([
          api.get(`/exams/${examId}`),
          api.get(`/submissions/my/${examId}`).catch(() => ({ data: { success: true, attempts: [] } }))
        ]);

        if (examRes.data?.success && examRes.data.exam) {
          const examData = examRes.data.exam;
          
          // Prevent manual navigation bypass for exhausted attempts
          if (examData.maxAttempts !== null && isFreshAttempt) {
            const attemptsUsed = attemptsRes.data?.attempts?.length || 0;
            if (attemptsUsed >= examData.maxAttempts) {
              throw new Error('You have exhausted all attempts for this examination.');
            }
          }

          if (isMounted) initExam(examData);
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
  }, [examId, resetProctor, navigate]);

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
              {submittedViolations.length > 0 && (
                <div className="flex items-center gap-1.5 text-rose-500">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{submittedViolations.length} violation{submittedViolations.length !== 1 ? 's' : ''} recorded</span>
                </div>
              )}
            </div>
          </div>

          {/* S3: Violation log — shown if any violations occurred */}
          {submittedViolations.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Proctoring Violation Log
                </span>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-40 overflow-y-auto">
                {submittedViolations.map((v, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-[9px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {VIOLATION_LABELS[v.type] ?? v.type}
                      </span>
                    </div>
                    <span className="text-slate-400 tabular-nums text-[10px] flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/test/${submittedExamId || examId}`)}
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
            onClick={() => navigate(examId ? `/test/${examId}` : '/dashboard')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
          >
            Back to Exam Page
          </button>
        </div>
      </div>
    );
  }

  // ── Fullscreen Entry Gate ─────────────────────────────────────────────────────
  // Browsers block auto-fullscreen without a user gesture (e.g. after a page refresh).
  // Show a click-to-enter-fullscreen screen so the user initiates it themselves.
  if (needsFullscreenGate && !isSubmitted) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border-2 border-blue-500/40 flex items-center justify-center mx-auto mb-5">
            <Maximize className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Fullscreen Required</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            This exam must be taken in fullscreen mode. Click the button below to enter fullscreen and continue.
          </p>
          <button
            onClick={() => {
              dismissBlocker();
              setNeedsFullscreenGate(false);
            }}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Maximize className="w-4 h-4" />
            Enter Fullscreen to Continue
          </button>
          <p className="text-[11px] text-slate-600 mt-3">Your progress and answers are safe.</p>
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

      {/* S6: Fullscreen not supported warning banner */}
      {isFullscreenUnsupported && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-xs font-medium text-center py-1.5 px-4">
          ⚠️ Fullscreen mode is not supported in this browser. Proctoring may be limited.
        </div>
      )}

      {/* 3a. Fullscreen Blocked Overlay */}
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
            <p className="text-xs text-rose-400 font-medium mb-7">Violations recorded: {violationCount}</p>
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

      {/* 3b. Alt+Tab / Window Blur Overlay — blurs screen when user switches apps */}
      {isWindowBlurred && !isFullscreenBlocked && (
        <div className="fixed inset-0 z-[9997] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-sm w-full">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 border-2 border-orange-500/40 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-orange-400" />
            </div>
            <h2 className="text-base font-bold text-white mb-2">Window Focus Lost</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              You switched away from the exam window. This has been recorded as a proctoring violation.
            </p>
            <button
              onClick={() => setIsWindowBlurred(false)}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-semibold text-sm transition-all duration-150"
            >
              Click to Return to Exam
            </button>
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

              {/* Bug #5 fix: OK cancels the auto-dismiss timer */}
              <button
                onClick={() => {
                  clearTimeout(violationTimerRef.current);
                  setViolationWarning({ open: false, type: null });
                }}
                className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold transition-all duration-150"
              >
                OK, I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4b. S4: Final warning modal — shown once when trust score ≤ 30 */}
      {finalWarningModal && (
        <div className="fixed inset-0 z-[9998] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-800 rounded-2xl shadow-2xl shadow-orange-500/20 w-full max-w-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-orange-500 to-amber-400" />
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/50 border-2 border-orange-200 dark:border-orange-800 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">⚠️ Final Warning</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Your trust score has dropped to{' '}
                <strong className="text-orange-500">{trustScore}/100</strong>.{' '}
                One more major violation will automatically terminate your exam.
              </p>
              <button
                onClick={() => setFinalWarningModal(false)}
                className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-95 text-white text-xs font-semibold transition-all duration-150"
              >
                I Understand — Continue Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4c. Trust-score-zero termination modal */}
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
