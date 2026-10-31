import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import useExamMediaProctoring from '../hooks/useExamMediaProctoring';
import useExamSubmission from '../hooks/useExamSubmission';
import useExamViolations from '../hooks/useExamViolations';
import { Loader2, AlertCircle } from 'lucide-react';

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

export default function ExamSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  const isJustSubmitted = searchParams?.get('submitted') === 'true';
  const urlExamId = searchParams?.get('examId');

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
  } = useExamStore();

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

  useEffect(() => {
    if (isPractice && typeof window !== 'undefined') {
      sessionStorage.setItem('active_exam_mode', 'PRACTICE');
    }
  }, [isPractice]);

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
  const [isFullscreenBlocked, setIsFullscreenBlocked] = useState(false);
  const [isFullscreenUnsupported, setIsFullscreenUnsupported] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [needsFullscreenGate, setNeedsFullscreenGate] = useState(false);
  const [attemptId, setAttemptId] = useState(null);

  // 1. Hardware Media Proctoring Hook
  const {
    proctorStream,
    isHardwareVerified,
    setIsHardwareVerified,
    stopProctoringMedia,
    handleHardwareVerified,
  } = useExamMediaProctoring();

  // 2. Submission Hook
  const {
    isSubmitting,
    isSubmitted,
    gradedResult,
    submittedSnapshot,
    submittedViolations,
    submittedExamId,
    doSubmit,
    doSubmitRef,
  } = useExamSubmission({
    examId,
    isPractice,
    isPreview,
    savedResultData,
    stopProctoringMedia,
  });

  // 3. Violations & Proctoring Logic Hook
  const {
    violationCount,
    strikeCount,
    trustScore,
    resetProctor,
    handleViolation,
    violationWarning,
    dismissViolationWarning,
    finalWarningModal,
    setFinalWarningModal,
    finalWarningShownRef,
    trustZeroModal,
    trustZeroCountdown,
    strikeModalState,
    setStrikeModalState,
  } = useExamViolations({
    isPractice,
    isInitialized,
    isSubmitted,
    isFullscreenBlocked,
    stopProctoringMedia,
    doSubmitRef,
  });

  const requiresProctoring =
    !isPractice &&
    (exam?.proctorSettings?.faceCheck !== false ||
     exam?.proctorSettings?.audioCheck !== false);

  const isSessionActive = isInitialized && !isSubmitted && !isSubmitting && (!requiresProctoring || isHardwareVerified);

  // Timer Hook
  const handleTimerExpired = useCallback(() => {
    stopProctoringMedia();
    doSubmit();
  }, [doSubmit, stopProctoringMedia]);

  const { stopTimer } = useExamTimer({
    active: isSessionActive,
    onExpired: handleTimerExpired,
  });

  const handleConfirmSubmit = useCallback(() => {
    stopProctoringMedia();
    stopTimer();
    setIsSubmitModalOpen(false);
    doSubmit();
  }, [stopTimer, doSubmit, stopProctoringMedia]);

  // Lockdown Hook
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
    const onBlock = () => { if (!isPractice) setIsFullscreenBlocked(true); };
    const onUnblock = () => {
      setIsFullscreenBlocked(false);
      setNeedsFullscreenGate(false);
    };
    const onNoFullscreen = () => { if (!isPractice) setIsFullscreenUnsupported(true); };
    const onWindowBlur = () => { if (!isPractice) setIsWindowBlurred(true); };
    const onWindowFocus = () => setIsWindowBlurred(false);
    const onFullscreenGate = () => { if (!isPractice) setNeedsFullscreenGate(true); };

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

  // Tab return correction
  useEffect(() => {
    const handleTabReturn = (e) => {
      if (!isInitialized || isSubmitted) return;
      const elapsedSeconds = Math.floor(e.detail.elapsedMs / 1000);
      if (elapsedSeconds <= 0) return;

      const currentTime = useExamStore.getState().timeRemainingSeconds;
      const newTime = Math.max(0, currentTime - elapsedSeconds);
      useExamStore.getState().setTimeRemaining(newTime);

      if (newTime <= 0) {
        stopProctoringMedia();
        stopTimer();
        doSubmitRef.current?.();
        return;
      }

      if (elapsedSeconds > 30) {
        let extraDeduction = 10;
        if (elapsedSeconds > 120) extraDeduction = 20;
        else if (elapsedSeconds > 60) extraDeduction = 15;

        useProctorStore.getState().addViolation('EXTENDED_ABSENCE', extraDeduction);
      }
    };

    window.addEventListener('lockdown:tabreturn', handleTabReturn);
    return () => window.removeEventListener('lockdown:tabreturn', handleTabReturn);
  }, [isInitialized, isSubmitted, stopTimer, doSubmitRef, stopProctoringMedia]);

  // Exam fetch
  useEffect(() => {
    if (isJustSubmitted) return;
    if (!examId) {
      navigate('/dashboard', { replace: true });
      return;
    }

    let isMounted = true;
    const loadExam = async () => {
      setIsLoading(true);
      setFetchError(null);
      finalWarningShownRef.current = false;

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
  }, [examId, resetProctor, navigate, isJustSubmitted, isPractice, isPreview, initExam, setIsHardwareVerified, finalWarningShownRef]);

  const answeredCount = Object.values(answers).filter(
    (arr) => Array.isArray(arr) && arr.length > 0
  ).length;
  const remainingCount = Math.max(0, questions.length - answeredCount);

  // Results Screen
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

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-slate-900 dark:text-slate-100 mb-2" />
        <p className="text-xs font-medium">Preparing test environment...</p>
      </div>
    );
  }

  // Error Screen
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

  // Proctoring Check Gate
  if (requiresProctoring && !isHardwareVerified && !isSubmitted) {
    return (
      <ProctoringCheckGate
        exam={exam}
        onVerified={(stream) => {
          handleHardwareVerified(stream);
          setNeedsFullscreenGate(false);
        }}
        onCancel={() => navigate(examId ? `/test/${examId}` : '/dashboard')}
      />
    );
  }

  // Fullscreen Entry Gate
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

      {/* Phase 4: Camera & Audio Monitor */}
      {isSessionActive && !isPractice && (
        <CameraMonitor
          active={isSessionActive && !isPractice}
          proctorSettings={exam?.proctorSettings}
          onViolation={handleViolation}
          attemptId={attemptId}
          mediaStream={proctorStream}
        />
      )}

      {/* Phase 4: StrikeModal */}
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
        onDismissViolationWarning={dismissViolationWarning}
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
