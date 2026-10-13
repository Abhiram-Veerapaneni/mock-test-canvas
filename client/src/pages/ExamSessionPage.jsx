import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useExamStore from '../store/useExamStore';
import useProctorStore from '../store/useProctorStore';
import api from '../services/api';
import ExamHeader from '../components/exam-player/ExamHeader';
import QuestionCanvas from '../components/exam-player/QuestionCanvas';
import QuestionPalette from '../components/exam-player/QuestionPalette';
import ExamFullscreenGate from '../components/exam-player/ExamFullscreenGate';
import ExamSubmissionResult from '../components/exam-player/ExamSubmissionResult';
import ExamLockdownOverlays from '../components/exam-player/ExamLockdownOverlays';
import ExamSubmitConfirmModal from '../components/exam-player/ExamSubmitConfirmModal';
import CameraMonitor from '../components/proctoring/CameraMonitor';
import StrikeModal from '../components/proctoring/StrikeModal';
import ProctoringCheckGate from '../components/proctoring/ProctoringCheckGate';
import useExamTimer from '../hooks/useExamTimer';
import useBrowserLockdown from '../hooks/useBrowserLockdown';
import { Loader2, AlertCircle } from 'lucide-react';

// Bug #3 fix: moved outside component so it's not re-created on every render
const VIOLATION_LABELS = {
  TAB_SWITCH: 'Tab Switch Detected',
  WINDOW_BLUR: 'Window Focus Lost',
  FULLSCREEN_EXIT: 'Fullscreen Exited',
  EXTENDED_ABSENCE: 'Extended Tab Absence',
  NO_FACE: 'No Face Detected',
  MULTI_FACE: 'Multiple Faces Detected',
  NOISE_SPIKE: 'Excessive Noise Detected',
  CELL_PHONE: 'Mobile Phone Detected',
  PROHIBITED_BOOK: 'Study Material / Book Detected',
  PROHIBITED_OBJECT: 'Prohibited Device Detected',
};

// S4: Show final-warning modal when trust score first drops to/below this threshold
const FINAL_WARNING_THRESHOLD = 30;

