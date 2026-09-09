import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ManualQuestionForm from '../components/test-builder/ManualQuestionForm';
import IngestionReviewModal from '../components/test-builder/IngestionReviewModal';
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
  FileText
} from 'lucide-react';

export default function TestCreationPage() {
  const navigate = useNavigate();

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
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // AI Ingestion pipeline state
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStep, setIngestionStep] = useState('');
  const [ingestionError, setIngestionError] = useState('');
  const [ingestionModalOpen, setIngestionModalOpen] = useState(false);
  const [ingestedQuestions, setIngestedQuestions] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef(null);

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
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim()) {
      setError('Please provide an assessment title.');
      return;
    }

    if (questions.length === 0) {
      setError('Please add at least one question before publishing.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
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

      const res = await api.post('/exams', payload);
      if (res.data?.success) {
        setSuccessMsg('Examination published successfully! Redirecting to candidate dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to create exam:', err);
      setError(err.response?.data?.message || 'Error saving examination. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
              { label: 'Create New Exam' }
            ]}
          />
        </div>

        {/* Top Header Action Bar */}
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Exam Authoring Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure parameters, automated proctoring thresholds, and compose questions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
              Questions: <strong className="text-slate-900 dark:text-white tabular-nums">{questions.length}</strong>
            </div>

            <button
              onClick={handleSaveExam}
              disabled={isSaving || questions.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer hover:shadow-md"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Exam...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Examination</span>
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

              {/* Attempt Limit */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Attempt Constraints
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUnlimitedAttempts}
                      onChange={(e) => setIsUnlimitedAttempts(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">Unlimited candidate attempts</span>
                  </label>
                  {!isUnlimitedAttempts && (
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={maxAttemptsValue}
                      onChange={(e) => setMaxAttemptsValue(e.target.value)}
                      placeholder="e.g. 3 attempts max"
                      className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200/90 dark:border-[#1f293d] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  )}
                </div>
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

            <ManualQuestionForm onAddQuestion={handleAddQuestion} />

            {/* Questions Draft Card */}
            <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1f293d] pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Question Items ({questions.length})
                </h3>
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
                  <p className="text-[11px] text-slate-400 mt-0.5">Use the Question Authoring form above to add items to this draft.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-[#090d16]/70 border border-slate-200/80 dark:border-[#1f293d] flex items-start justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center tabular-nums">
                            {idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                            {q.questionType}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                            {q.subject} {q.topic && `• ${q.topic}`}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed pl-8">
                          <MathRenderer text={q.questionText} />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

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
