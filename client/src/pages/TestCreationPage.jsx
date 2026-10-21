import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ManualQuestionForm from '../components/test-builder/ManualQuestionForm';
import TestCreationHeader from '../components/test-builder/TestCreationHeader';
import TestSettingsTab from '../components/test-builder/TestSettingsTab';
import AIDropzoneCard from '../components/test-builder/AIDropzoneCard';
import QuestionListSection from '../components/test-builder/QuestionListSection';
import TestCreationModals from '../components/test-builder/TestCreationModals';
import useTestCreationDraft from '../hooks/useTestCreationDraft';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { BookOpen, Sliders, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TestCreationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examIdParam = searchParams.get('examId');

  const { user, isAuthenticated, openAuthModal } = useAuthStore();

  const [existingExamId, setExistingExamId] = useState(examIdParam || null);
  const [examStatus, setExamStatus] = useState('draft');
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [tempExamId] = useState(() => 'exam_' + Date.now());

  // Client-Side View Adjustment: Answer Key visibility
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  // Core assessment parameters
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('JEE');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [correctMark, setCorrectMark] = useState(4);
  const [incorrectMark, setIncorrectMark] = useState(-1);
  const [isUnlimitedAttempts, setIsUnlimitedAttempts] = useState(true);
  const [maxAttemptsValue, setMaxAttemptsValue] = useState(3);

  // Scheduling & Practice / Review preferences
  const [allowPracticeMode, setAllowPracticeMode] = useState(true);
  const [allowReviewResponses, setAllowReviewResponses] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Proctor settings
  const [faceCheck, setFaceCheck] = useState(true);
  const [audioCheck, setAudioCheck] = useState(true);
  const [fullScreenLock, setFullScreenLock] = useState(true);
  const [objectCheck, setObjectCheck] = useState(true);
  const [liveNotifications, setLiveNotifications] = useState(false);

  // Added questions array
  const [questions, setQuestions] = useState([]);
  const [contributeAllToBank, setContributeAllToBank] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing question modal state
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  // Image Lightbox preview
  const [lightboxImage, setLightboxImage] = useState(null);

  // Intentional Tab Layout & PDF Preview modal state
  const [activeStudioTab, setActiveStudioTab] = useState('questions'); // 'questions' | 'settings'
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isDropzoneExpanded, setIsDropzoneExpanded] = useState(false);

  // AI Ingestion pipeline state
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStep, setIngestionStep] = useState('');
  const [ingestionError, setIngestionError] = useState('');
  const [ingestionModalOpen, setIngestionModalOpen] = useState(false);
  const [ingestedQuestions, setIngestedQuestions] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const originalExamRef = useRef(null);
  const isInitialLoadFinishedRef = useRef(false);

  // Custom hook for local storage drafts, auto-saving, and navigation guarding
  const {
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
  } = useTestCreationDraft({
    user,
    existingExamId,
    setExistingExamId,
    examStatus,
    setExamStatus,
    isLoadingExisting,
    examIdParam,
    navigate,
    formData: {
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
    },
    formSetters: {
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
    },
    originalExamRef,
    isInitialLoadFinishedRef,
    setError,
    setSuccessMsg
  });

  // If examId is in URL, fetch existing exam for editing (with offline fallback and local draft merge)
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
  }, [examIdParam, findLocalDraftForExam]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Sign In for AI Ingestion',
        subtitle: 'Log in or verify your account to parse exams and documents with AI.',
        onSuccess: () => handleFileUpload(file)
      });
      return;
    }
    setIsIngesting(true);
    setIngestionError('');
    setIngestionStep('Uploading file to AI pipeline...');

    const formData = new FormData();
    formData.append('document', file);

    try {
      setIngestionStep('Gemini AI is parsing questions & LaTeX formulas...');
      const res = await api.post('/ai/ingest', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });

      if (res.data?.success && res.data?.questions?.length > 0) {
        setIngestedQuestions(res.data.questions);
        setUploadedFileName(file.name);
        setIngestionModalOpen(true);
      } else {
        throw new Error(res.data?.message || 'No questions could be extracted from document.');
      }
    } catch (err) {
      console.error('Ingestion error:', err);
      setIngestionError(
        err.response?.data?.message || err.message || 'Failed to ingest document.'
      );
    } finally {
      setIsIngesting(false);
      setIngestionStep('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmIngestedQuestions = (approvedQuestions) => {
    const formatted = approvedQuestions.map((q) => ({
      ...q,
      contributeToBank: q.contributeToBank !== undefined ? q.contributeToBank : contributeAllToBank,
      isInBank: q.isInBank !== undefined ? q.isInBank : contributeAllToBank
    }));
    const updated = [...questions, ...formatted];
    setQuestions(updated);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    setIngestionModalOpen(false);
    setIngestedQuestions([]);
    setSuccessMsg(`Successfully imported ${approvedQuestions.length} questions from AI document extraction!`);
    saveDraftToStorage({ ...draftDataRef.current, questions: updated, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  const handleAddQuestion = (newQuestion) => {
    const formatted = {
      ...newQuestion,
      contributeToBank: newQuestion.contributeToBank !== undefined ? newQuestion.contributeToBank : contributeAllToBank,
      isInBank: newQuestion.isInBank !== undefined ? newQuestion.isInBank : contributeAllToBank
    };
    const updated = [...questions, formatted];
    setQuestions(updated);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    setSuccessMsg(`Question #${updated.length} added.`);
    saveDraftToStorage({ ...draftDataRef.current, questions: updated, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  const handleRemoveQuestion = (index) => {
    const updated = questions.filter((_, idx) => idx !== index);
    setQuestions(updated);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    saveDraftToStorage({ ...draftDataRef.current, questions: updated, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  const handleMoveQuestionUp = (index) => {
    if (index <= 0) return;
    const copy = [...questions];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    setQuestions(copy);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    saveDraftToStorage({ ...draftDataRef.current, questions: copy, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  const handleMoveQuestionDown = (index) => {
    if (index >= questions.length - 1) return;
    const copy = [...questions];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    setQuestions(copy);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    saveDraftToStorage({ ...draftDataRef.current, questions: copy, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  const handleUpdateQuestion = (index, updatedQ) => {
    const copy = [...questions];
    copy[index] = updatedQ;
    setQuestions(copy);
    const allChecked = copy.length > 0 && copy.every((q) => Boolean(q.contributeToBank !== undefined ? q.contributeToBank : q.isInBank));
    setContributeAllToBank(allChecked);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    setSuccessMsg(`Question #${index + 1} updated successfully.`);
    saveDraftToStorage({ ...draftDataRef.current, questions: copy, contributeAllToBank: allChecked, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  const handleToggleContribute = (idx, checked) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], contributeToBank: checked, isInBank: checked };
    setQuestions(updated);
    const allChecked = updated.length > 0 && updated.every((q) => Boolean(q.contributeToBank !== undefined ? q.contributeToBank : q.isInBank));
    setContributeAllToBank(allChecked);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    saveDraftToStorage({
      ...draftDataRef.current,
      contributeAllToBank: allChecked,
      questions: updated,
      hasUnsavedChanges: true,
      isSyncedWithServer: false
    });
  };

  const handleToggleContributeAll = (checked) => {
    setContributeAllToBank(checked);
    const updated = questions.map((q) => ({
      ...q,
      contributeToBank: checked,
      isInBank: checked
    }));
    setQuestions(updated);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    saveDraftToStorage({
      ...draftDataRef.current,
      contributeAllToBank: checked,
      questions: updated,
      hasUnsavedChanges: true,
      isSyncedWithServer: false
    });
    setSuccessMsg(
      checked
        ? `Marked all ${questions.length} questions to be contributed to the Question Bank!`
        : `Removed Question Bank contribution flag from all questions.`
    );
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Pre-publish validation & modal trigger
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

  // Save / Publish execution
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <BackButton
            to="/dashboard"
            label="Return to Dashboard"
            onClick={(e) => handleNavigateAway('/dashboard', e)}
          />
          <Breadcrumbs
            items={[
              { label: 'Assessments', to: '/dashboard' },
              { label: 'Authoring Studio' },
              { label: existingExamId ? 'Edit Assessment' : 'Create New Exam' }
            ]}
          />
        </div>

        {/* Global Feedback Toasts/Banners */}
        {error && (
          <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border-l-4 border-l-rose-600 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="font-medium text-slate-900 dark:text-slate-100">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-semibold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border-l-4 border-l-emerald-600 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-slate-900 dark:text-slate-100">{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg('')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-semibold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Header Action Bar with Inline Title Edit */}
        <TestCreationHeader
          title={title}
          setTitle={setTitle}
          existingExamId={existingExamId}
          examStatus={examStatus}
          autoSaveStatus={autoSaveStatus}
          lastSavedTime={lastSavedTime}
          questionCount={questions.length}
          isSaving={isSaving}
          isSavingDraft={isSavingDraft}
          isDiscardingCloud={isDiscardingCloud}
          hasDraftOrContent={Boolean(title.trim() || questions.length > 0 || existingExamId || draftRestored)}
          onPreviewPaper={() => {
            if (questions.length === 0) {
              setError('Please add at least one question to preview the question paper.');
              return;
            }
            setIsPDFModalOpen(true);
          }}
          onSaveDraft={(e) => handleSaveExam(e, 'draft')}
          onDiscardDraft={handleDiscardDraft}
          onPublish={(e) => handleSaveExam(e, 'published')}
        />

        {/* Intentional Horizontal Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200/80 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveStudioTab('questions')}
            className={`flex items-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
              activeStudioTab === 'questions'
                ? 'border-indigo-600 text-slate-900 dark:border-indigo-500 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Questions & Content</span>
            <span className="text-xs text-slate-400 tabular-nums">
              ({questions.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStudioTab('settings')}
            className={`flex items-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
              activeStudioTab === 'settings'
                ? 'border-indigo-600 text-slate-900 dark:border-indigo-500 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Exam & Proctoring Settings</span>
          </button>
        </div>

        {/* TAB 2: Exam & Proctoring Settings */}
        {activeStudioTab === 'settings' && (
          <TestSettingsTab
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            category={category}
            setCategory={setCategory}
            durationMinutes={durationMinutes}
            setDurationMinutes={setDurationMinutes}
            correctMark={correctMark}
            setCorrectMark={setCorrectMark}
            incorrectMark={incorrectMark}
            setIncorrectMark={setIncorrectMark}
            isUnlimitedAttempts={isUnlimitedAttempts}
            setIsUnlimitedAttempts={setIsUnlimitedAttempts}
            maxAttemptsValue={maxAttemptsValue}
            setMaxAttemptsValue={setMaxAttemptsValue}
            allowPracticeMode={allowPracticeMode}
            setAllowPracticeMode={setAllowPracticeMode}
            allowReviewResponses={allowReviewResponses}
            setAllowReviewResponses={setAllowReviewResponses}
            isScheduled={isScheduled}
            setIsScheduled={setIsScheduled}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            faceCheck={faceCheck}
            setFaceCheck={setFaceCheck}
            audioCheck={audioCheck}
            setAudioCheck={setAudioCheck}
            fullScreenLock={fullScreenLock}
            setFullScreenLock={setFullScreenLock}
            objectCheck={objectCheck}
            setObjectCheck={setObjectCheck}
            liveNotifications={liveNotifications}
            setLiveNotifications={setLiveNotifications}
            contributeAllToBank={contributeAllToBank}
            setContributeAllToBank={setContributeAllToBank}
            onToggleContributeAll={handleToggleContributeAll}
            questions={questions}
          />
        )}

        {/* TAB 1: Questions & Content */}
        {activeStudioTab === 'questions' && (
          <div className="space-y-6">
            <AIDropzoneCard
              isDropzoneExpanded={isDropzoneExpanded}
              setIsDropzoneExpanded={setIsDropzoneExpanded}
              isIngesting={isIngesting}
              ingestionStep={ingestionStep}
              ingestionError={ingestionError}
              dragActive={dragActive}
              setDragActive={setDragActive}
              fileInputRef={fileInputRef}
              onFileUpload={handleFileUpload}
              onFileDrop={handleFileDrop}
              onLoadSampleQuestion={() => {
                handleAddQuestion({
                  questionText: "A particle moves along the x-axis such that its position is given by $x(t) = 3t^2 - 12t + 9$. At what time $t$ does the particle momentarily come to rest?",
                  questionType: "MCQ",
                  subject: "Physics",
                  topic: "Kinematics",
                  difficulty: "Medium",
                  options: [
                    { text: "$t = 1\\text{ s}$", image: "" },
                    { text: "$t = 2\\text{ s}$", image: "" },
                    { text: "$t = 3\\text{ s}$", image: "" },
                    { text: "$t = 4\\text{ s}$", image: "" }
                  ],
                  correctAnswers: [1],
                  marks: correctMark,
                  negativeMarks: incorrectMark,
                  explanation: "The velocity is the derivative of position: $v(t) = \\frac{dx}{dt} = 6t - 12$. Setting $v(t) = 0 \\implies 6t = 12 \\implies t = 2\\text{ s}$."
                });
                setSuccessMsg('Sample competitive exam question loaded into paper!');
                setTimeout(() => setSuccessMsg(''), 3000);
              }}
            />

            <ManualQuestionForm
              onAddQuestion={handleAddQuestion}
              examId={existingExamId || tempExamId}
              examTitle={title}
              defaultContributeToBank={contributeAllToBank}
            />

            <QuestionListSection
              questions={questions}
              correctMark={correctMark}
              incorrectMark={incorrectMark}
              showAnswerKey={showAnswerKey}
              setShowAnswerKey={setShowAnswerKey}
              onMoveUp={handleMoveQuestionUp}
              onMoveDown={handleMoveQuestionDown}
              onEdit={(idx) => setEditingQuestionIndex(idx)}
              onRemove={handleRemoveQuestion}
              onToggleContribute={handleToggleContribute}
              onToggleContributeAll={handleToggleContributeAll}
              onPreviewImage={(url) => setLightboxImage(url)}
            />
          </div>
        )}
      </main>

      {/* Test Creation Modals & Notifications */}
      <TestCreationModals
        editingQuestionIndex={editingQuestionIndex}
        questions={questions}
        tempExamId={tempExamId}
        existingExamId={existingExamId}
        title={title}
        category={category}
        durationMinutes={durationMinutes}
        correctMark={correctMark}
        incorrectMark={incorrectMark}
        isScheduled={isScheduled}
        startTime={startTime}
        endTime={endTime}
        isUnlimitedAttempts={isUnlimitedAttempts}
        maxAttemptsValue={maxAttemptsValue}
        allowPracticeMode={allowPracticeMode}
        allowReviewResponses={allowReviewResponses}
        faceCheck={faceCheck}
        audioCheck={audioCheck}
        fullScreenLock={fullScreenLock}
        objectCheck={objectCheck}
        liveNotifications={liveNotifications}
        examStatus={examStatus}
        contributeAllToBank={contributeAllToBank}
        onToggleContributeAll={handleToggleContributeAll}
        onSaveEditedQuestion={handleUpdateQuestion}
        onCloseEditModal={() => setEditingQuestionIndex(null)}
        lightboxImage={lightboxImage}
        onCloseLightbox={() => setLightboxImage(null)}
        ingestionModalOpen={ingestionModalOpen}
        uploadedFileName={uploadedFileName}
        ingestedQuestions={ingestedQuestions}
        onConfirmIngestedQuestions={handleConfirmIngestedQuestions}
        onCloseIngestionModal={() => {
          setIngestionModalOpen(false);
          setIngestedQuestions([]);
        }}
        showConfirmModal={showConfirmModal}
        onCloseConfirmModal={() => setShowConfirmModal(false)}
        onConfirmPublish={() => {
          setShowConfirmModal(false);
          executeSaveExam('published');
        }}
        isSaving={isSaving}
        showLeaveModal={showLeaveModal}
        onCloseLeaveModal={() => {
          setShowLeaveModal(false);
          setPendingNavigation(null);
          setLeaveModalError('');
        }}
        onSaveAndLeave={handleSaveAndLeave}
        onLeaveWithoutSaving={() => {
          setShowLeaveModal(false);
          const target = pendingNavigation || '/dashboard';
          setPendingNavigation(null);
          setHasUnsavedChanges(false);
          setLeaveModalError('');
          navigate(target);
        }}
        isSavingDraft={isSavingDraft}
        leaveModalError={leaveModalError}
        isPDFModalOpen={isPDFModalOpen}
        onClosePDFModal={() => setIsPDFModalOpen(false)}
        discardModalOpen={discardModalOpen}
        onCloseDiscardModal={() => setDiscardModalOpen(false)}
        onConfirmDiscardDraft={handleConfirmDiscardDraft}
        isDiscardingCloud={isDiscardingCloud}
        draftRestored={draftRestored}
        draftRestoredTime={draftRestoredTime}
        toastConfirmDiscard={toastConfirmDiscard}
        setToastConfirmDiscard={setToastConfirmDiscard}
        onDiscardLocalDraft={handleDiscardLocalDraft}
        onDismissDraftRestored={() => setDraftRestored(false)}
        setDraftToastHovered={setDraftToastHovered}
      />
    </div>
  );
}