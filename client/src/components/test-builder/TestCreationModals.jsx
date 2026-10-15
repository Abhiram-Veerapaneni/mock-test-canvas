import React from 'react';
import QuestionEditModal from './QuestionEditModal';
import ImageLightboxModal from './ImageLightboxModal';
import IngestionReviewModal from './IngestionReviewModal';
import ConfirmPublishModal from './ConfirmPublishModal';
import LeaveDraftModal from './LeaveDraftModal';
import QuestionPaperPDFModal from './QuestionPaperPDFModal';
import DiscardDraftModal from '../common/DiscardDraftModal';
import DraftRestoredToast from './DraftRestoredToast';

export default function TestCreationModals({
  editingQuestionIndex,
  questions,
  tempExamId,
  existingExamId,
  title,
  category,
  durationMinutes,
  correctMark,
  incorrectMark,
  isScheduled,
  startTime,
  endTime,
  isUnlimitedAttempts,
  maxAttemptsValue,
  allowPracticeMode,
  allowReviewResponses,
  faceCheck,
  audioCheck,
  fullScreenLock,
  objectCheck,
  liveNotifications,
  contributeAllToBank,
  onToggleContributeAll,
  examStatus,
  onSaveEditedQuestion,
  onCloseEditModal,
  lightboxImage,
  onCloseLightbox,
  ingestionModalOpen,
  uploadedFileName,
  ingestedQuestions,
  onConfirmIngestedQuestions,
  onCloseIngestionModal,
  showConfirmModal,
  onCloseConfirmModal,
  onConfirmPublish,
  isSaving,
  showLeaveModal,
  onCloseLeaveModal,
  onSaveAndLeave,
  onLeaveWithoutSaving,
  isSavingDraft,
  leaveModalError,
  isPDFModalOpen,
  onClosePDFModal,
  discardModalOpen,
  onCloseDiscardModal,
  onConfirmDiscardDraft,
  isDiscardingCloud,
  draftRestored,
  draftRestoredTime,
  toastConfirmDiscard,
  setToastConfirmDiscard,
  onDiscardLocalDraft,
  onDismissDraftRestored,
  setDraftToastHovered
}) {
  return (
    <>
      {/* Edit Question Modal */}
      {editingQuestionIndex !== null && questions[editingQuestionIndex] && (
        <QuestionEditModal
          isOpen={editingQuestionIndex !== null}
          question={questions[editingQuestionIndex]}
          questionIndex={editingQuestionIndex}
          examId={existingExamId || tempExamId}
          examTitle={title}
          isPublishedExam={examStatus === 'published'}
          onSave={onSaveEditedQuestion}
          onClose={onCloseEditModal}
        />
      )}

      {/* Image Lightbox Modal */}
      <ImageLightboxModal
        imageUrl={lightboxImage}
        onClose={onCloseLightbox}
      />

      {/* Ingestion Review Studio Modal */}
      {ingestionModalOpen && (
        <IngestionReviewModal
          isOpen={ingestionModalOpen}
          fileName={uploadedFileName}
          initialQuestions={ingestedQuestions}
          defaultContributeToBank={contributeAllToBank}
          onConfirm={onConfirmIngestedQuestions}
          onClose={onCloseIngestionModal}
        />
      )}

      {/* Confirm Examination Settings Before Publishing Modal */}
      <ConfirmPublishModal
        isOpen={showConfirmModal}
        onClose={onCloseConfirmModal}
        onConfirm={onConfirmPublish}
        isSaving={isSaving}
        title={title}
        category={category}
        durationMinutes={durationMinutes}
        questions={questions}
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
        contributeAllToBank={contributeAllToBank}
        onToggleContributeAll={onToggleContributeAll}
      />

      {/* Leave Page / Navigation Confirmation Modal */}
      <LeaveDraftModal
        isOpen={showLeaveModal}
        onClose={onCloseLeaveModal}
        onSaveAndLeave={onSaveAndLeave}
        onLeaveWithoutSaving={onLeaveWithoutSaving}
        isSavingDraft={isSavingDraft}
        title={title}
        questionCount={questions.length}
        errorMessage={leaveModalError}
      />

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
        onClose={onClosePDFModal}
      />

      {/* Discard Draft Safety Confirmation Modal */}
      <DiscardDraftModal
        isOpen={discardModalOpen}
        onClose={onCloseDiscardModal}
        onConfirm={onConfirmDiscardDraft}
        examTitle={title || 'Untitled Assessment Draft'}
        isDeleting={isDiscardingCloud}
        isCloudDraft={Boolean(existingExamId)}
      />

      {/* Floating Draft Restored Corner Toast */}
      <DraftRestoredToast
        draftRestored={draftRestored}
        draftRestoredTime={draftRestoredTime}
        questionCount={questions.length}
        toastConfirmDiscard={toastConfirmDiscard}
        setToastConfirmDiscard={setToastConfirmDiscard}
        onDiscard={onDiscardLocalDraft}
        onDismiss={onDismissDraftRestored}
        setDraftToastHovered={setDraftToastHovered}
      />
    </>
  );
}
