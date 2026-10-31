import { useState, useRef } from 'react';
import api from '../services/api';

export default function useTestCreationIngestion({
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
}) {
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStep, setIngestionStep] = useState('');
  const [ingestionError, setIngestionError] = useState('');
  const [ingestionModalOpen, setIngestionModalOpen] = useState(false);
  const [ingestedQuestions, setIngestedQuestions] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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

  return {
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
  };
}