export default function ExamSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if arriving via auto-refresh after submission
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const isJustSubmitted = searchParams?.get('submitted') === 'true';
  const urlExamId = searchParams?.get('examId');

  // Resolve examId from URL query, location state, localStorage, or Zustand store
  const examId =
    urlExamId ||
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

  // Check practice mode and preview flags (considers location state, session storage, and exam metadata)
  const isPractice = Boolean(
    location.state?.isPractice === true ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('active_exam_mode') === 'PRACTICE' : false) ||
    exam?.isPractice === true ||
    exam?.examType === 'practice' ||
    exam?.isGenerated === true
  );
  const isPreview = Boolean(
    location.state?.isPreview === true ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('active_exam_preview') === 'true' : false)
  );

  // Synchronize sessionStorage with practice mode to ensure it survives page refreshes
  useEffect(() => {
    if (isPractice && typeof window !== 'undefined') {
      sessionStorage.setItem('active_exam_mode', 'PRACTICE');
    }
  }, [isPractice]);

  // Read saved result if arriving via auto-refresh after submission
  const savedResultData = useMemo(() => {
    if (isJustSubmitted && examId && typeof window !== 'undefined') {
      const raw = sessionStorage.getItem(`exam_result_${examId}`);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch (e) {
          console.warn('[ExamSession] Failed to parse saved result:', e);
        }
      }
    }
    return null;
  }, [isJustSubmitted, examId]);

  const [isLoading, setIsLoading] = useState(!savedResultData);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(Boolean(savedResultData));
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
  const { violations, violationCount, strikeCount, trustScore, addViolation, resetProctor, activeExamId } = useProctorStore();

  // Phase 4: Proctoring Hardware & Permission state
  const [proctorStream, setProctorStream] = useState(null);
  const proctorStreamRef = useRef(null);
  const [isHardwareVerified, setIsHardwareVerified] = useState(false);
  const [attemptId, setAttemptId] = useState(null);

  // Unconditionally stops all camera and microphone hardware tracks
  const stopProctoringMedia = useCallback(() => {
    if (proctorStreamRef.current) {
      proctorStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn('[ExamSession] Track stop error:', err);
        }
      });
      proctorStreamRef.current = null;
    }
    // Sweep any video elements in DOM to release hardware capture
    if (typeof document !== 'undefined') {
      document.querySelectorAll('video').forEach((video) => {
        if (video.srcObject && typeof video.srcObject.getTracks === 'function') {
          video.srcObject.getTracks().forEach((track) => {
            try { track.stop(); } catch (e) {}
          });
          video.srcObject = null;
        }
      });
    }
    setProctorStream(null);
  }, []);

  // Check if proctoring is required for this exam (practice mode strictly bypasses all proctoring)
  const requiresProctoring =
    !isPractice &&
    (exam?.proctorSettings?.faceCheck !== false ||
     exam?.proctorSettings?.audioCheck !== false);

  const handleHardwareVerified = useCallback((stream) => {
    proctorStreamRef.current = stream;
    setProctorStream(stream);
    setIsHardwareVerified(true);
    setNeedsFullscreenGate(false);
  }, []);

  // Graded result from the server
  const [gradedResult, setGradedResult] = useState(savedResultData?.result || null);
  // Snapshot metadata captured before clearStoredSession()
  const [submittedSnapshot, setSubmittedSnapshot] = useState(savedResultData?.snap || null);
  // Snapshot violations before resetProctor()
  const [submittedViolations, setSubmittedViolations] = useState(savedResultData?.violations || []);
  // Preserved examId for after-submission review navigation
  const [submittedExamId, setSubmittedExamId] = useState(savedResultData?.examId || examId);

  // Bug #2 fix: ref so trust-score effect always calls the latest doSubmit
  const doSubmitRef = useRef(null);

  // ── Violation handler → delegates to proctor store ───────────────────────────────
  // Phase 4: Vision/audio violation types ('NO_FACE', 'MULTI_FACE', 'NOISE_SPIKE')
  // use the dedicated StrikeModal instead of the generic violation popup.
  const VISION_AUDIO_TYPES = new Set([
    'NO_FACE', 'MULTI_FACE', 'NOISE_SPIKE',
    'CELL_PHONE', 'PROHIBITED_BOOK', 'PROHIBITED_OBJECT'
  ]);

  // State for StrikeModal (used for vision/audio violations)
  const [strikeModalState, setStrikeModalState] = useState({ open: false, type: null });

  const handleViolation = useCallback((type) => {
    if (isPractice) return; // Practice mode: no infractions or strikes recorded
    const recorded = addViolation(type);
    if (recorded) {
      console.warn(`[Lockdown] Violation: ${type}`);
      // Show StrikeModal for vision/audio violations
      if (VISION_AUDIO_TYPES.has(type)) {
        setStrikeModalState({ open: true, type });
      }
    }
  }, [addViolation, isPractice]);

  // ── Show violation warning popup after each new violation ────────────────────
  // Skip when the fullscreen blocker is already covering the screen or in practice mode.
  useEffect(() => {
    if (isPractice || violationCount === 0 || isSubmitted || isFullscreenBlocked) return;
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
  }, [violationCount, isPractice]);

  // ── S4: Final warning when trust score first drops to/below threshold ────────
  useEffect(() => {
    if (
      !isPractice &&
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
  }, [trustScore, isInitialized, isSubmitted, isPractice]);

  // ── Trust score zero → auto-terminate exam ───────────────────────────────────
  useEffect(() => {
    if (isPractice || trustScore !== 0 || isSubmitted || !isInitialized) return;
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
      stopProctoringMedia();
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
    // Immediately flag isSubmitting to unmount proctoring monitor and prevent rogue fallbacks
    setIsSubmitting(true);

    // Phase 4: Immediately stop all camera and microphone hardware tracks so lights turn off at once
    stopProctoringMedia();

    // Exit fullscreen if active
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

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

    const totalDurationSeconds = (currentExam?.durationMinutes || 180) * 60;
    const remainingSeconds = useExamStore.getState().timeRemainingSeconds;
    const timeSpentSeconds = Math.max(0, totalDurationSeconds - remainingSeconds);

    let resultDataPayload = null;
    try {
      // S5: Include violations and practice/timing in submission payload
      const res = await api.post('/submissions/submit', {
        examId: currentExam?._id || examId,
        answers: answersByQuestionId,
        violations: isPractice ? [] : currentViolations,
        isPractice: Boolean(isPractice),
        isPreview: Boolean(isPreview),
        timeSpentSeconds,
      });
      if (res.data?.success) {
        resultDataPayload = res.data.result;
        setGradedResult(res.data.result);
      }
    } catch (err) {
      console.error('[Submit] Error:', err);
      // Still mark as submitted even if API fails — show local snapshot
    } finally {
      clearStoredSession();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('active_exam_id');
      }
      useExamStore.getState().setActiveExamId?.(null);

      // Phase 4: Stop all camera and microphone tracks immediately on submission
      stopProctoringMedia();

      const finalExamId = currentExam?._id || examId;
      const snapshotObj = currentExam ? {
        title: currentExam.title,
        markingScheme: currentExam.markingScheme,
        totalMarks: currentExam.totalMarks,
        totalQuestions: currentQuestions.length,
      } : submittedSnapshot;

      // Auto-refresh via window.location.replace: completely flushes Windows Media Foundation device handles so webcam LED turns OFF immediately
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(
            `exam_result_${finalExamId}`,
            JSON.stringify({
              snap: snapshotObj,
              result: resultDataPayload,
              violations: isPractice ? [] : currentViolations,
              examId: finalExamId,
              isPractice: Boolean(isPractice),
            })
          );
          window.location.replace(`/test?submitted=true&examId=${finalExamId}`);
          return;
        } catch (e) {
          console.warn('[ExamSession] sessionStorage save note:', e);
        }
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  }, [clearStoredSession, examId, stopProctoringMedia, submittedSnapshot]);

  // Phase 4: Ensure all media tracks stop immediately on submit, page leave, or unmount
  useEffect(() => {
    if (isSubmitted) {
      stopProctoringMedia();
    }
  }, [isSubmitted, stopProctoringMedia]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        useExamStore.getState().syncToLocalStorage();
      } catch (e) {
        console.warn('Failed to sync session to localStorage on unload:', e);
      }
      stopProctoringMedia();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      try {
        useExamStore.getState().syncToLocalStorage();
      } catch (e) {
        console.warn('Failed to sync session to localStorage on unmount:', e);
      }
      stopProctoringMedia();
    };
  }, [stopProctoringMedia]);

  // Bug #2 fix: keep doSubmitRef always pointing to the latest doSubmit
  useEffect(() => { doSubmitRef.current = doSubmit; }, [doSubmit]);

  // Active session condition: active only when initialized, not submitted, not submitting, and hardware verified (if proctoring required)
  const isSessionActive = isInitialized && !isSubmitted && !isSubmitting && (!requiresProctoring || isHardwareVerified);

  // ── 3.1 Drift-free Web Worker timer ──────────────────────────────────────────
  const handleTimerExpired = useCallback(() => {
    stopProctoringMedia();
    doSubmit();
  }, [doSubmit, stopProctoringMedia]);

  // Edge case fix: capture stopTimer so we can halt the worker on manual submit
  const { stopTimer } = useExamTimer({
    active: isSessionActive,
    onExpired: handleTimerExpired,
  });

  // Wrap doSubmit to stop the timer first
  const handleConfirmSubmit = useCallback(() => {
    stopProctoringMedia();
    stopTimer();
    setIsSubmitModalOpen(false);
    doSubmit();
  }, [stopTimer, doSubmit, stopProctoringMedia]);

  // ── 3.2 Browser lockdown (disabled in practice mode or if lockdown disabled) ──
  const { dismissBlocker } = useBrowserLockdown({
    active: isSessionActive && !isPractice && exam?.proctorSettings?.fullScreenLock !== false,
    onViolation: handleViolation,
  });

  useEffect(() => {
    if (isPractice) {
      setIsFullscreenBlocked(false);
      setNeedsFullscreenGate(false);
      setIsWindowBlurred(false);
      return;
    }
    const onBlock = () => {
      if (!isPractice) setIsFullscreenBlocked(true);
    };
    const onUnblock = () => {
      setIsFullscreenBlocked(false);
      setNeedsFullscreenGate(false);
    };
    // S6: Handle browsers where fullscreen is not supported
    const onNoFullscreen = () => {
      if (!isPractice) setIsFullscreenUnsupported(true);
    };
    // Alt+Tab overlay
    const onWindowBlur = () => {
      if (!isPractice) setIsWindowBlurred(true);
    };
    const onWindowFocus = () => setIsWindowBlurred(false);
    // Fullscreen auto-enter failed (browser needs gesture)
    const onFullscreenGate = () => {
      if (!isPractice) setNeedsFullscreenGate(true);
    };
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
  }, [isPractice]);

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
        stopProctoringMedia();
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
    // If arriving via auto-refresh after submission, skip exam fetch and proctor setup
    if (isJustSubmitted) return;

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
        const [examRes, attemptsRes, startRes] = await Promise.all([
          api.get(`/exams/${examId}`),
          api.get(`/submissions/my/${examId}`).catch(() => ({ data: { success: true, attempts: [] } })),
          api.post('/submissions/start', {
            examId,
            isPractice: Boolean(isPractice),
            isPreview: Boolean(isPreview),
          }).catch((err) => {
            console.warn('[ExamSession] Start attempt error:', err?.response?.data || err?.message);
            return { data: { success: false } };
          }),
        ]);

        if (startRes.data?.success && startRes.data?.attemptId) {
          setAttemptId(startRes.data.attemptId);
        }

        if (examRes.data?.success && examRes.data.exam) {
          const examData = examRes.data.exam;
          
          // Prevent manual navigation bypass for exhausted official attempts (practice and creator preview don't count)
          if (examData.maxAttempts !== null && isFreshAttempt && !isPractice && !isPreview && !examData.isCreator) {
            const officialAttemptsUsed = (attemptsRes.data?.attempts || []).filter((a) => !a.isPractice).length;
            if (officialAttemptsUsed >= examData.maxAttempts) {
              throw new Error('You have exhausted all official attempts for this examination.');
            }
          }

          if (isMounted) {
            initExam(examData);
            const needsProctor =
              !isPractice &&
              (examData.proctorSettings?.faceCheck !== false ||
               examData.proctorSettings?.audioCheck !== false);
            if (!needsProctor) {
              setIsHardwareVerified(true);
            }
          }
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
    return (
      <ExamSubmissionResult
        isSubmitting={isSubmitting}
        snap={submittedSnapshot}
        result={gradedResult}
        isPreview={isPreview}
        isPractice={isPractice}
        answeredCount={answeredCount}
        submittedViolations={submittedViolations}
        attemptId={attemptId}
        savedResultData={savedResultData}
        submittedExamId={submittedExamId}
        examId={examId}
        violationLabels={VIOLATION_LABELS}
        navigate={navigate}
      />
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-slate-900 dark:text-slate-100 mb-2" />
        <p className="text-xs font-medium">Preparing test environment...</p>
      </div>
    );
  }

  if (fetchError || !exam) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] flex flex-col items-center justify-center p-4 text-slate-900 dark:text-slate-100">
        <div className="max-w-sm w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-6 text-center shadow-none">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Examination Unavailable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{fetchError || 'Unable to locate examination.'}</p>
          <button
            onClick={() => navigate(examId ? `/test/${examId}` : '/dashboard')}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white shadow-sm shadow-indigo-600/20 active:scale-[0.98] text-xs font-medium transition-colors"
          >
            Back to Exam Page
          </button>
        </div>
      </div>
    );
  }

  // ── Pre-Exam Proctoring Verification Gate ─────────────────────────────────────
  // If proctoring is enabled and hardware permissions haven't been verified yet:
  if (requiresProctoring && !isHardwareVerified && !isSubmitted) {
    return (
      <ProctoringCheckGate
        exam={exam}
        onVerified={handleHardwareVerified}
        onCancel={() => navigate(examId ? `/test/${examId}` : '/dashboard')}
      />
    );
  }

  // ── Fullscreen Entry Gate ─────────────────────────────────────────────────────
  // Browsers block auto-fullscreen without a user gesture (e.g. after a page refresh).
  // Show a click-to-enter-fullscreen screen so the user initiates it themselves (official exams only).
  if (!isPractice && needsFullscreenGate && !isSubmitted) {
    return (
      <ExamFullscreenGate
        onEnterFullscreen={() => {
          dismissBlocker();
          setNeedsFullscreenGate(false);
        }}
      />
    );
  }

  // ── Main Exam UI ──────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen bg-[#F8FAFC] dark:bg-[#0C0F17] flex flex-col overflow-hidden select-none transition-colors duration-200">
      {/* Practice Mode Strip */}
      {isPractice && (
        <div className="bg-slate-900 dark:bg-slate-800/80 text-white text-[11px] font-medium py-1 px-4 flex items-center justify-between border-b border-slate-800 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Practice Assessment — Proctoring is disabled. Examiner will not be notified.</span>
          </div>
          <span className="text-[10px] bg-slate-800 dark:bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded font-mono">
            Unproctored
          </span>
        </div>
      )}

      {/* 1. Header */}
      <ExamHeader
        onSubmitClick={() => setIsSubmitModalOpen(true)}
        violationCount={violationCount}
        isPractice={isPractice}
      />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <QuestionCanvas />
        <QuestionPalette />
      </div>

      {/* Phase 4: Camera & Audio Monitor (strictly disabled in practice mode) */}
      {isSessionActive && !isPractice && (
        <CameraMonitor
          active={isSessionActive && !isPractice}
          proctorSettings={exam?.proctorSettings}
          onViolation={handleViolation}
          attemptId={attemptId}
          mediaStream={proctorStream}
        />
      )}

      {/* Phase 4: StrikeModal for vision/audio violations (disabled in practice mode) */}
      {!isPractice && (
        <StrikeModal
          type={strikeModalState.type}
          strikeCount={strikeCount}
          trustScore={trustScore}
          maxWarnings={exam?.proctorSettings?.maxWarningsAllowed || 5}
          isOpen={strikeModalState.open}
          onClose={() => setStrikeModalState({ open: false, type: null })}
        />
      )}

      {/* Proctoring & Lockdown Overlays */}
      <ExamLockdownOverlays
        isPractice={isPractice}
        isFullscreenUnsupported={isFullscreenUnsupported}
        isFullscreenBlocked={isFullscreenBlocked}
        isWindowBlurred={isWindowBlurred}
        violationWarning={violationWarning}
        violationCount={violationCount}
        trustScore={trustScore}
        finalWarningModal={finalWarningModal}
        trustZeroModal={trustZeroModal}
        trustZeroCountdown={trustZeroCountdown}
        violationLabels={VIOLATION_LABELS}
        onDismissBlocker={dismissBlocker}
        onDismissWindowBlur={() => setIsWindowBlurred(false)}
        onDismissViolationWarning={() => {
          clearTimeout(violationTimerRef.current);
          setViolationWarning({ open: false, type: null });
        }}
        onDismissFinalWarning={() => setFinalWarningModal(false)}
      />

      {/* Submit Confirmation Modal */}
      <ExamSubmitConfirmModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        answeredCount={answeredCount}
        remainingCount={remainingCount}
      />
    </div>
  );
}
