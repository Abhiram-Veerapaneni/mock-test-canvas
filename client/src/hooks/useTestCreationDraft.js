import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

export default function useTestCreationDraft({
  user,
  existingExamId,
  setExistingExamId,
  examStatus,
  setExamStatus,
  isLoadingExisting,
  examIdParam,
  navigate,
  formData,
  formSetters,
  originalExamRef,
  isInitialLoadFinishedRef,
  setError,
  setSuccessMsg
}) {
  const {
    title,
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
    activeStudioTab
  } = formData;

  const {
    setTitle,
    setDescription,
    setCategory,
    setDurationMinutes,
    setCorrectMark,
    setIncorrectMark,
    setIsUnlimitedAttempts,
    setMaxAttemptsValue,
    setAllowPracticeMode,
    setAllowReviewResponses,
    setIsScheduled,
    setStartTime,
    setEndTime,
    setFaceCheck,
    setAudioCheck,
    setFullScreenLock,
    setObjectCheck,
    setLiveNotifications,
    setQuestions,
    setContributeAllToBank,
    setActiveStudioTab
  } = formSetters;

  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftRestoredTime, setDraftRestoredTime] = useState('');
  const [draftToastHovered, setDraftToastHovered] = useState(false);
  const [toastConfirmDiscard, setToastConfirmDiscard] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [leaveModalError, setLeaveModalError] = useState('');
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [isDiscardingCloud, setIsDiscardingCloud] = useState(false);

  const isInitialMountRef = useRef(true);
  const isDiscardingOrLoggingOutRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);

  // Keep draftDataRef updated on every render
  const draftDataRef = useRef(null);
  draftDataRef.current = {
    existingExamId,
    title,
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
    examStatus,
    activeStudioTab
  };

  // Draft key scoped strictly to active user ID
  const getDraftStorageKey = useCallback((examId) => {
    const uId = user?._id || 'guest';
    return examId ? `pmt_draft_exam_${uId}_${examId}` : `pmt_draft_exam_${uId}_new`;
  }, [user?._id]);

  // Find local draft for an existing exam
  const findLocalDraftForExam = useCallback((examId) => {
    if (!examId) return null;
    const uId = user?._id || 'guest';

    if (uId && uId !== 'guest') {
      const scopedKey = `pmt_draft_exam_${uId}_${examId}`;
      const raw = localStorage.getItem(scopedKey);
      if (raw) return { key: scopedKey, raw };
    }

    const legacyKey = `pmt_draft_exam_${examId}`;
    const rawLegacy = localStorage.getItem(legacyKey);
    if (rawLegacy) return { key: legacyKey, raw: rawLegacy };

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('pmt_draft_exam_') && k.endsWith(`_${examId}`)) {
        const raw = localStorage.getItem(k);
        if (raw) return { key: k, raw };
      }
    }

    return null;
  }, [user?._id]);

  // Find local draft for a new exam
  const findLocalDraftForNew = useCallback(() => {
    const uId = user?._id || 'guest';
    if (uId && uId !== 'guest') {
      const scopedKey = `pmt_draft_exam_${uId}_new`;
      const raw = localStorage.getItem(scopedKey);
      if (raw) return { key: scopedKey, raw };
    }
    const generalKey = 'pmt_draft_exam_new';
    const rawGen = localStorage.getItem(generalKey);
    if (rawGen) return { key: generalKey, raw: rawGen };

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('pmt_draft_exam_') && k.endsWith('_new')) {
        const raw = localStorage.getItem(k);
        if (raw) return { key: k, raw };
      }
    }
    return null;
  }, [user?._id]);

  // Save current draft to local storage
  const saveDraftToStorage = useCallback((customData = null) => {
    if (isDiscardingOrLoggingOutRef.current) return false;
    const data = customData || draftDataRef.current;
    if (!data) return false;

    const hasContent = Boolean(
      (data.title && data.title.trim()) ||
      (data.description && data.description.trim()) ||
      (Array.isArray(data.questions) && data.questions.length > 0)
    );

    if (!hasContent) return false;

    const isNew = !data.existingExamId;
    const isUnsaved = Boolean(hasUnsavedChangesRef.current || isNew);

    const key = getDraftStorageKey(data.existingExamId);
    const payload = {
      ...data,
      hasUnsavedChanges: isUnsaved,
      isSyncedWithServer: !isUnsaved,
      savedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(key, JSON.stringify(payload));
      setLastSavedTime(new Date());
      setAutoSaveStatus('saved');
      return true;
    } catch (err) {
      console.warn('Failed to save draft to localStorage:', err);
      return false;
    }
  }, [getDraftStorageKey]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Auto-dismiss draft restored toast
  useEffect(() => {
    if (!draftRestored) {
      setDraftToastHovered(false);
      setToastConfirmDiscard(false);
      return;
    }
    if (discardModalOpen || draftToastHovered || toastConfirmDiscard) return;

    const timer = setTimeout(() => {
      setDraftRestored(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [draftRestored, discardModalOpen, draftToastHovered, toastConfirmDiscard]);

  useEffect(() => {
    const handleLogoutInProgress = () => {
      isDiscardingOrLoggingOutRef.current = true;
    };
    const handleFlushDraft = () => {
      if (hasUnsavedChangesRef.current && !isDiscardingOrLoggingOutRef.current) {
        saveDraftToStorage();
      }
    };

    window.addEventListener('pmt_logout_in_progress', handleLogoutInProgress);
    window.addEventListener('pmt_flush_draft_before_logout', handleFlushDraft);
    return () => {
      window.removeEventListener('pmt_logout_in_progress', handleLogoutInProgress);
      window.removeEventListener('pmt_flush_draft_before_logout', handleFlushDraft);
    };
  }, [saveDraftToStorage]);

  // 1. Store draft in local storage after each change
  useEffect(() => {
    if (isLoadingExisting) return;

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (isInitialLoadFinishedRef.current?.current) {
      isInitialLoadFinishedRef.current.current = false;
      return;
    }

    const hasContent = Boolean(
      (title && title.trim()) ||
      (description && description.trim()) ||
      (questions && questions.length > 0)
    );

    if (!hasContent) {
      setAutoSaveStatus('idle');
      return;
    }

    setAutoSaveStatus('saving');
    setHasUnsavedChanges(true);

    const timer = setTimeout(() => {
      saveDraftToStorage();
    }, 400);

    return () => clearTimeout(timer);
  }, [
    title,
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
    activeStudioTab,
    isLoadingExisting,
    saveDraftToStorage,
    isInitialLoadFinishedRef
  ]);

  // 2. Before leaving or refreshing: Save immediately and prompt the user if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      saveDraftToStorage();
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handlePageHide = () => {
      saveDraftToStorage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveDraftToStorage();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      saveDraftToStorage();
    };
  }, [hasUnsavedChanges, saveDraftToStorage]);

  // 3. Intercept in-app navigation
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleDocumentClick = (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;
      if (anchor.target === '_blank') return;
      if (anchor.closest('[role="dialog"]') && !anchor.closest('header')) return;

      try {
        const destUrl = new URL(anchor.href, window.location.origin);
        if (destUrl.origin === window.location.origin) {
          const currentPath = window.location.pathname + window.location.search;
          const targetPath = destUrl.pathname + destUrl.search;
          if (currentPath !== targetPath) {
            e.preventDefault();
            e.stopPropagation();
            setPendingNavigation(targetPath);
            setShowLeaveModal(true);
          }
        }
      } catch (err) {
        // Ignore invalid URLs
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [hasUnsavedChanges]);

  // Handle in-app return navigation
  const handleNavigateAway = useCallback((targetUrl, e) => {
    if (e) e.preventDefault();
    if (hasUnsavedChanges) {
      setPendingNavigation(targetUrl);
      setShowLeaveModal(true);
    } else {
      navigate(targetUrl);
    }
  }, [hasUnsavedChanges, navigate]);

  // 4. Restore draft from local storage for new exams
  useEffect(() => {
    if (examIdParam) return;

    try {
      const draftMatch = findLocalDraftForNew();
      if (draftMatch?.raw) {
        const draft = JSON.parse(draftMatch.raw);
        const hasContent = Boolean(
          (draft.title && draft.title.trim()) ||
          (draft.description && draft.description.trim()) ||
          (Array.isArray(draft.questions) && draft.questions.length > 0)
        );

        if (hasContent) {
          if (draft.title !== undefined) setTitle(draft.title);
          if (draft.description !== undefined) setDescription(draft.description);
          if (draft.category !== undefined) setCategory(draft.category);
          if (draft.durationMinutes !== undefined) setDurationMinutes(draft.durationMinutes);
          if (draft.correctMark !== undefined) setCorrectMark(draft.correctMark);
          if (draft.incorrectMark !== undefined) setIncorrectMark(draft.incorrectMark);
          if (draft.isUnlimitedAttempts !== undefined) setIsUnlimitedAttempts(draft.isUnlimitedAttempts);
          if (draft.maxAttemptsValue !== undefined) setMaxAttemptsValue(draft.maxAttemptsValue);
          if (draft.allowPracticeMode !== undefined) setAllowPracticeMode(draft.allowPracticeMode);
          if (draft.allowReviewResponses !== undefined) setAllowReviewResponses(draft.allowReviewResponses);
          if (draft.isScheduled !== undefined) setIsScheduled(draft.isScheduled);
          if (draft.startTime !== undefined) setStartTime(draft.startTime);
          if (draft.endTime !== undefined) setEndTime(draft.endTime);
          if (draft.faceCheck !== undefined) setFaceCheck(draft.faceCheck);
          if (draft.audioCheck !== undefined) setAudioCheck(draft.audioCheck);
          if (draft.fullScreenLock !== undefined) setFullScreenLock(draft.fullScreenLock);
          if (draft.objectCheck !== undefined) setObjectCheck(draft.objectCheck);
          if (draft.liveNotifications !== undefined) setLiveNotifications(draft.liveNotifications);
          if (Array.isArray(draft.questions)) setQuestions(draft.questions);
          if (draft.contributeAllToBank !== undefined) setContributeAllToBank(draft.contributeAllToBank);
          if (draft.activeStudioTab) setActiveStudioTab(draft.activeStudioTab);

          setDraftRestored(true);
          if (draft.savedAt) {
            const d = new Date(draft.savedAt);
            setDraftRestoredTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setLastSavedTime(d);
          }
          setAutoSaveStatus('saved');
          setHasUnsavedChanges(true);
        }
      }
    } catch (err) {
      console.warn('Failed to parse draft from localStorage:', err);
    }
  }, [examIdParam, user?._id, findLocalDraftForNew]);

  // Discard local restored draft changes only
  const handleDiscardLocalDraft = () => {
    isDiscardingOrLoggingOutRef.current = true;
    const uId = user?._id || 'guest';

    try {
      if (existingExamId) {
        localStorage.removeItem(`pmt_draft_exam_${uId}_${existingExamId}`);
        localStorage.removeItem(`pmt_draft_exam_${existingExamId}`);
      }
      localStorage.removeItem(`pmt_draft_exam_${uId}_new`);
      localStorage.removeItem('pmt_draft_exam_new');
    } catch (e) {
      console.warn('Error clearing local draft:', e);
    }

    setDraftRestored(false);
    setDraftRestoredTime(null);
    setToastConfirmDiscard(false);

    if (existingExamId && originalExamRef?.current) {
      const ex = originalExamRef.current;
      setTitle(ex.title || '');
      setDescription(ex.description || '');
      setCategory(ex.category || 'JEE');
      setDurationMinutes(ex.durationMinutes || 60);
      setExamStatus(ex.status || 'published');
      if (ex.markingScheme) {
        setCorrectMark(ex.markingScheme.correct ?? 4);
        setIncorrectMark(ex.markingScheme.incorrect ?? -1);
      }
      if (ex.maxAttempts === null || ex.maxAttempts === undefined) {
        setIsUnlimitedAttempts(true);
      } else {
        setIsUnlimitedAttempts(false);
        setMaxAttemptsValue(ex.maxAttempts);
      }
      if (ex.proctorSettings) {
        setFaceCheck(ex.proctorSettings.faceCheck ?? true);
        setAudioCheck(ex.proctorSettings.audioCheck ?? true);
        setFullScreenLock(ex.proctorSettings.fullScreenLock ?? true);
        setObjectCheck(ex.proctorSettings.objectCheck ?? true);
        setLiveNotifications(ex.proctorSettings.liveNotifications ?? false);
      }
      if (ex.allowPracticeMode !== undefined) {
        setAllowPracticeMode(Boolean(ex.allowPracticeMode));
      }
      if (ex.allowReviewResponses !== undefined) {
        setAllowReviewResponses(Boolean(ex.allowReviewResponses));
      }
      if (ex.schedule) {
        setIsScheduled(Boolean(ex.schedule.isScheduled));
        const pad = (n) => String(n).padStart(2, '0');
        if (ex.schedule.startTime) {
          const st = new Date(ex.schedule.startTime);
          setStartTime(`${st.getFullYear()}-${pad(st.getMonth() + 1)}-${pad(st.getDate())}T${pad(st.getHours())}:${pad(st.getMinutes())}`);
        }
        if (ex.schedule.endTime) {
          const et = new Date(ex.schedule.endTime);
          setEndTime(`${et.getFullYear()}-${pad(et.getMonth() + 1)}-${pad(et.getDate())}T${pad(et.getHours())}:${pad(et.getMinutes())}`);
        }
      }
      if (Array.isArray(ex.questions)) {
        setQuestions(ex.questions);
      }
      setHasUnsavedChanges(false);
      hasUnsavedChangesRef.current = false;
      setAutoSaveStatus('idle');
      setSuccessMsg('Local draft changes discarded. Reverted to database version.');
    } else {
      setTitle('');
      setDescription('');
      setCategory('JEE');
      setDurationMinutes(60);
      setCorrectMark(4);
      setIncorrectMark(-1);
      setIsUnlimitedAttempts(true);
      setMaxAttemptsValue(3);
      setAllowPracticeMode(true);
      setAllowReviewResponses(true);
      setIsScheduled(false);
      setStartTime('');
      setEndTime('');
      setFaceCheck(true);
      setAudioCheck(true);
      setFullScreenLock(true);
      setObjectCheck(true);
      setLiveNotifications(false);
      setQuestions([]);
      setHasUnsavedChanges(false);
      hasUnsavedChangesRef.current = false;
      setAutoSaveStatus('idle');
      setSuccessMsg('Local draft discarded.');
    }

    setTimeout(() => {
      isDiscardingOrLoggingOutRef.current = false;
    }, 400);
  };

  const handleDiscardDraft = () => {
    setDiscardModalOpen(true);
  };

  // Confirmed discard (both cloud & local device)
  const handleConfirmDiscardDraft = async () => {
    setIsDiscardingCloud(true);
    isDiscardingOrLoggingOutRef.current = true;
    const uId = user?._id || 'guest';

    try {
      if (existingExamId) {
        await api.delete(`/exams/${existingExamId}`);
      }

      try {
        if (existingExamId) {
          localStorage.removeItem(`pmt_draft_exam_${uId}_${existingExamId}`);
          localStorage.removeItem(`pmt_draft_exam_${existingExamId}`);
        }
        localStorage.removeItem(`pmt_draft_exam_${uId}_new`);
        localStorage.removeItem('pmt_draft_exam_new');
      } catch (e) {
        console.warn('Error clearing draft:', e);
      }

      setDraftRestored(false);
      setAutoSaveStatus('idle');
      setLastSavedTime(null);
      setHasUnsavedChanges(false);
      setDiscardModalOpen(false);

      if (existingExamId) {
        navigate('/dashboard');
      } else {
        setTitle('');
        setDescription('');
        setCategory('JEE');
        setDurationMinutes(60);
        setCorrectMark(4);
        setIncorrectMark(-1);
        setIsUnlimitedAttempts(true);
        setMaxAttemptsValue(3);
        setAllowPracticeMode(true);
        setAllowReviewResponses(true);
        setIsScheduled(false);
        setStartTime('');
        setEndTime('');
        setFaceCheck(true);
        setAudioCheck(true);
        setFullScreenLock(true);
        setObjectCheck(true);
        setLiveNotifications(false);
        setQuestions([]);
        setSuccessMsg('Draft discarded successfully.');
      }
    } catch (err) {
      console.error('Failed to discard draft:', err);
      setError(err.response?.data?.message || 'Error discarding assessment draft.');
    } finally {
      setIsDiscardingCloud(false);
    }
  };

  return {
    autoSaveStatus,
    setAutoSaveStatus,
    lastSavedTime,
    setLastSavedTime,
    draftRestored,
    setDraftRestored,
    draftRestoredTime,
    setDraftRestoredTime,
    draftToastHovered,
    setDraftToastHovered,
    toastConfirmDiscard,
    setToastConfirmDiscard,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    showLeaveModal,
    setShowLeaveModal,
    pendingNavigation,
    setPendingNavigation,
    leaveModalError,
    setLeaveModalError,
    discardModalOpen,
    setDiscardModalOpen,
    isDiscardingCloud,
    saveDraftToStorage,
    handleDiscardLocalDraft,
    handleDiscardDraft,
    handleConfirmDiscardDraft,
    handleNavigateAway,
    findLocalDraftForExam,
    hasUnsavedChangesRef,
    draftDataRef
  };
}
