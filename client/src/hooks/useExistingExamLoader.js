import { useEffect } from 'react';
import api from '../services/api';

export default function useExistingExamLoader({
  examIdParam,
  findLocalDraftForExam,
  setIsLoadingExisting,
  setExistingExamId,
  originalExamRef,
  formSetters,
  setDraftRestored,
  setDraftRestoredTime,
  setLastSavedTime,
  setAutoSaveStatus,
  setHasUnsavedChanges,
  hasUnsavedChangesRef,
  isInitialLoadFinishedRef,
  setExamStatus,
  setError,
}) {
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
    setActiveStudioTab,
  } = formSetters;

  useEffect(() => {
    if (!examIdParam) return;
    setIsLoadingExisting(true);
    api.get(`/exams/${examIdParam}?reveal=true`)
      .then((res) => {
        if (res.data?.success && res.data.exam) {
          const ex = res.data.exam;
          originalExamRef.current = ex;
          setExistingExamId(ex._id);

          let restoredFromLocal = false;
          try {
            const draftMatch = findLocalDraftForExam(ex._id);
            if (draftMatch?.raw) {
              const draft = JSON.parse(draftMatch.raw);
              const draftTime = draft.savedAt ? new Date(draft.savedAt).getTime() : 0;
              const serverTime = ex.updatedAt ? new Date(ex.updatedAt).getTime() : 0;

              const hasLocalChanges = Boolean(
                draft.hasUnsavedChanges === true ||
                draft.isSyncedWithServer === false ||
                (Array.isArray(draft.questions) && draft.questions.length !== (ex.questions?.length || 0)) ||
                draftTime > serverTime
              );

              if (hasLocalChanges) {
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
                const d = draft.savedAt ? new Date(draft.savedAt) : new Date();
                setDraftRestoredTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                setLastSavedTime(d);
                setAutoSaveStatus('saved');
                setHasUnsavedChanges(true);
                hasUnsavedChangesRef.current = true;
                isInitialLoadFinishedRef.current = true;
                restoredFromLocal = true;
              }
            }
          } catch (e) {
            console.warn('Error checking local draft for existing exam:', e);
          }

          if (!restoredFromLocal) {
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
            if (ex.contributeAllToBank !== undefined) {
              setContributeAllToBank(Boolean(ex.contributeAllToBank));
            } else if (Array.isArray(ex.questions) && ex.questions.length > 0) {
              setContributeAllToBank(ex.questions.every((q) => Boolean(q.isInBank)));
            }
            setHasUnsavedChanges(false);
            hasUnsavedChangesRef.current = false;
            isInitialLoadFinishedRef.current = true;
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch existing exam (offline or network error):', err);
        try {
          const draftMatch = findLocalDraftForExam(examIdParam);
          if (draftMatch?.raw) {
            const draft = JSON.parse(draftMatch.raw);
            if (draft.title !== undefined) setTitle(draft.title);
            if (draft.description !== undefined) setDescription(draft.description);
            if (draft.category !== undefined) setCategory(draft.category);
            if (draft.durationMinutes !== undefined) setDurationMinutes(draft.durationMinutes);
            if (draft.correctMark !== undefined) setCorrectMark(draft.correctMark);
            if (draft.incorrectMark !== undefined) setIncorrectMark(draft.incorrectMark);
            if (Array.isArray(draft.questions)) setQuestions(draft.questions);
            if (draft.contributeAllToBank !== undefined) setContributeAllToBank(draft.contributeAllToBank);
            setExistingExamId(examIdParam);
            setDraftRestored(true);
            setDraftRestoredTime(draft.savedAt ? new Date(draft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
            setAutoSaveStatus('saved');
            setError('Working offline: loaded cached draft from local storage.');
            return;
          }
        } catch (e) {
          console.warn('Offline draft load failed:', e);
        }
        setError('Failed to load assessment: ' + (err.response?.data?.message || err.message));
      })
      .finally(() => setIsLoadingExisting(false));
  }, [examIdParam, findLocalDraftForExam, formSetters, hasUnsavedChangesRef, isInitialLoadFinishedRef, originalExamRef, setAutoSaveStatus, setDraftRestored, setDraftRestoredTime, setError, setExamStatus, setExistingExamId, setHasUnsavedChanges, setIsLoadingExisting, setLastSavedTime]);
}
