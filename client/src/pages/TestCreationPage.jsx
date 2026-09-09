import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ManualQuestionForm from '../components/test-builder/ManualQuestionForm';
import IngestionReviewModal from '../components/test-builder/IngestionReviewModal';
import QuestionEditModal from '../components/test-builder/QuestionEditModal';
import MathRenderer from '../components/common/MathRenderer';
import api from '../services/api';
import {
  CheckCircle2,
  AlertCircle,
  Layers,
  Trash2,
  Loader2,
  ShieldCheck,
  Plus,
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
  ExternalLink
} from 'lucide-react';

export default function TestCreationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examIdParam = searchParams.get('examId');

  const [existingExamId, setExistingExamId] = useState(examIdParam || null);
  const [examStatus, setExamStatus] = useState('draft');
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [tempExamId] = useState(() => 'exam_' + Date.now());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('JEE');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [correctMark, setCorrectMark] = useState(4);
  const [incorrectMark, setIncorrectMark] = useState(-1);
  const [isUnlimitedAttempts, setIsUnlimitedAttempts] = useState(true);
  const [maxAttemptsValue, setMaxAttemptsValue] = useState(3);

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

  // AI Ingestion pipeline state
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStep, setIngestionStep] = useState('');
  const [ingestionError, setIngestionError] = useState('');
  const [ingestionModalOpen, setIngestionModalOpen] = useState(false);
  const [ingestedQuestions, setIngestedQuestions] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef(null);

  // If examId is in URL, fetch existing exam for editing
  useEffect(() => {
    if (!examIdParam) return;
    setIsLoadingExisting(true);
    api.get(`/exams/${examIdParam}`)
      .then((res) => {
        if (res.data?.success && res.data.exam) {
          const ex = res.data.exam;
          setExistingExamId(ex._id);
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
          if (Array.isArray(ex.questions)) {
            setQuestions(ex.questions);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch existing exam:', err);
        setError('Failed to load assessment: ' + (err.response?.data?.message || err.message));
      })
      .finally(() => setIsLoadingExisting(false));
  }, [examIdParam]);

  const handleFileUpload = async (file) => {
    if (!file) return;
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
    setQuestions((prev) => [...prev, ...approvedQuestions]);
    setIngestionModalOpen(false);
    setIngestedQuestions([]);
    setSuccessMsg(`Successfully imported ${approvedQuestions.length} questions from AI document extraction!`);
  };

  const handleAddQuestion = (newQuestion) => {
    setQuestions([...questions, newQuestion]);
    setSuccessMsg(`Question #${questions.length + 1} added.`);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  // Re-ordering questions
  const handleMoveQuestionUp = (index) => {
    if (index <= 0) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveQuestionDown = (index) => {
    if (index >= questions.length - 1) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Updating an edited question
  const handleUpdateQuestion = (index, updatedQ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = updatedQ;
      return copy;
    });
    setSuccessMsg(`Question #${index + 1} updated successfully.`);
  };

  // Save / Publish
  const handleSaveExam = async (e, targetStatus = 'published') => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim()) {
      setError('Please provide an assessment title.');
      return;
    }

    const isDraft = targetStatus === 'draft';
    if (!isDraft && questions.length === 0) {
      setError('Please add at least one question before publishing.');
      return;
    }

    if (isDraft) {
      setIsSavingDraft(true);
    } else {
      setIsSaving(true);
    }

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        status: targetStatus,
        durationMinutes: Number(durationMinutes),
        markingScheme: {
          correct: Number(correctMark),
          incorrect: Number(incorrectMark)
        },
        maxAttempts: isUnlimitedAttempts ? null : Math.max(1, Number(maxAttemptsValue)),
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
        if (savedExam?._id) setExistingExamId(savedExam._id);

        if (isDraft) {
          setSuccessMsg('Assessment draft saved successfully! You can continue editing.');
        } else {
          setSuccessMsg('Examination published successfully! Redirecting to candidate dashboard...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1200);
        }
      }
    } catch (err) {
      console.error('Failed to save exam:', err);
      setError(err.response?.data?.message || 'Error saving examination. Please try again.');
    } finally {
      setIsSaving(false);
      setIsSavingDraft(false);
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <BackButton to="/dashboard" label="Return to Dashboard" />
          <Breadcrumbs
            items={[
              { label: 'Assessments', to: '/dashboard' },
              { label: 'Authoring Studio' },
              { label: existingExamId ? 'Edit Assessment' : 'Create New Exam' }
            ]}
          />
        </div>

        {/* Top Header Action Bar */}
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {existingExamId ? 'Edit Examination' : 'Exam Authoring Studio'}
              </h1>
              {existingExamId && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                    examStatus === 'draft'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {examStatus === 'draft' ? 'Draft' : 'Published'}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Configure parameters, proctoring security rules, and compose or re-order questions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
              Questions: <strong className="text-slate-900 dark:text-white tabular-nums">{questions.length}</strong>
            </div>

            {/* Save as Draft Button */}
            <button
              type="button"
              onClick={(e) => handleSaveExam(e, 'draft')}
              disabled={isSavingDraft || isSaving}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Draft...</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save as Draft</span>
                </>
              )}
            </button>

            {/* Publish Button */}
            <button
              type="button"
              onClick={(e) => handleSaveExam(e, 'published')}
              disabled={isSaving || isSavingDraft || questions.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer hover:shadow-md"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{examStatus === 'published' ? 'Save Changes' : 'Publish Examination'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Exam Configuration */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 dark:border-[#1f293d] pb-3">
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Assessment Settings</span>
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Examination Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JEE Advanced Full Mock 01"
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#090d16] border border-slate-200/90 dark:border-[#1f293d] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description & Guidelines
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Exam instructions or syllabus summary..."
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#090d16] border border-slate-200/90 dark:border-[#1f293d] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Curriculum Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200/90 dark:border-[#1f293d] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                  >
                    <option value="JEE">JEE</option>
                    <option value="NEET">NEET</option>
                    <option value="GATE">GATE</option>
                    <option value="APTITUDE">APTITUDE</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200/90 dark:border-[#1f293d] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Attempt Limit Card */}
              <div className="bg-slate-50 dark:bg-[#090d16]/80 p-4 rounded-xl border border-slate-200/80 dark:border-[#1f293d] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Candidate Attempt Limits</span>
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {isUnlimitedAttempts ? 'Unlimited (∞)' : `${maxAttemptsValue} ${maxAttemptsValue === 1 ? 'Attempt' : 'Attempts'}`}
                  </span>
                </div>

                {/* 3 Preset Mode Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlimitedAttempts(false);
                      setMaxAttemptsValue(1);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      !isUnlimitedAttempts && Number(maxAttemptsValue) === 1
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                        : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <span className="block text-xs font-bold">1 Attempt</span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Strict Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlimitedAttempts(false);
                      if (Number(maxAttemptsValue) === 1) setMaxAttemptsValue(3);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      !isUnlimitedAttempts && Number(maxAttemptsValue) > 1
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                        : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <span className="block text-xs font-bold">Multiple</span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Custom limit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsUnlimitedAttempts(true)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isUnlimitedAttempts
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                        : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <span className="block text-xs font-bold">Unlimited</span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Practice (∞)</span>
                  </button>
                </div>

                {/* Number Stepper when Multiple is selected */}
                {!isUnlimitedAttempts && Number(maxAttemptsValue) > 1 && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-[#1f293d] space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Allowed Attempts:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMaxAttemptsValue(Math.max(2, Number(maxAttemptsValue) - 1))}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={2}
                          max={50}
                          value={maxAttemptsValue}
                          onChange={(e) => setMaxAttemptsValue(Math.max(2, parseInt(e.target.value) || 2))}
                          className="w-14 text-center py-1 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setMaxAttemptsValue(Math.min(50, Number(maxAttemptsValue) + 1))}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Quick Preset Pills */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">Presets:</span>
                      {[2, 3, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setMaxAttemptsValue(preset)}
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                            Number(maxAttemptsValue) === preset
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Marking Scheme */}
              <div className="bg-slate-50 dark:bg-[#090d16]/80 p-4 rounded-xl border border-slate-200/80 dark:border-[#1f293d] space-y-2.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Scoring & Negative Marking
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Correct Mark (+)</span>
                    <input
                      type="number"
                      value={correctMark}
                      onChange={(e) => setCorrectMark(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Negative Mark (-)</span>
                    <input
                      type="number"
                      value={incorrectMark}
                      onChange={(e) => setIncorrectMark(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Proctoring Settings */}
              <div className="bg-slate-50 dark:bg-[#090d16]/80 p-4 rounded-xl border border-slate-200/80 dark:border-[#1f293d] space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Proctoring Security Rules</span>
                </span>
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faceCheck}
                      onChange={(e) => setFaceCheck(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Facial Presence Verification Hook</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={audioCheck}
                      onChange={(e) => setAudioCheck(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Acoustic & Noise Level Detection</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fullScreenLock}
                      onChange={(e) => setFullScreenLock(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Strict Fullscreen & Focus Lockdown</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={objectCheck}
                      onChange={(e) => setObjectCheck(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Prohibited Device Detection (Mobile/Books)</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200/80 dark:border-[#1f293d]">
                    <input
                      type="checkbox"
                      checked={liveNotifications}
                      onChange={(e) => setLiveNotifications(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-white">Live Creator WebSocket Alerts</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                        Instantly triggers live toasts with snapshot evidence on your examiner screen.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authoring & Question Drafts */}
          <div className="lg:col-span-2 space-y-5">
            {/* AI Document & Scanned Paper Ingestion Card */}
            <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Automated AI Question Paper Ingestion</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900/60">
                        Gemini 2.5
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Upload PDF (.pdf), Word (.docx), or question paper image (.png, .jpg). Gemini extracts questions and LaTeX formulas automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Drag and Drop Zone */}
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
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]'
                    : isIngesting
                    ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/10 cursor-wait'
                    : 'border-slate-200 dark:border-[#1f293d] hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-[#090d16]/40'
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
                    <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {ingestionStep || 'Processing document with Gemini AI...'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Extracting questions, options, and formatting LaTeX formulas...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span className="text-blue-600 dark:text-blue-400 underline underline-offset-2">Click to browse</span> or drag and drop document here
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Supports PDF (.pdf), Word (.docx) & Images (.png, .jpg, .webp) up to 15 MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {ingestionError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">Document Ingestion Failed</p>
                    <p className="text-[11px] mt-0.5">{ingestionError}</p>
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
            <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1f293d] pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Question Items ({questions.length})
                  </h3>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    • Re-order or edit questions at any time
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tabular-nums">
                  Projected Marks: <strong className="text-slate-900 dark:text-white">{questions.length * correctMark} pts</strong>
                </span>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
                    <Plus className="w-5 h-5" />
                  </div>
                  <p className="font-medium text-slate-600 dark:text-slate-400">No questions composed yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use the Question Authoring form or AI Ingestion above to add items to this examination.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const isNat = q.questionType === 'NAT';
                    const opts = Array.isArray(q.options) ? q.options.map(formatOption) : [];
                    const correctIndices = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];

                    return (
                      <div
                        key={q._id || idx}
                        className="p-5 rounded-2xl bg-slate-50/70 dark:bg-[#090d16]/70 border border-slate-200/80 dark:border-[#1f293d] space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                      >
                        {/* Question Item Header with Re-ordering & Edit Actions */}
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center tabular-nums shadow-xs">
                              {idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                              {q.questionType || 'MCQ'}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                              {q.subject || 'General'} {q.topic && `• ${q.topic}`}
                            </span>
                            {q.isEdited && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                                Edited
                              </span>
                            )}
                          </div>

                          {/* Action Buttons: Re-order, Edit, Delete */}
                          <div className="flex items-center gap-1.5">
                            {/* Move Up */}
                            <button
                              type="button"
                              onClick={() => handleMoveQuestionUp(idx)}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Move question up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              onClick={() => handleMoveQuestionDown(idx)}
                              disabled={idx === questions.length - 1}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Move question down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Question */}
                            <button
                              type="button"
                              onClick={() => setEditingQuestionIndex(idx)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                              title="Edit question and options"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Question */}
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
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
                              className="inline-block p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-400 transition-all group"
                              title="Click to view high-resolution image"
                            >
                              <img
                                src={q.imageAttachment}
                                alt={`Question ${idx + 1} Diagram`}
                                className="max-h-40 max-w-xs sm:max-w-md rounded-lg object-contain"
                              />
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1 mt-1 font-medium">
                                <ExternalLink className="w-3 h-3" /> View full image
                              </span>
                            </div>
                          </div>
                        )}

                        {/* MCQ / MSQ Options Preview Grid */}
                        {!isNat && opts.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {opts.map((opt, optIdx) => {
                              const isCorrect = correctIndices.includes(optIdx);

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all text-xs ${
                                    isCorrect
                                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400/80 dark:border-emerald-800 ring-1 ring-emerald-500/20 text-slate-900 dark:text-slate-100'
                                      : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <div
                                    className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    {isCorrect ? '✓' : getOptionLabel(optIdx)}
                                  </div>

                                  <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
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

                                    {isCorrect && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block pt-0.5">
                                        Correct Answer
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
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Accepted Answer Range:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              {correctIndices[0] !== undefined
                                ? correctIndices[0] === correctIndices[1] || correctIndices[1] === undefined
                                  ? `${correctIndices[0]}`
                                  : `[${correctIndices[0]}, ${correctIndices[1]}]`
                                : 'Not specified'}
                            </span>
                          </div>
                        )}

                        {/* Pedagogical Explanation Preview */}
                        {q.explanation && (
                          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
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
        </div>
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
          className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-3xl w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">High Resolution Image Preview</h3>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden p-2">
              <img src={lightboxImage} alt="Diagram preview" className="max-h-[65vh] w-auto object-contain" />
            </div>
            <div className="flex justify-end">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
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
    </div>
  );
}
