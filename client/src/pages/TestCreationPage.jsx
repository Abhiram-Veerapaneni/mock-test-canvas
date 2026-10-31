import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import TestCreationHeader from '../components/test-builder/TestCreationHeader';
import TestSettingsTab from '../components/test-builder/TestSettingsTab';
import QuestionsStudioTab from '../components/test-builder/QuestionsStudioTab';
import TestCreationModals from '../components/test-builder/TestCreationModals';
import useTestCreationDraft from '../hooks/useTestCreationDraft';
import useTestCreationIngestion from '../hooks/useTestCreationIngestion';
import useTestCreationSave from '../hooks/useTestCreationSave';
import useTestCreationQuestions from '../hooks/useTestCreationQuestions';
import useExistingExamLoader from '../hooks/useExistingExamLoader';
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

  // Proctor settings
  const [faceCheck, setFaceCheck] = useState(true);
  const [audioCheck, setAudioCheck] = useState(true);
  const [fullScreenLock, setFullScreenLock] = useState(true);
  const [objectCheck, setObjectCheck] = useState(true);
  const [liveNotifications, setLiveNotifications] = useState(false);

  // Added questions array
  const [questions, setQuestions] = useState([]);
  const [contributeAllToBank, setContributeAllToBank] = useState(false);
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

  const originalExamRef = useRef(null);
  const isInitialLoadFinishedRef = useRef(false);

  const formData = {
    title, description, category, durationMinutes, correctMark, incorrectMark,
    isUnlimitedAttempts, maxAttemptsValue, allowPracticeMode, allowReviewResponses,
    isScheduled, startTime, endTime, faceCheck, audioCheck, fullScreenLock,
    objectCheck, liveNotifications, questions, contributeAllToBank, activeStudioTab
  };

  const formSetters = {
    setTitle, setDescription, setCategory, setDurationMinutes, setCorrectMark,
    setIncorrectMark, setIsUnlimitedAttempts, setMaxAttemptsValue, setAllowPracticeMode,
    setAllowReviewResponses, setIsScheduled, setStartTime, setEndTime, setFaceCheck,
    setAudioCheck, setFullScreenLock, setObjectCheck, setLiveNotifications,
    setQuestions, setContributeAllToBank, setActiveStudioTab
  };

  // Custom hook for local storage drafts, auto-saving, and navigation guarding
  const {
    autoSaveStatus, setAutoSaveStatus,
    lastSavedTime, setLastSavedTime,
    draftRestored, setDraftRestored,
    draftRestoredTime, setDraftRestoredTime,
    toastConfirmDiscard, setToastConfirmDiscard,
    setDraftToastHovered,
    hasUnsavedChanges, setHasUnsavedChanges,
    showLeaveModal, setShowLeaveModal,
    pendingNavigation, setPendingNavigation,
    leaveModalError, setLeaveModalError,
    discardModalOpen, setDiscardModalOpen,
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
    formData,
    formSetters,
    originalExamRef,
    isInitialLoadFinishedRef,
    setError,
    setSuccessMsg
  });

  // Question CRUD Handlers Hook
  const {
    handleAddQuestion,
    handleRemoveQuestion,
    handleMoveQuestionUp,
    handleMoveQuestionDown,
    handleUpdateQuestion,
    handleToggleContribute,
    handleToggleContributeAll,
  } = useTestCreationQuestions({
    questions,
    setQuestions,
    contributeAllToBank,
    setContributeAllToBank,
    setHasUnsavedChanges,
    hasUnsavedChangesRef,
    setSuccessMsg,
    saveDraftToStorage,
    draftDataRef,
  });

  // Existing Exam Loader Hook
  useExistingExamLoader({
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
  });

  // AI Ingestion Hook
  const {
    isIngesting,
    ingestionStep,
    ingestionError,
    ingestionModalOpen,
    setIngestionModalOpen,
    ingestedQuestions,
    setIngestedQuestions,
    uploadedFileName,
    dragActive,
    setDragActive,
    fileInputRef,
    handleFileUpload,
    handleFileDrop,
    handleConfirmIngestedQuestions,
  } = useTestCreationIngestion({
    isAuthenticated,
    openAuthModal,
    contributeAllToBank,
    questions,
    setQuestions,
    setHasUnsavedChanges,
    hasUnsavedChangesRef,
    setSuccessMsg,
    saveDraftToStorage,
    draftDataRef,
  });

  // Save / Publish Hook
  const {
    isSaving,
    isSavingDraft,
    showConfirmModal,
    setShowConfirmModal,
    executeSaveExam,
    handleSaveAndLeave,
    handleSaveExam,
  } = useTestCreationSave({
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
  });

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

        {/* Global Feedback Banners */}
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

        {/* Horizontal Tabs */}
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
          <QuestionsStudioTab
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
            onAddQuestion={handleAddQuestion}
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
            examId={existingExamId || tempExamId}
            examTitle={title}
            contributeAllToBank={contributeAllToBank}
            setSuccessMsg={setSuccessMsg}
          />
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
