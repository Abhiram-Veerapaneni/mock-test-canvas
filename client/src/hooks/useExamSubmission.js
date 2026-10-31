import { useState, useRef, useCallback, useEffect } from 'react';
import useExamStore from '../store/useExamStore';
import useProctorStore from '../store/useProctorStore';
import api from '../services/api';

export default function useExamSubmission({
  examId,
  isPractice,
  isPreview,
  savedResultData,
  stopProctoringMedia,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(Boolean(savedResultData));
  const [gradedResult, setGradedResult] = useState(savedResultData?.result || null);
  const [submittedSnapshot, setSubmittedSnapshot] = useState(savedResultData?.snap || null);
  const [submittedViolations, setSubmittedViolations] = useState(savedResultData?.violations || []);
  const [submittedExamId, setSubmittedExamId] = useState(savedResultData?.examId || examId);

  const doSubmitRef = useRef(null);

  const doSubmit = useCallback(async () => {
    setIsSubmitting(true);
    stopProctoringMedia();

    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    const currentExam = useExamStore.getState().exam;
    const currentAnswers = useExamStore.getState().answers;
    const currentQuestions = useExamStore.getState().questions;
    const currentViolations = useProctorStore.getState().violations;
    const clearStoredSession = useExamStore.getState().clearStoredSession;

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
    } finally {
      clearStoredSession?.();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('active_exam_id');
      }
      useExamStore.getState().setActiveExamId?.(null);
      stopProctoringMedia();

      const finalExamId = currentExam?._id || examId;
      const snapshotObj = currentExam ? {
        title: currentExam.title,
        markingScheme: currentExam.markingScheme,
        totalMarks: currentExam.totalMarks,
        totalQuestions: currentQuestions.length,
      } : submittedSnapshot;

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
  }, [examId, isPractice, isPreview, stopProctoringMedia, submittedSnapshot]);

  useEffect(() => {
    doSubmitRef.current = doSubmit;
  }, [doSubmit]);

  useEffect(() => {
    if (isSubmitted) {
      stopProctoringMedia();
    }
  }, [isSubmitted, stopProctoringMedia]);

  return {
    isSubmitting,
    isSubmitted,
    gradedResult,
    submittedSnapshot,
    submittedViolations,
    submittedExamId,
    doSubmit,
    doSubmitRef,
  };
}

