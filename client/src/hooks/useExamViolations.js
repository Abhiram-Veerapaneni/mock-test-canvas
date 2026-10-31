import { useState, useRef, useEffect, useCallback } from 'react';
import useProctorStore from '../store/useProctorStore';

const FINAL_WARNING_THRESHOLD = 30;
const VISION_AUDIO_TYPES = new Set([
  'NO_FACE', 'MULTI_FACE', 'NOISE_SPIKE',
  'CELL_PHONE', 'PROHIBITED_BOOK', 'PROHIBITED_OBJECT'
]);

export default function useExamViolations({
  isPractice,
  isInitialized,
  isSubmitted,
  isFullscreenBlocked,
  stopProctoringMedia,
  doSubmitRef,
}) {
  const { violations, violationCount, strikeCount, trustScore, addViolation, resetProctor, activeExamId } = useProctorStore();

  const [violationWarning, setViolationWarning] = useState({ open: false, type: null });
  const violationTimerRef = useRef(null);

  const [trustZeroModal, setTrustZeroModal] = useState(false);
  const [trustZeroCountdown, setTrustZeroCountdown] = useState(5);

  const [finalWarningModal, setFinalWarningModal] = useState(false);
  const finalWarningShownRef = useRef(false);

  const [strikeModalState, setStrikeModalState] = useState({ open: false, type: null });

  const handleViolation = useCallback((type) => {
    if (isPractice) return;
    const recorded = addViolation(type);
    if (recorded) {
      console.warn(`[Lockdown] Violation: ${type}`);
      if (VISION_AUDIO_TYPES.has(type)) {
        setStrikeModalState({ open: true, type });
      }
    }
  }, [addViolation, isPractice]);

  // Violation popup timer
  useEffect(() => {
    if (isPractice || violationCount === 0 || isSubmitted || isFullscreenBlocked) return;
    const latest = violations[violations.length - 1];
    if (!latest) return;

    clearTimeout(violationTimerRef.current);
    setViolationWarning({ open: true, type: latest.type });
    violationTimerRef.current = setTimeout(
      () => setViolationWarning({ open: false, type: null }),
      4000
    );
    return () => clearTimeout(violationTimerRef.current);
  }, [violationCount, isPractice, isSubmitted, isFullscreenBlocked, violations]);

  // Final warning threshold
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
      clearTimeout(violationTimerRef.current);
      setViolationWarning({ open: false, type: null });
    }
  }, [trustScore, isInitialized, isSubmitted, isPractice]);

  // Trust score zero -> auto submit
  useEffect(() => {
    if (isPractice || trustScore !== 0 || isSubmitted || !isInitialized) return;
    setTrustZeroModal(true);
    setFinalWarningModal(false);
    clearTimeout(violationTimerRef.current);
    setViolationWarning({ open: false, type: null });
    setTrustZeroCountdown(5);

    const interval = setInterval(() => {
      setTrustZeroCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);

    const submitTimer = setTimeout(() => {
      stopProctoringMedia();
      setTrustZeroModal(false);
      doSubmitRef.current?.();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(submitTimer);
    };
  }, [trustScore, isPractice, isSubmitted, isInitialized, stopProctoringMedia, doSubmitRef]);

  const dismissViolationWarning = useCallback(() => {
    clearTimeout(violationTimerRef.current);
    setViolationWarning({ open: false, type: null });
  }, []);

  return {
    violations,
    violationCount,
    strikeCount,
    trustScore,
    resetProctor,
    activeExamId,
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
  };
}

