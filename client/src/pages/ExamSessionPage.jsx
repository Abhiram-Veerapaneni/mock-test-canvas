import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useExamStore from '../store/useExamStore';
import api from '../services/api';
import ExamHeader from '../components/exam-player/ExamHeader';
import QuestionCanvas from '../components/exam-player/QuestionCanvas';
import QuestionPalette from '../components/exam-player/QuestionPalette';
import Modal from '../components/common/Modal';
import useExamTimer from '../hooks/useExamTimer';
import useBrowserLockdown from '../hooks/useBrowserLockdown';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, Maximize, ShieldAlert } from 'lucide-react';

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
  const [isFullscreenBlocked, setIsFullscreenBlocked] = useState(false);
  const [violations, setViolations] = useState([]);

  // ── Violation handler ────────────────────────────────────────────────────────
  const handleViolation = useCallback((type) => {
    setViolations((prev) => [...prev, { type, timestamp: new Date().toISOString() }]);
    console.warn(`[Lockdown] Violation: ${type}`);
  }, []);

  // ── 3.1 Drift-free Web Worker timer ─────────────────────────────────────────
  const handleTimerExpired = useCallback(() => {
    // Auto-submit when time runs out
    setIsSubmitted(true);
    clearStoredSession();
  }, [clearStoredSession]);

  useExamTimer({
    active: isInitialized && !isSubmitted,
    onExpired: handleTimerExpired,
  });

  // ── 3.2 Browser lockdown (fullscreen + traps) ────────────────────────────────
  const { enterFullscreen, dismissBlocker } = useBrowserLockdown({
    active: isInitialized && !isSubmitted,
    onViolation: handleViolation,
  });

  // Listen for the custom events the lockdown hook dispatches
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

  // ── Exam fetch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const loadExam = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await api.get(`/exams/${examId}`);
        if (res.data?.success && res.data.exam) {
          if (isMounted) {
            initExam(res.data.exam);
          }
        } else {
          throw new Error('Invalid exam payload');
        }
      } catch (err) {
        console.error('Error loading exam:', err);
        if (isMounted) {
          setFetchError(err.response?.data?.message || 'Could not load examination.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (examId) {
      loadExam();
    }

    return () => {
      isMounted = false;
    };
  }, [examId]);

  // ── Submit handlers ──────────────────────────────────────────────────────────
  const handleConfirmSubmit = () => {
    setIsSubmitModalOpen(false);
    setIsSubmitted(true);
    clearStoredSession();
  };

  const answeredCount = Object.keys(answers).length;
  const remainingCount = Math.max(0, questions.length - answeredCount);

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-medium">Preparing test environment...</p>
      </div>
    );
  }

  // ── Fetch error ──────────────────────────────────────────────────────────────
  if (fetchError || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-900 dark:text-slate-100">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center shadow-xs">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Examination Unavailable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{fetchError || 'Unable to locate examination.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Submitted completion screen ──────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-900 dark:text-slate-100">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Examination Submitted
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
            Your answers for <strong className="text-slate-900 dark:text-white">{exam.title}</strong> have been recorded.
            Grading evaluation applies +{exam.markingScheme.correct} / {exam.markingScheme.incorrect}.
          </p>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 mb-5 text-left">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Total Items</span>
              <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{questions.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Answered</span>
              <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{answeredCount}</span>
            </div>
            {violations.length > 0 && (
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">Violations Recorded</span>
                <span className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">{violations.length}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* 1. Header Bar */}
      <ExamHeader
        onSubmitClick={() => setIsSubmitModalOpen(true)}
        violationCount={violations.length}
      />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <QuestionCanvas />
        <QuestionPalette />
      </div>

      {/* 3. Fullscreen Blocked Overlay (unclosable) */}
      {isFullscreenBlocked && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-sm w-full">
            {/* Animated warning icon */}
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center mx-auto mb-5 animate-pulse">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>

            <h2 className="text-lg font-bold text-white mb-2">
              Fullscreen Mode Exited
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-1">
              Exiting fullscreen during an examination is a proctoring violation.
              This incident has been recorded.
            </p>
            <p className="text-xs text-rose-400 font-medium mb-7">
              Violations recorded: {violations.length}
            </p>

            <button
              onClick={dismissBlocker}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 shadow-lg shadow-blue-600/20"
            >
              <Maximize className="w-4 h-4" />
              Re-enter Fullscreen to Continue
            </button>

            <p className="text-[11px] text-slate-600 mt-4">
              Your exam progress has been preserved. You may continue after re-entering fullscreen.
            </p>
          </div>
        </div>
      )}

      {/* 4. Submit Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Confirm Examination Submission"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you wish to submit your assessment? Once submitted, answers cannot be modified.
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
