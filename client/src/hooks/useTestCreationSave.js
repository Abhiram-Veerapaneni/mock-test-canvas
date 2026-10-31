import { useState } from 'react';
import api from '../services/api';

export default function useTestCreationSave({
  user,
  isAuthenticated,
  openAuthModal,
  navigate,
  title,
  setTitle,
  description,
  category,
  durationMinutes,
  correctMark,
  incorrectMark,
  isUnlimitedAttempts,
  maxAttemptsValue,
  allowPracticeMode,
  allowReviewResponses,
  isScheduled,
  startTime,
  endTime,
  faceCheck,
  audioCheck,
  fullScreenLock,
  objectCheck,
  liveNotifications,
  questions,
  contributeAllToBank,
  existingExamId,
  setExistingExamId,
  setExamStatus,
  originalExamRef,
  setHasUnsavedChanges,
  hasUnsavedChangesRef,
  setLastSavedTime,
  setAutoSaveStatus,
  setDraftRestored,
  setError,
  setSuccessMsg,
  error,
  pendingNavigation,
  setPendingNavigation,
  setShowLeaveModal,
  setLeaveModalError,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleInitiatePublish = (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim()) {
      setError('Please provide an assessment title before publishing.');
      return;
    }
    if (questions.length === 0) {
      setError('Please add at least one question before publishing.');
      return;
    }
    if (isScheduled) {
      if (!startTime || !endTime) {
        setError('Please set both Start Time and End Time for scheduled assessment.');
        return;
      }
      if (new Date(endTime) <= new Date(startTime)) {
        setError('Schedule End Time must be later than Start Time.');
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const executeSaveExam = async (targetStatus = 'published', skipRedirect = false) => {
    setError('');
    setSuccessMsg('');

    if (!isAuthenticated) {
      openAuthModal({
        title: targetStatus === 'draft' ? 'Sign In to Save Draft' : 'Sign In to Publish Exam',
        subtitle: 'Log in or create a candidate account to save and publish your assessments.',
        onSuccess: () => executeSaveExam(targetStatus, skipRedirect)
      });
      return false;
    }

    const isDraft = targetStatus === 'draft';
    const effectiveTitle = title.trim() || (isDraft ? 'Untitled Assessment Draft' : '');

    if (!effectiveTitle) {
      setError('Please provide an assessment title.');
      return false;
    }
    if (!title.trim() && isDraft) {
      setTitle(effectiveTitle);
    }

    if (!isDraft && questions.length === 0) {
      setError('Please add at least one question before publishing.');
      return false;
    }

    if (isDraft) {
      setIsSavingDraft(true);
    } else {
      setIsSaving(true);
    }

    try {
      const payload = {
        title: effectiveTitle,
        description: description.trim(),
        category,
        status: targetStatus,
        durationMinutes: Number(durationMinutes) || 60,
        markingScheme: {
          correct: Number(correctMark) || 4,
          incorrect: Number(incorrectMark) || -1
        },
        maxAttempts: isUnlimitedAttempts ? null : Math.max(1, Number(maxAttemptsValue)),
        allowPracticeMode: Boolean(allowPracticeMode),
        allowReviewResponses: Boolean(allowReviewResponses),
        contributeAllToBank: Boolean(contributeAllToBank),
        schedule: {
          isScheduled: Boolean(isScheduled),
          startTime: isScheduled && startTime ? new Date(startTime).toISOString() : null,
          endTime: isScheduled && endTime ? new Date(endTime).toISOString() : null
        },
        proctorSettings: {
          faceCheck,
          audioCheck,
          fullScreenLock,
          objectCheck,
          liveNotifications,
          maxWarningsAllowed: 3
        },
        questions
      };

      let res;
      if (existingExamId) {
        res = await api.put(`/exams/${existingExamId}`, payload);
      } else {
        res = await api.post('/exams', payload);
      }

      if (res.data?.success) {
        setExamStatus(targetStatus);
        const savedExam = res.data.exam;
        originalExamRef.current = savedExam;
        const newExamId = savedExam?._id || existingExamId;
        if (savedExam?._id) setExistingExamId(savedExam._id);

        setHasUnsavedChanges(false);
        hasUnsavedChangesRef.current = false;

        if (isDraft) {
          try {
            const uId = user?._id || 'guest';
            localStorage.removeItem(`pmt_draft_exam_${uId}_new`);
            localStorage.removeItem('pmt_draft_exam_new');
            if (newExamId) {
              localStorage.setItem(`pmt_draft_exam_${uId}_${newExamId}`, JSON.stringify({
                ...payload,
                existingExamId: newExamId,
                hasUnsavedChanges: false,
                isSyncedWithServer: true,
                savedAt: new Date().toISOString()
              }));
              if (!skipRedirect) {
                navigate(`/create-test?examId=${newExamId}`, { replace: true });
              }
            }
          } catch (e) {
            console.warn('Failed to update local storage draft after server save:', e);
          }
          setLastSavedTime(new Date());
          setAutoSaveStatus('saved');
          setDraftRestored(false);
          setSuccessMsg('Assessment draft saved successfully to your account! You can continue editing.');
          return true;
        } else {
          try {
            const uId = user?._id || 'guest';
            if (newExamId) {
              localStorage.removeItem(`pmt_draft_exam_${uId}_${newExamId}`);
              localStorage.removeItem(`pmt_draft_exam_${newExamId}`);
            }
            localStorage.removeItem(`pmt_draft_exam_${uId}_new`);
            localStorage.removeItem('pmt_draft_exam_new');
          } catch (e) {
            console.warn('Failed to clear local storage draft after publish:', e);
          }
          setDraftRestored(false);
          setSuccessMsg('Examination published successfully! Redirecting to candidate dashboard...');
          if (!skipRedirect) {
            setTimeout(() => {
              navigate('/dashboard');
            }, 1200);
          }
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Failed to save exam:', err);
      const errMsg = err.response?.data?.message || 'Error saving examination. Please try again.';
      setError(errMsg);
      return false;
    } finally {
      setIsSaving(false);
      setIsSavingDraft(false);
    }
  };

  const handleSaveAndLeave = async () => {
    setLeaveModalError('');
    setIsSavingDraft(true);

    if (!isAuthenticated) {
      setLeaveModalError('Please sign in to save your draft to your account.');
      setIsSavingDraft(false);
      openAuthModal({
        title: 'Sign In to Save Draft',
        subtitle: 'Log in to save your assessment draft before leaving.',
        onSuccess: async () => {
          const ok = await executeSaveExam('draft', true);
          if (ok) {
            setShowLeaveModal(false);
            const target = pendingNavigation || '/dashboard';
            setPendingNavigation(null);
            setHasUnsavedChanges(false);
            navigate(target);
          }
        }
      });
      return;
    }

    try {
      const ok = await executeSaveExam('draft', true);
      if (ok) {
        setShowLeaveModal(false);
        const target = pendingNavigation || '/dashboard';
        setPendingNavigation(null);
        setHasUnsavedChanges(false);
        navigate(target);
      } else {
        setLeaveModalError(error || 'Failed to save draft to database. Please try again.');
      }
    } catch (err) {
      setLeaveModalError(err.response?.data?.message || err.message || 'Error saving draft to database');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSaveExam = (e, targetStatus = 'published') => {
    if (targetStatus === 'published') {
      handleInitiatePublish(e);
    } else {
      executeSaveExam('draft');
    }
  };

  return {
    isSaving,
    isSavingDraft,
    showConfirmModal,
    setShowConfirmModal,
    handleInitiatePublish,
    executeSaveExam,
    handleSaveAndLeave,
    handleSaveExam,
  };
}

