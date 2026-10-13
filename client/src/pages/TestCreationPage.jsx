import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ManualQuestionForm from '../components/test-builder/ManualQuestionForm';
import IngestionReviewModal from '../components/test-builder/IngestionReviewModal';
import QuestionEditModal from '../components/test-builder/QuestionEditModal';
import QuestionPaperPDFModal from '../components/test-builder/QuestionPaperPDFModal';
import DiscardDraftModal from '../components/common/DiscardDraftModal';
import MathRenderer from '../components/common/MathRenderer';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { formatDateTime12h } from '../utils/dateUtils';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Layers,
  Trash2,
  Loader2,
  ShieldCheck,
  Plus,
  Database,
  Sparkles,
  Sliders,
  HelpCircle,
  UploadCloud,
  FileUp,
  FileText,
  ArrowUp,
  ArrowDown,
  Edit3,
  Bookmark,
  RotateCcw,
  Image as ImageIcon,
  Check,
  X,
  ExternalLink,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  BookOpen,
  Lock,
  CheckCheck,
  GripVertical,
  Settings,
  ChevronDown,
  ChevronUp,
  Cloud
} from 'lucide-react';

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

  // Local Storage Draft & Navigation Intercept states
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

  const originalExamRef = useRef(null);
  const isInitialMountRef = useRef(true);
  const isDiscardingOrLoggingOutRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const isInitialLoadFinishedRef = useRef(false);

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
    examStatus,
    activeStudioTab
  };

  // Draft key scoped strictly to active user ID
  const getDraftStorageKey = useCallback((examId) => {
    const uId = user?._id || 'guest';
    return examId ? `pmt_draft_exam_${uId}_${examId}` : `pmt_draft_exam_${uId}_new`;
  }, [user?._id]);

  // Find local draft for an existing exam (checks scoped key, legacy key, and any wildcard match for the examId)
  const findLocalDraftForExam = useCallback((examId) => {
    if (!examId) return null;
    const uId = user?._id || 'guest';

    // 1. Try exact user scoped key
    if (uId && uId !== 'guest') {
      const scopedKey = `pmt_draft_exam_${uId}_${examId}`;
      const raw = localStorage.getItem(scopedKey);
      if (raw) return { key: scopedKey, raw };
    }

    // 2. Try unscoped key
    const legacyKey = `pmt_draft_exam_${examId}`;
    const rawLegacy = localStorage.getItem(legacyKey);
    if (rawLegacy) return { key: legacyKey, raw: rawLegacy };

    // 3. Robust scan: any key ending with `_${examId}`
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

    // Check if there is any real content
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

  // Auto-dismiss draft restored toast (pauses while hovering, confirming discard, or when discard modal is open)
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

    if (isInitialLoadFinishedRef.current) {
      isInitialLoadFinishedRef.current = false;
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
    activeStudioTab,
    isLoadingExisting,
    saveDraftToStorage
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

  // 3. Intercept in-app navigation (Navbar links, breadcrumbs, etc.) when user has unsaved changes
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
    if (examIdParam) return; // Handled by existing exam fetch below

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
  }, [examIdParam, user?._id]);

  // Discard local restored draft changes only (without deleting cloud assessment)
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

    if (existingExamId && originalExamRef.current) {
      // Revert to original server assessment data
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
      // Clean blank test
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

  // Discard draft: Open safety confirmation modal
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

          // Check if local storage has a newer unsaved draft
          let restoredFromLocal = false;
          try {
            const draftMatch = findLocalDraftForExam(ex._id);
            if (draftMatch?.raw) {
              const draft = JSON.parse(draftMatch.raw);
              const draftTime = draft.savedAt ? new Date(draft.savedAt).getTime() : 0;
              const serverTime = ex.updatedAt ? new Date(ex.updatedAt).getTime() : 0;

              // Draft should be restored if it has unsaved changes, different question count, or newer timestamp
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
            setHasUnsavedChanges(false);
            hasUnsavedChangesRef.current = false;
            isInitialLoadFinishedRef.current = true;
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch existing exam (offline or network error):', err);
        // Offline Fallback: Check local storage for offline draft
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
  }, [examIdParam]);

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
    const updated = [...questions, ...approvedQuestions];
    setQuestions(updated);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    setIngestionModalOpen(false);
    setIngestedQuestions([]);
    setSuccessMsg(`Successfully imported ${approvedQuestions.length} questions from AI document extraction!`);
    saveDraftToStorage({ ...draftDataRef.current, questions: updated, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  const handleAddQuestion = (newQuestion) => {
    const updated = [...questions, newQuestion];
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

  // Re-ordering questions
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

  // Updating an edited question
  const handleUpdateQuestion = (index, updatedQ) => {
    const copy = [...questions];
    copy[index] = updatedQ;
    setQuestions(copy);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    setSuccessMsg(`Question #${index + 1} updated successfully.`);
    saveDraftToStorage({ ...draftDataRef.current, questions: copy, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  // Pop out clean printable preview of question paper in new window
  // Pop out clean printable preview of question paper in new window with Dark Mode support
  const handlePopoutPreview = () => {
    if (questions.length === 0) {
      setError('Please add at least one question to preview the question paper.');
      return;
    }

    const previewWin = window.open('', '_blank', 'width=1000,height=850,scrollbars=yes,resizable=yes');
    if (!previewWin) {
      alert('Pop-up window blocked! Please allow popups for this site to view the printable question paper.');
      return;
    }

    const cleanTitle = title || 'Question Paper Preview';
    const cleanCategory = category || 'Exam';

    let questionsHtml = '';
    questions.forEach((q, idx) => {
      let optionsHtml = '';
      if (Array.isArray(q.options)) {
        q.options.forEach((opt, oIdx) => {
          const letter = String.fromCharCode(65 + oIdx);
          const optText = typeof opt === 'object' ? (opt.text || '') : opt;
          const optImg = typeof opt === 'object' ? (opt.image || '') : '';
          optionsHtml += `
            <div class="option-row" style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
              <strong style="min-width:24px;color:#2563eb;">(${letter})</strong>
              <div>
                <span>${optText}</span>
                ${optImg ? `<br/><img src="${optImg}" style="max-height:120px;margin-top:6px;border-radius:4px;"/>` : ''}
              </div>
            </div>
          `;
        });
      }

      questionsHtml += `
        <div class="question-card" style="margin-bottom:24px;padding:18px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;page-break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;color:#64748b;">
            <strong style="font-size:13px;color:#0f172a;" class="q-title">Question ${idx + 1} (${q.questionType || 'MCQ'})</strong>
            <span style="font-family:monospace;font-weight:600;">+${correctMark} / ${incorrectMark} Marks</span>
          </div>
          <div class="q-text" style="font-size:14px;color:#0f172a;line-height:1.6;margin-bottom:12px;font-weight:500;">
            ${q.questionText}
          </div>
          ${q.imageAttachment ? `<div style="margin-bottom:12px;"><img src="${q.imageAttachment}" style="max-height:220px;border-radius:8px;border:1px solid #e2e8f0;"/></div>` : ''}
          <div style="margin-top:10px;">${optionsHtml}</div>
        </div>
      `;
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${cleanTitle} - Question Paper Preview</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; transition: background 0.2s, color 0.2s; }
          .paper-container { max-width: 860px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
          .toolbar { display: flex; gap: 8px; align-items: center; }
          .print-btn { background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; }
          .print-btn:hover { background: #1d4ed8; }
          .theme-btn { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; }
          .theme-btn:hover { background: #e2e8f0; }
          
          /* Dark mode support */
          body.dark-mode { background: #0C0F17; color: #f8fafc; }
          body.dark-mode .paper-container { background: #111827; border-color: #1e293b; box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
          body.dark-mode .header { border-bottom-color: #1e293b; }
          body.dark-mode .header h1 { color: #f8fafc !important; }
          body.dark-mode .header p { color: #94a3b8 !important; }
          body.dark-mode .theme-btn { background: #1f2937; color: #f8fafc; border-color: #374151; }
          body.dark-mode .theme-btn:hover { background: #374151; }
          body.dark-mode .question-card { background: #141d2e !important; border-color: #1e293b !important; }
          body.dark-mode .q-title, body.dark-mode .q-text { color: #f8fafc !important; }
          body.dark-mode .option-row { background: #111827 !important; border-color: #1e293b !important; color: #f8fafc !important; }
          body.dark-mode .guidelines { background: #141d2e !important; border-color: #2563eb !important; color: #cbd5e1 !important; }

          @media print { 
            body, body.dark-mode { background: #fff !important; color: #000 !important; padding: 0; } 
            .paper-container { box-shadow: none !important; padding: 0 !important; max-width: 100% !important; border: none !important; background: #fff !important; } 
            .toolbar { display: none !important; } 
            .question-card { background: #fff !important; border-color: #e2e8f0 !important; }
            .option-row { background: #f8fafc !important; border-color: #e2e8f0 !important; color: #000 !important; }
            .q-title, .q-text { color: #000 !important; }
          }
        </style>
      </head>
      <body>
        <div class="paper-container">
          <div class="header">
            <div>
              <h1 style="margin:0 0 6px 0;font-size:22px;color:#0f172a;">${cleanTitle}</h1>
              <p style="margin:0;font-size:13px;color:#64748b;">${cleanCategory} • ${durationMinutes} Minutes • Total Marks: ${questions.length * correctMark} • ${questions.length} Questions</p>
            </div>
            <div class="toolbar">
              <button class="theme-btn" id="themeBtn" onclick="togglePaperTheme()">🌓 Dark Mode</button>
              <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
            </div>
          </div>
          ${description ? `<div class="guidelines" style="background:#f8fafc;padding:12px 16px;border-radius:8px;border-left:4px solid #2563eb;font-size:13px;color:#475569;margin-bottom:24px;">${description}</div>` : ''}
          <div>${questionsHtml}</div>
        </div>
        <script>
          function togglePaperTheme() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            document.getElementById('themeBtn').innerText = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
          }

          document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.body, {
              delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
              ],
              throwOnError: false
            });
          });
        </script>
      </body>
      </html>
    `;

    previewWin.document.open();
    previewWin.document.write(fullHtml);
    previewWin.document.close();
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

  const getOptionLabel = (idx) => String.fromCharCode(65 + idx);

  const formatOption = (opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { text: opt.text || '', image: opt.image || '' };
    }
    return { text: String(opt || ''), image: '' };
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


        {/* Top Header Action Bar with Inline Title Edit */}
        <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-none">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Examination Title
              </span>
              {existingExamId && (
                <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${examStatus === 'draft' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                  />
                  <span>{examStatus === 'draft' ? 'Draft' : 'Published'}</span>
                </span>
              )}

              {/* Local Storage Auto-save Status Indicator */}
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 transition-all">
                {autoSaveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                    <span className="text-slate-600 dark:text-slate-400">Saving draft locally...</span>
                  </>
                ) : autoSaveStatus === 'saved' ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Draft saved in local storage {lastSavedTime ? `(${new Date(lastSavedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Local storage sync enabled</span>
                  </>
                )}
              </div>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. JEE Advanced Full Mock 01 (Click to edit title)"
              className="w-full text-base sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 focus:bg-slate-50 dark:focus:bg-slate-950 rounded-md px-2.5 py-1 -ml-2.5 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0">
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#162030] px-3 py-1.5 rounded-md border border-slate-200/80 dark:border-slate-800/80">
              Questions: <strong className="text-slate-900 dark:text-slate-100 tabular-nums font-semibold">{questions.length}</strong>
            </div>

            {/* Preview Question Paper Modal Button */}
            <button
              type="button"
              onClick={() => {
                if (questions.length === 0) {
                  setError('Please add at least one question to preview the question paper.');
                  return;
                }
                setIsPDFModalOpen(true);
              }}
              disabled={questions.length === 0}
              title={questions.length === 0 ? "Add questions to preview paper" : "Preview question paper in dark/light mode and PDF export"}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Paper</span>
            </button>

            {/* Save as Draft Button */}
            <button
              type="button"
              onClick={(e) => handleSaveExam(e, 'draft')}
              disabled={isSavingDraft || isSaving}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Draft...</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save Draft</span>
                </>
              )}
            </button>

            {/* Discard Draft Button */}
            {Boolean(title.trim() || questions.length > 0 || existingExamId || draftRestored) && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                disabled={isSavingDraft || isSaving || isDiscardingCloud}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/50 cursor-pointer"
                title="Discard draft and remove uncommitted changes"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Discard Draft</span>
              </button>
            )}

            {/* Publish Button */}
            <button
              type="button"
              onClick={(e) => handleSaveExam(e, 'published')}
              disabled={isSaving || isSavingDraft || questions.length === 0}
              className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{examStatus === 'published' ? 'Save Changes' : 'Publish Examination'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Intentional Horizontal Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200/80 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveStudioTab('questions')}
            className={`flex items-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${activeStudioTab === 'questions'
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
            className={`flex items-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${activeStudioTab === 'settings'
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* COLUMN 1: Assessment Details, Marking & Scheduling */}
            <div className="space-y-6">
              {/* Card 1: Core Parameters */}
              <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <span>Assessment Core Details</span>
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Examination Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. JEE Advanced Full Mock 01"
                    className="input-base text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Description & Guidelines
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Exam instructions or syllabus summary..."
                    className="input-base text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Curriculum Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-base text-xs cursor-pointer"
                    >
                      <option value="JEE">JEE</option>
                      <option value="NEET">NEET</option>
                      <option value="GATE">GATE</option>
                      <option value="APTITUDE">APTITUDE</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={360}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="input-base text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Scoring & Marking Scheme */}
              <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-slate-500" />
                    <span>Scoring & Negative Marking</span>
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
                    +{correctMark} / {incorrectMark} pts
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">Correct Mark (+)</span>
                    <input
                      type="number"
                      value={correctMark}
                      onChange={(e) => setCorrectMark(e.target.value)}
                      className="input-base text-xs font-mono py-1.5"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">Negative Mark (-)</span>
                    <input
                      type="number"
                      value={incorrectMark}
                      onChange={(e) => setIncorrectMark(e.target.value)}
                      className="input-base text-xs font-mono py-1.5"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Applied by default to newly added questions. Individual questions can override custom marks.
                </p>
              </div>

              {/* Card 3: Candidate Attempt Limits */}
              <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                    <span>Candidate Attempt Limits</span>
                  </span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {isUnlimitedAttempts ? 'Unlimited (∞)' : `${maxAttemptsValue} ${maxAttemptsValue === 1 ? 'Attempt' : 'Attempts'}`}
                  </span>
                </div>

                {/* 3 Preset Mode Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlimitedAttempts(false);
                      setMaxAttemptsValue(1);
                    }}
                    className={`p-2.5 rounded-md border text-center transition-all cursor-pointer ${!isUnlimitedAttempts && Number(maxAttemptsValue) === 1
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 border-indigo-600 dark:border-indigo-400 font-medium'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030]/50'
                      }`}
                  >
                    <span className="block text-xs font-medium">1 Attempt</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">Strict Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlimitedAttempts(false);
                      if (Number(maxAttemptsValue) === 1) setMaxAttemptsValue(3);
                    }}
                    className={`p-2.5 rounded-md border text-center transition-all cursor-pointer ${!isUnlimitedAttempts && Number(maxAttemptsValue) > 1
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 border-indigo-600 dark:border-indigo-400 font-medium'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030]/50'
                      }`}
                  >
                    <span className="block text-xs font-medium">Multiple</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">Custom limit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsUnlimitedAttempts(true)}
                    className={`p-2.5 rounded-md border text-center transition-all cursor-pointer ${isUnlimitedAttempts
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 border-indigo-600 dark:border-indigo-400 font-medium'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030]/50'
                      }`}
                  >
                    <span className="block text-xs font-medium">Unlimited</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">Practice (∞)</span>
                  </button>
                </div>

                {/* Number Stepper when Multiple is selected */}
                {!isUnlimitedAttempts && Number(maxAttemptsValue) > 1 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Allowed Attempts:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMaxAttemptsValue(Math.max(2, Number(maxAttemptsValue) - 1))}
                          className="w-7 h-7 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162030] flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={2}
                          max={50}
                          value={maxAttemptsValue}
                          onChange={(e) => setMaxAttemptsValue(Math.max(2, parseInt(e.target.value) || 2))}
                          className="w-14 text-center py-1 input-base text-xs font-semibold font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setMaxAttemptsValue(Math.min(50, Number(maxAttemptsValue) + 1))}
                          className="w-7 h-7 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162030] flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400 uppercase font-medium mr-1">Presets:</span>
                      {[2, 3, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setMaxAttemptsValue(preset)}
                          className={`px-2.5 py-0.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${Number(maxAttemptsValue) === preset
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 border-indigo-600 dark:border-indigo-400'
                            : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#162030]'
                            }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 4: Assessment Scheduling Window */}
              <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Scheduled Test Window</span>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-800/80 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  {isScheduled
                    ? 'Restricts candidate access strictly between opening and closing timestamp.'
                    : 'Unscheduled — candidates can begin this evaluation at any convenient time.'}
                </p>

                {isScheduled && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Window Start Date & Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="input-base text-xs font-mono py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Window End Date & Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="input-base text-xs font-mono py-1.5"
                      />
                    </div>

                    {startTime && endTime && new Date(endTime) <= new Date(startTime) && (
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>End time must be later than start time!</span>
                      </p>
                    )}

                    {startTime && endTime && new Date(endTime) > new Date(startTime) && (
                      <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Window Span:</span>
                        <strong className="font-mono tabular-nums">
                          {Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60))} hours ({Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60))} mins)
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: Proctoring Security, Access Rules & Overview */}
            <div className="space-y-6">
              {/* Card 1: Proctoring Security Rules */}
              <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      <span>Proctoring Security Rules</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure automated browser lockdown and AI vision monitoring safeguards.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  {/* Facial Verification */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faceCheck}
                      onChange={(e) => setFaceCheck(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 dark:text-slate-100">Facial Presence Verification</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${faceCheck ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {faceCheck ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block mt-0.5">
                        MediaPipe vision tracking for candidate absence, head turns, and multiple face intrusions.
                      </span>
                    </div>
                  </label>

                  {/* Acoustic Audio */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={audioCheck}
                      onChange={(e) => setAudioCheck(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 dark:text-slate-100">Acoustic & Noise Level Detection</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${audioCheck ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {audioCheck ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block mt-0.5">
                        Detects vocal murmur, background discussions, and ambient audio spikes in decibels.
                      </span>
                    </div>
                  </label>

                  {/* Fullscreen Lock */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fullScreenLock}
                      onChange={(e) => setFullScreenLock(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 dark:text-slate-100">Strict Fullscreen & Focus Lockdown</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${fullScreenLock ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {fullScreenLock ? 'Enforced' : 'Off'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block mt-0.5">
                        Immediately penalizes tab switching, window blurring, browser navigation, or devtool inspection.
                      </span>
                    </div>
                  </label>

                  {/* Device / Object Check */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={objectCheck}
                      onChange={(e) => setObjectCheck(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 dark:text-slate-100">Prohibited Device Detection</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${objectCheck ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {objectCheck ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block mt-0.5">
                        COCO-SSD model scans video feed for mobile smartphones, notes, books, and external hardware.
                      </span>
                    </div>
                  </label>

                  {/* WebSocket Live Alerts */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveNotifications}
                      onChange={(e) => setLiveNotifications(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 dark:text-slate-100">Live Examiner Real-Time Alerts</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${liveNotifications ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {liveNotifications ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block mt-0.5">
                        Instantly triggers live toasts with snapshot evidence directly on your examiner screen when candidates violate rules.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card 2: Candidate Access & Review Rules */}
              <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span>Candidate Access & Solutions Policy</span>
                  </h2>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  {/* Practice Mode Toggle */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPracticeMode}
                      onChange={(e) => setAllowPracticeMode(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-900 dark:text-slate-100 block">Allow Practice Mode (Unproctored)</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5 block">
                        Candidates can practice questions without webcam or audio lockdown. {isScheduled ? 'For scheduled exams, practice mode unlocks strictly after the scheduled window ends.' : 'Practice attempts remain private.'}
                      </span>
                    </div>
                  </label>

                  {/* View Responses / Answer Key Toggle */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowReviewResponses}
                      onChange={(e) => setAllowReviewResponses(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-900 dark:text-slate-100 block">Allow View Responses & Solutions</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5 block">
                        Candidates can view their submission responses and comprehensive solutions after completing their test. {isScheduled ? 'For scheduled exams, solutions are released strictly after the scheduled window closes to prevent leaks.' : ''}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card 3: Security & Proctoring Status Overview */}
              <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Security & Integrity Overview</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time candidate monitoring profile</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${faceCheck && audioCheck && fullScreenLock && objectCheck
                      ? 'bg-emerald-500'
                      : (faceCheck || audioCheck || fullScreenLock)
                        ? 'bg-indigo-500'
                        : 'bg-amber-500'
                      }`} />
                    <span>
                      {faceCheck && audioCheck && fullScreenLock && objectCheck
                        ? 'Maximum Lockdown'
                        : (faceCheck || audioCheck || fullScreenLock)
                          ? 'Standard Monitoring'
                          : 'Minimal Security'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-500">Facial Vision:</span>
                    <span className={`font-medium ${faceCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {faceCheck ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-500">Audio Proctor:</span>
                    <span className={`font-medium ${audioCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {audioCheck ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-500">Fullscreen Lock:</span>
                    <span className={`font-medium ${fullScreenLock ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {fullScreenLock ? 'Enforced' : 'Optional'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-500">Device Scan:</span>
                    <span className={`font-medium ${objectCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {objectCheck ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-slate-50/70 dark:bg-[#162030] border border-slate-200/60 dark:border-slate-800/80 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Schedule Window:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {isScheduled ? 'Restricted Date/Time' : 'Flexible (Anytime)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Candidate Attempts:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 font-mono">
                      {isUnlimitedAttempts ? 'Unlimited Retakes' : `${maxAttemptsValue} Attempts maximum`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Live Examiner Alerts:</span>
                    <span className={`font-medium ${liveNotifications ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                      {liveNotifications ? 'Real-Time Toasts On' : 'Silent Logging'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Questions & Content */}
        {activeStudioTab === 'questions' && (
          <div className="space-y-6">
            {/* AI Document & Scanned Paper Ingestion Card - Compact & Expandable */}
            <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                    <Sparkles className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Automated AI Question Paper Ingestion</span>
                      <span className="text-[11px] font-mono text-slate-400 font-normal">
                        Gemini
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Parses questions, equations, and figures from PDF, Word (.docx), or photos.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleAddQuestion({
                        questionText: "A particle moves along the x-axis such that its position is given by $$x(t) = 3t^2 - 12t + 9$$. At what time $t$ does the particle momentarily come to rest?",
                        questionType: "MCQ",
                        subject: "Physics",
                        topic: "Kinematics",
                        difficulty: "Medium",
                        options: [
                          { text: "$$t = 1\\text{ s}$$", image: "" },
                          { text: "$$t = 2\\text{ s}$$", image: "" },
                          { text: "$$t = 3\\text{ s}$$", image: "" },
                          { text: "$$t = 4\\text{ s}$$", image: "" }
                        ],
                        correctAnswers: [1],
                        marks: correctMark,
                        negativeMarks: incorrectMark,
                        explanation: "The velocity is the derivative of position: $$v(t) = \\frac{dx}{dt} = 6t - 12$$. Setting $$v(t) = 0 \\implies 6t = 12 \\implies t = 2\\text{ s}$$."
                      });
                      setSuccessMsg('Sample competitive exam question loaded into paper!');
                      setTimeout(() => setSuccessMsg(''), 3000);
                    }}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                    title="Insert a sample JEE/NEET KaTeX question"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span>Load Sample Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDropzoneExpanded(!isDropzoneExpanded)}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isDropzoneExpanded ? 'Collapse' : 'Upload File'}</span>
                    {isDropzoneExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Drag and Drop Zone (Expandable) */}
              {(isDropzoneExpanded || isIngesting || dragActive) && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                  }}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragActive
                    ? 'border-indigo-600 dark:border-indigo-400 bg-slate-100 dark:bg-slate-800/80'
                    : isIngesting
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#131926] cursor-wait'
                      : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50/50 dark:bg-[#0C0F17]/40'
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,image/png,image/jpeg,image/webp,image/jpg,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {isIngesting ? (
                    <div className="py-3 space-y-3">
                      <Loader2 className="w-6 h-6 text-slate-600 dark:text-slate-300 animate-spin mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                          {ingestionStep || 'Processing document with Gemini AI...'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Extracting questions, options, and formatting LaTeX formulas...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 space-y-2">
                      <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 mx-auto">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          <span className="text-slate-900 dark:text-slate-100 underline underline-offset-2">Click to browse</span> or drag and drop document here
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          Supports PDF (.pdf), Word (.docx) & Images (.png, .jpg, .webp) up to 15 MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {ingestionError && (
                <div className="p-3 rounded-md bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Document Ingestion Failed</p>
                    <p className="text-xs mt-0.5">{ingestionError}</p>
                  </div>
                </div>
              )}
            </div>

            <ManualQuestionForm
              onAddQuestion={handleAddQuestion}
              examId={existingExamId || tempExamId}
              examTitle={title}
            />

            {/* Questions Draft Card */}
            <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Question Items ({questions.length})
                  </h3>
                  <span className="text-xs text-slate-400">
                    • Re-order or edit questions
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Client-Side View Adjustment: Answer Key Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAnswerKey((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${showAnswerKey
                      ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 font-medium'
                      : 'bg-white dark:bg-[#131926] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    title={showAnswerKey ? 'Hide answer key styling to preview test as candidate' : 'Show verified answer keys'}
                  >
                    {showAnswerKey ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{showAnswerKey ? 'Candidate Preview' : 'Show Answer Key'}</span>
                  </button>

                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tabular-nums">
                    Projected Marks: <strong className="text-slate-900 dark:text-slate-100">{questions.length * correctMark} pts</strong>
                  </span>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-2">
                    <Plus className="w-4 h-4" />
                  </div>
                  <p className="font-medium text-slate-600 dark:text-slate-400">No questions composed yet.</p>
                  <p className="text-xs text-slate-400 mt-0.5">Use the Question Authoring form or AI Ingestion above to add items to this examination.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const isNat = q.questionType === 'NAT';
                    const opts = Array.isArray(q.options) ? q.options.map(formatOption) : [];
                    const correctIndices = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];

                    return (
                      <div
                        key={q._id || idx}
                        className="p-4 sm:p-5 rounded-lg bg-slate-50/40 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        {/* Question Item Header with Re-ordering & Edit Actions */}
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/80 pb-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 font-semibold text-xs flex items-center justify-center tabular-nums">
                              {idx + 1}
                            </span>
                            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                              {q.questionType || 'MCQ'}
                            </span>
                            <span className="text-slate-500 text-xs">
                              · {q.subject || 'General'} {q.topic && `· ${q.topic}`}
                            </span>
                            {q.isEdited && (
                              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                (Edited)
                              </span>
                            )}
                          </div>

                          {/* Action Buttons: Contribute to Bank, Re-order, Edit, Delete */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Contribute to Bank Toggle (Phase 8.4) */}
                            <label className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors">
                              <input
                                type="checkbox"
                                checked={Boolean(q.contributeToBank || q.isInBank)}
                                onChange={(e) => {
                                  const updated = [...questions];
                                  updated[idx] = { ...updated[idx], contributeToBank: e.target.checked };
                                  setQuestions(updated);
                                }}
                                className="w-3.5 h-3.5 rounded text-slate-900 border-slate-300 focus:ring-0 cursor-pointer"
                              />
                              <span className="flex items-center gap-1">
                                <Database className="w-3 h-3 text-amber-500" />
                                <span>Contribute to Bank</span>
                              </span>
                            </label>

                            {/* Move Up */}
                            <button
                              type="button"
                              onClick={() => handleMoveQuestionUp(idx)}
                              disabled={idx === 0}
                              className="p-1.5 rounded-md bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Move question up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              onClick={() => handleMoveQuestionDown(idx)}
                              disabled={idx === questions.length - 1}
                              className="p-1.5 rounded-md bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Move question down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Question */}
                            <button
                              type="button"
                              onClick={() => setEditingQuestionIndex(idx)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                              title="Edit question and options"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Question */}
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                              title="Remove question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Question Statement Preview */}
                        {q.questionText && (
                          <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
                            <MathRenderer text={q.questionText} />
                          </div>
                        )}

                        {/* Question Image Attachment Preview */}
                        {q.imageAttachment && (
                          <div className="pt-1">
                            <div
                              onClick={() => setLightboxImage(q.imageAttachment)}
                              className="inline-block p-1.5 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-400 transition-all group"
                              title="Click to view high-resolution image"
                            >
                              <img
                                src={q.imageAttachment}
                                alt={`Question ${idx + 1} Diagram`}
                                className="max-h-40 max-w-xs sm:max-w-md rounded object-contain"
                              />
                              <span className="text-[11px] text-slate-600 dark:text-slate-400 group-hover:underline flex items-center gap-1 mt-1 font-medium">
                                <ExternalLink className="w-3 h-3" /> View full image
                              </span>
                            </div>
                          </div>
                        )}

                        {/* MCQ / MSQ Options Preview Grid */}
                        {!isNat && opts.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {opts.map((opt, optIdx) => {
                              const isCorrect = showAnswerKey && correctIndices.includes(optIdx);

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-md border flex items-start gap-2.5 transition-colors text-xs ${isCorrect
                                    ? 'bg-emerald-50/50 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                                    : 'bg-white dark:bg-[#162030] border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded flex items-center justify-center font-medium text-xs shrink-0 ${isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                                      }`}
                                  >
                                    {isCorrect ? '✓' : getOptionLabel(optIdx)}
                                  </div>

                                  <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                                    {opt.text && (
                                      <div className="leading-relaxed">
                                        <MathRenderer text={opt.text} />
                                      </div>
                                    )}

                                    {opt.image && (
                                      <div
                                        onClick={() => setLightboxImage(opt.image)}
                                        className="cursor-pointer inline-block"
                                        title="Click to zoom option picture"
                                      >
                                        <img
                                          src={opt.image}
                                          alt={`Option ${getOptionLabel(optIdx)} diagram`}
                                          className="max-h-24 max-w-full rounded border border-slate-200 dark:border-slate-700 object-contain bg-white hover:opacity-90 transition-opacity"
                                        />
                                      </div>
                                    )}

                                    {isCorrect && showAnswerKey && (
                                      <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block pt-0.5">
                                        Correct Key
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* NAT Numerical Range Display */}
                        {isNat && (
                          showAnswerKey ? (
                            <div className="p-2.5 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">Accepted Answer Range:</span>
                              <span className="font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40">
                                {correctIndices[0] !== undefined
                                  ? correctIndices[0] === correctIndices[1] || correctIndices[1] === undefined
                                    ? `${correctIndices[0]}`
                                    : `[${correctIndices[0]}, ${correctIndices[1]}]`
                                  : 'Not specified'}
                              </span>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-400 italic">
                              Numerical Answer (Candidate preview — answer key hidden)
                            </div>
                          )
                        )}

                        {/* Pedagogical Explanation Preview */}
                        {showAnswerKey && q.explanation && (
                          <div className="p-2.5 rounded-md bg-slate-100/70 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                              <span>Pedagogical Explanation:</span>
                            </span>
                            <div className="text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                              <MathRenderer text={q.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Edit Question Modal */}
      {editingQuestionIndex !== null && questions[editingQuestionIndex] && (
        <QuestionEditModal
          isOpen={editingQuestionIndex !== null}
          question={questions[editingQuestionIndex]}
          questionIndex={editingQuestionIndex}
          examId={existingExamId || tempExamId}
          examTitle={title}
          isPublishedExam={examStatus === 'published'}
          onSave={handleUpdateQuestion}
          onClose={() => setEditingQuestionIndex(null)}
        />
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-3xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 space-y-3 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">High Resolution Image Preview</h3>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0C0F17] rounded-md overflow-hidden p-2 border border-slate-200/80 dark:border-slate-800/80">
              <img src={lightboxImage} alt="Diagram preview" className="max-h-[65vh] w-auto object-contain" />
            </div>
            <div className="flex justify-end">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Open original in new tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Ingestion Review Studio Modal */}
      {ingestionModalOpen && (
        <IngestionReviewModal
          isOpen={ingestionModalOpen}
          fileName={uploadedFileName}
          initialQuestions={ingestedQuestions}
          onConfirm={handleConfirmIngestedQuestions}
          onClose={() => {
            setIngestionModalOpen(false);
            setIngestedQuestions([]);
          }}
        />
      )}

      {/* Confirm Examination Settings Before Publishing Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="max-w-2xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-6 space-y-5 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Confirm Examination Parameters</h3>
                  <p className="text-xs text-slate-500">
                    Review your test rules, scheduling window, and proctoring parameters before publishing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Test Meta Card */}
              <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Assessment Details</span>
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{title}</div>
                <div className="text-slate-500">
                  {category} · {durationMinutes} mins · {questions.length} Questions
                </div>
                <div className="text-slate-700 dark:text-slate-300 font-medium">
                  Total Marks: {questions.length * correctMark} (+{correctMark} / {incorrectMark})
                </div>
              </div>

              {/* Schedule Card */}
              <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Schedule Window</span>
                {isScheduled ? (
                  <>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>Scheduled Window</span>
                    </span>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                      <strong>Opens:</strong> {formatDateTime12h(startTime)}
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                      <strong>Closes:</strong> {formatDateTime12h(endTime)}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Open / Flexible Window</span>
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      Candidates can start this assessment at any time.
                    </p>
                  </>
                )}
              </div>

              {/* Candidate Access & Solutions Card */}
              <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Candidate Access Rules</span>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>Attempt Limit:</span>
                  <strong>{isUnlimitedAttempts ? 'Unlimited (∞)' : `${maxAttemptsValue} Attempts`}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>Practice Mode:</span>
                  <strong className={allowPracticeMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                    {allowPracticeMode ? (isScheduled ? 'After schedule ends' : 'Allowed anytime') : 'Disabled'}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>View Responses:</span>
                  <strong className={allowReviewResponses ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                    {allowReviewResponses ? (isScheduled ? 'Released after schedule' : 'Available immediately') : 'Hidden / Disabled'}
                  </strong>
                </div>
              </div>

              {/* Proctoring Rules Card */}
              <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Proctoring Enforcement</span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className={faceCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                    {faceCheck ? '●' : '○'} Face Detection
                  </span>
                  <span className={audioCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                    {audioCheck ? '●' : '○'} Audio Monitor
                  </span>
                  <span className={fullScreenLock ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                    {fullScreenLock ? '●' : '○'} Fullscreen Lock
                  </span>
                  <span className={objectCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                    {objectCheck ? '●' : '○'} Device Detection
                  </span>
                </div>
                <div className="text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700 text-slate-500">
                  Live alerts: <strong>{liveNotifications ? 'Enabled' : 'Disabled'}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Back to Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  executeSaveExam('published');
                }}
                disabled={isSaving}
                className="btn-primary text-xs py-2 px-5 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Publish Examination</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Page / Navigation Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Save Draft to Account?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    You have unsaved changes. Save this draft to your database account so you can continue editing from anywhere.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveModal(false);
                  setPendingNavigation(null);
                  setLeaveModalError('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close and stay on page"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {leaveModalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{leaveModalError}</span>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs space-y-2 border border-slate-200/80 dark:border-slate-800">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Assessment title:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[210px]">
                  {title.trim() || 'Untitled Assessment Draft'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Questions in draft:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{questions.length} questions</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Local device backup:</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-saved on device
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveModal(false);
                    setPendingNavigation(null);
                    setLeaveModalError('');
                  }}
                  className="btn-secondary text-xs py-2.5 px-4 flex-1 cursor-pointer font-medium"
                >
                  Stay & Edit
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndLeave}
                  disabled={isSavingDraft}
                  className="btn-primary text-xs py-2.5 px-4 flex-1 flex items-center justify-center gap-1.5 cursor-pointer font-medium shadow-sm"
                >
                  {isSavingDraft ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5" />
                  )}
                  <span>{isSavingDraft ? 'Saving Draft...' : 'Save & Leave'}</span>
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveModal(false);
                    const target = pendingNavigation || '/dashboard';
                    setPendingNavigation(null);
                    setHasUnsavedChanges(false);
                    setLeaveModalError('');
                    navigate(target);
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer py-1 px-2 rounded hover:underline underline-offset-2"
                >
                  Leave without saving to database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Paper Dark & Light Mode PDF Preview Modal */}
      <QuestionPaperPDFModal
        isOpen={isPDFModalOpen}
        exam={{
          title: title || 'Untitled Examination',
          category,
          durationMinutes: Number(durationMinutes) || 60,
          markingScheme: { correct: Number(correctMark) || 4, incorrect: Number(incorrectMark) || -1 },
          questions,
          createdAt: new Date().toISOString()
        }}
        onClose={() => setIsPDFModalOpen(false)}
      />

      {/* Discard Draft Safety Confirmation Modal (Requires typing DISCARD) */}
      <DiscardDraftModal
        isOpen={discardModalOpen}
        onClose={() => setDiscardModalOpen(false)}
        onConfirm={handleConfirmDiscardDraft}
        examTitle={title || 'Untitled Assessment Draft'}
        isDeleting={isDiscardingCloud}
        isCloudDraft={Boolean(existingExamId)}
      />

      {/* Floating Draft Restored Corner Toast */}
      {draftRestored && (
        <aside
          role="status"
          aria-live="polite"
          onMouseEnter={() => setDraftToastHovered(true)}
          onMouseLeave={() => setDraftToastHovered(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white dark:bg-[#131926] border border-slate-200/90 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-lg text-xs animate-in slide-in-from-bottom-4 fade-in duration-200"
        >
          {!toastConfirmDiscard ? (
            <>
              <Clock className="w-4 h-4 text-slate-400 stroke-[2] shrink-0" />
              <span className="text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
                Draft restored{draftRestoredTime ? ` from ${draftRestoredTime}` : ''} ({questions.length} question{questions.length !== 1 ? 's' : ''})
              </span>
              <button
                type="button"
                onClick={() => setToastConfirmDiscard(true)}
                className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium px-2 py-1 rounded transition-colors ml-auto cursor-pointer"
                title="Discard restored local draft changes"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setDraftRestored(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                title="Dismiss notification"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
                Discard local changes?
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setToastConfirmDiscard(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDiscardLocalDraft}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Discard
                </button>
              </div>
            </>
          )}
        </aside>
      )}
    </div>
  );
}