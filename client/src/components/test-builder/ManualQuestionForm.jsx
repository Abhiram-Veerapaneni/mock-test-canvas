import React, { useState, useRef, useEffect, useCallback } from 'react';
import MathRenderer from '../common/MathRenderer';
import api from '../../services/api';
import useAuthStore from '../../store/useAuthStore';
import {
  Plus,
  Trash2,
  Eye,
  Edit3,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';

export default function ManualQuestionForm({ onAddQuestion, examId = 'draft', examTitle = 'exam' }) {
  const { user } = useAuthStore();
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('MCQ');
  const [imageAttachment, setImageAttachment] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('');
  const [stream, setStream] = useState('Mathematics');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [streamSuggestions, setStreamSuggestions] = useState([]);
  const [options, setOptions] = useState([
    { text: 'Option A with $\\frac{a}{b}$ formula', image: '' },
    { text: 'Option B with $\\sqrt{x}$', image: '' },
    { text: 'Option C', image: '' },
    { text: 'Option D', image: '' }
  ]);
  const [correctAnswers, setCorrectAnswers] = useState([0]);
  const [natMin, setNatMin] = useState('');
  const [natMax, setNatMax] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState('split');
  const [validationError, setValidationError] = useState('');

  // Upload states
  const [isUploadingQuestionImg, setIsUploadingQuestionImg] = useState(false);
  const [uploadingOptIndex, setUploadingOptIndex] = useState(null);

  const questionFileRef = useRef(null);
  const optionFileRefs = useRef({});

  // Auto-save in-progress question to local storage
  const isInitialQMount = useRef(true);
  const qDraftRef = useRef(null);
  qDraftRef.current = {
    questionText,
    questionType,
    imageAttachment,
    subject,
    topic,
    stream,
    tags,
    options,
    correctAnswers,
    natMin,
    natMax,
    explanation
  };

  const saveQDraft = useCallback(() => {
    const d = qDraftRef.current;
    if (!d) return;
    const hasContent = Boolean(
      (d.questionText && d.questionText.trim()) ||
      (d.imageAttachment && d.imageAttachment.trim()) ||
      (d.explanation && d.explanation.trim()) ||
      (Array.isArray(d.options) && d.options.some((o) => o.text && o.text.trim()))
    );
    const uId = user?._id || 'guest';
    const key = `pmt_draft_manual_question_${uId}`;
    if (!hasContent) {
      try {
        localStorage.removeItem(key);
        localStorage.removeItem('pmt_draft_manual_question');
      } catch (e) {}
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(d));
    } catch (e) {}
  }, [user?._id]);

  // Restore on mount from local storage
  useEffect(() => {
    try {
      const uId = user?._id || 'guest';
      const saved = localStorage.getItem(`pmt_draft_manual_question_${uId}`) || localStorage.getItem('pmt_draft_manual_question');
      if (saved) {
        const q = JSON.parse(saved);
        if (q.questionText || (Array.isArray(q.options) && q.options.some((o) => o.text))) {
          if (q.questionText !== undefined) setQuestionText(q.questionText);
          if (q.questionType !== undefined) setQuestionType(q.questionType);
          if (q.imageAttachment !== undefined) setImageAttachment(q.imageAttachment);
          if (q.subject !== undefined) setSubject(q.subject);
          if (q.topic !== undefined) setTopic(q.topic);
          if (q.stream !== undefined) setStream(q.stream);
          if (Array.isArray(q.tags)) setTags(q.tags);
          if (Array.isArray(q.options)) setOptions(q.options);
          if (Array.isArray(q.correctAnswers)) setCorrectAnswers(q.correctAnswers);
          if (q.natMin !== undefined) setNatMin(q.natMin);
          if (q.natMax !== undefined) setNatMax(q.natMax);
          if (q.explanation !== undefined) setExplanation(q.explanation);
        }
      }
    } catch (e) {
      console.warn('Failed to restore manual question draft:', e);
    }
  }, [user?._id]);

  // Save on every change
  useEffect(() => {
    if (isInitialQMount.current) {
      isInitialQMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveQDraft();
    }, 400);
    return () => clearTimeout(timer);
  }, [
    questionText,
    questionType,
    imageAttachment,
    subject,
    topic,
    stream,
    tags,
    options,
    correctAnswers,
    natMin,
    natMax,
    explanation,
    saveQDraft
  ]);

  // Save on beforeunload / pagehide / unmount
  useEffect(() => {
    const handleUnload = () => saveQDraft();
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      saveQDraft();
    };
  }, [saveQDraft]);

  // Fetch streams for datalist
  useEffect(() => {
    api.get('/questions/meta/streams')
      .then((res) => {
        if (res.data?.success) setStreamSuggestions(res.data.streams || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^,+|,+$/g, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (t) => {
    setTags(tags.filter((item) => item !== t));
  };

  // Question Image Upload
  const handleQuestionImageUpload = async (file) => {
    if (!file) return;
    if (!examTitle || !examTitle.trim()) {
      setValidationError('Please enter the Examination Title at the top before uploading images.');
      if (questionFileRef.current) questionFileRef.current.value = '';
      return;
    }
    setIsUploadingQuestionImg(true);
    setValidationError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('examId', examId || 'draft');
      formData.append('examTitle', examTitle || 'exam');
      formData.append('type', 'question');

      const res = await api.post('/exams/upload-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data?.url) {
        setImageAttachment(res.data.url);
      } else {
        throw new Error(res.data?.message || 'Failed to upload question image');
      }
    } catch (err) {
      console.error('Question image upload error:', err);
      setValidationError(err.response?.data?.message || err.message || 'Image upload failed.');
    } finally {
      setIsUploadingQuestionImg(false);
      if (questionFileRef.current) questionFileRef.current.value = '';
    }
  };

  // Option Image Upload
  const handleOptionImageUpload = async (file, optIdx) => {
    if (!file) return;
    if (!examTitle || !examTitle.trim()) {
      setValidationError('Please enter the Examination Title at the top before uploading images.');
      if (optionFileRefs.current[optIdx]) optionFileRefs.current[optIdx].value = '';
      return;
    }
    setUploadingOptIndex(optIdx);
    setValidationError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('examId', examId || 'draft');
      formData.append('examTitle', examTitle || 'exam');
      formData.append('type', 'option');

      const res = await api.post('/exams/upload-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data?.url) {
        const updated = [...options];
        updated[optIdx] = { ...updated[optIdx], image: res.data.url };
        setOptions(updated);
      } else {
        throw new Error(res.data?.message || 'Failed to upload option image');
      }
    } catch (err) {
      console.error('Option image upload error:', err);
      setValidationError(err.response?.data?.message || err.message || 'Option image upload failed.');
    } finally {
      setUploadingOptIndex(null);
      if (optionFileRefs.current[optIdx]) optionFileRefs.current[optIdx].value = '';
    }
  };

  const handleOptionTextChange = (idx, val) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], text: val };
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, { text: '', image: '' }]);
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    setCorrectAnswers(
      correctAnswers
        .filter((ansIdx) => ansIdx !== idx)
        .map((ansIdx) => (ansIdx > idx ? ansIdx - 1 : ansIdx))
    );
  };

  const handleRemoveOptionImage = (idx) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], image: '' };
    setOptions(updated);
  };

  const handleQuestionTypeChange = (newType) => {
    setQuestionType(newType);
    if (newType === 'MCQ') {
      setCorrectAnswers([0]);
    } else if (newType === 'MSQ') {
      setCorrectAnswers([0]);
    } else if (newType === 'NAT') {
      setCorrectAnswers([]);
    }
  };

  const handleCorrectMcqChange = (idx) => {
    setCorrectAnswers([idx]);
  };

  const handleCorrectMsqToggle = (idx) => {
    if (correctAnswers.includes(idx)) {
      if (correctAnswers.length > 1) {
        setCorrectAnswers(correctAnswers.filter((i) => i !== idx));
      }
    } else {
      setCorrectAnswers([...correctAnswers, idx].sort());
    }
  };

  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!questionText.trim() && !imageAttachment.trim()) {
      setValidationError('Please enter a question statement or upload a question diagram.');
      return;
    }

    let finalCorrectAnswers = [];

    if (questionType === 'NAT') {
      const minVal = parseFloat(natMin);
      const maxVal = parseFloat(natMax || natMin);

      if (isNaN(minVal) || isNaN(maxVal)) {
        setValidationError('Please enter valid numeric values for the NAT answer range.');
        return;
      }
      if (minVal > maxVal) {
        setValidationError('NAT minimum value cannot be greater than maximum value.');
        return;
      }
      finalCorrectAnswers = [minVal, maxVal];
    } else {
      for (let i = 0; i < options.length; i++) {
        if (!options[i].text.trim() && !options[i].image) {
          setValidationError(`Option ${String.fromCharCode(65 + i)} cannot be empty.`);
          return;
        }
      }
      if (correctAnswers.length === 0) {
        setValidationError('Please select at least one correct answer option.');
        return;
      }
      finalCorrectAnswers = correctAnswers;
    }

    const newQuestion = {
      questionText: questionText.trim(),
      questionType,
      subject,
      topic: topic.trim() || 'General',
      stream: stream.trim() || subject || 'General',
      tags,
      imageAttachment: imageAttachment.trim(),
      options: questionType === 'NAT' ? [] : options.map((o) => ({
        text: o.text.trim(),
        image: o.image || ''
      })),
      correctAnswers: finalCorrectAnswers,
      explanation: explanation.trim()
    };

    onAddQuestion(newQuestion);

    // Completely reset form fields and option images
    setQuestionText('');
    setImageAttachment('');
    setTopic('');
    setTags([]);
    setTagInput('');
    setExplanation('');
    setOptions([
      { text: '', image: '' },
      { text: '', image: '' },
      { text: '', image: '' },
      { text: '', image: '' }
    ]);
    setCorrectAnswers(questionType === 'NAT' ? [] : [0]);
    if (questionType === 'NAT') {
      setNatMin('');
      setNatMax('');
    }
    if (questionFileRef.current) questionFileRef.current.value = '';
    if (optionFileRefs.current) {
      Object.values(optionFileRefs.current).forEach((ref) => {
        if (ref) ref.value = '';
      });
    }

    try {
      localStorage.removeItem('pmt_draft_manual_question');
    } catch (e) {}
  };

  return (
    <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/90 rounded-xl p-5 sm:p-6 text-slate-900 dark:text-slate-100 shadow-sm space-y-5">
      {/* Panel Header with Segmented View Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Question Authoring Panel
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            LaTeX equations parsed via KaTeX ($inline$ and $$block$$). Diagrams supported for questions and options.
          </p>
        </div>

        {/* Segmented View Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-[#162030] p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <button
            type="button"
            onClick={() => setPreviewMode('edit')}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
              previewMode === 'edit'
                ? 'bg-white dark:bg-[#131926] text-slate-900 dark:text-slate-100 font-medium shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> Edit
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('split')}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
              previewMode === 'split'
                ? 'bg-white dark:bg-[#131926] text-slate-900 dark:text-slate-100 font-medium shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('preview')}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
              previewMode === 'preview'
                ? 'bg-white dark:bg-[#131926] text-slate-900 dark:text-slate-100 font-medium shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> Preview
            </span>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmitQuestion} className="space-y-4">
        {/* Question Type, Subject, and Topic Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) => handleQuestionTypeChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50/50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors cursor-pointer"
            >
              <option value="MCQ">MCQ (Single Choice)</option>
              <option value="MSQ">MSQ (Multiple Choice)</option>
              <option value="NAT">NAT (Numerical Answer)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50/50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors cursor-pointer"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="General Aptitude">General Aptitude</option>
              <option value="Computer Science">Computer Science</option>
              <option value="General">General</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Topic / Tag
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Definite Integrals"
              className="w-full px-3 py-1.5 bg-slate-50/50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
            />
          </div>
        </div>

        {/* Stream & Tags Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50/60 dark:bg-[#162030]/50 border border-slate-200/60 dark:border-slate-800/80">
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
              Stream (Bank Category)
            </label>
            <input
              list="manual-form-streams"
              type="text"
              value={stream}
              onChange={(e) => setStream(e.target.value)}
              placeholder="e.g. Physics, Mathematics"
              className="w-full px-3 py-1.5 bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
            />
            <datalist id="manual-form-streams">
              {streamSuggestions.map((st) => (
                <option key={st} value={st} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tags (Press Enter or comma)
            </label>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-700/80 rounded-lg min-h-[30px]">
              {tags.map((tg) => (
                <span
                  key={tg}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[10px]"
                >
                  <span>{tg}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tg)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "Add tags..." : ""}
                className="flex-1 min-w-[70px] bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none px-1"
              />
            </div>
          </div>
        </div>

        {/* Statement with Split/Preview Tabs & Picture Attachment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Question Statement
            </label>

            {/* Cloudinary Question Image Upload */}
            <div className="flex items-center gap-2">
              <input
                ref={questionFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleQuestionImageUpload(e.target.files[0]);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => questionFileRef.current?.click()}
                disabled={isUploadingQuestionImg}
                className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isUploadingQuestionImg ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{imageAttachment ? 'Change Picture' : 'Attach Picture'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div
            className={`grid gap-3 ${
              previewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {(previewMode === 'edit' || previewMode === 'split') && (
              <textarea
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter question statement (e.g. Find $\int_0^1 x dx$). Can be left blank if statement is an image."
                className="w-full p-3 bg-slate-50/50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-mono leading-relaxed text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              />
            )}

            {(previewMode === 'preview' || previewMode === 'split') && (
              <div className="p-3.5 bg-slate-50/70 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-y-auto max-h-40 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Real-Time LaTeX Preview
                </span>
                {questionText ? (
                  <MathRenderer text={questionText} className="text-xs text-slate-900 dark:text-slate-100" />
                ) : (
                  <span className="text-xs text-slate-400 italic">No text entered.</span>
                )}
              </div>
            )}
          </div>

          {/* Attached Question Picture Display */}
          {imageAttachment && (
            <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                  <img src={imageAttachment} alt="Question Diagram" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-100 block truncate">
                    Question Diagram Attached
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate block">
                    {imageAttachment}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImageAttachment('')}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Remove picture"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Options Builder: Clean A, B, C, D input rows with drag handles */}
        {(questionType === 'MCQ' || questionType === 'MSQ') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Options Builder & Correct Key ({questionType === 'MCQ' ? 'Single Choice' : 'Multiple Choice'})
                </label>
                <p className="text-[11px] text-slate-400">
                  Click the option badge (A, B, C, D) to mark the correct choice.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddOption}
                disabled={options.length >= 6}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Option
              </button>
            </div>

            <div className="space-y-2">
              {options.map((opt, optIdx) => {
                const isSelected = correctAnswers.includes(optIdx);
                const isUploadingThis = uploadingOptIndex === optIdx;
                const letter = String.fromCharCode(65 + optIdx);

                return (
                  <div
                    key={optIdx}
                    className={`space-y-1.5 p-2 rounded-xl border transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/40 border-emerald-300/80 dark:bg-emerald-950/20 dark:border-emerald-800/70'
                        : 'bg-white dark:bg-[#162030] border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Drag Handle */}
                      <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab px-0.5">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Correct Option Selector Badge */}
                      <button
                        type="button"
                        onClick={() =>
                          questionType === 'MCQ'
                            ? handleCorrectMcqChange(optIdx)
                            : handleCorrectMsqToggle(optIdx)
                        }
                        title={isSelected ? 'Correct option (Click to toggle)' : 'Click to mark as correct option'}
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-medium text-xs shrink-0 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-[#131926] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-[#1a2334]'
                        }`}
                      >
                        {isSelected ? '✓' : letter}
                      </button>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                        placeholder={`Option ${letter} text/formula (e.g. $x^2 + 1$)...`}
                        className="flex-1 px-3 py-1.5 bg-slate-50/50 dark:bg-[#131926] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                      />

                      {/* Option Image Upload Trigger */}
                      <input
                        ref={(el) => (optionFileRefs.current[optIdx] = el)}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleOptionImageUpload(e.target.files[0], optIdx);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => optionFileRefs.current[optIdx]?.click()}
                        disabled={isUploadingThis}
                        className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#131926] border border-slate-200 dark:border-slate-700/80 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="Attach option picture"
                      >
                        {isUploadingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                      </button>

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(optIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Option image preview if attached */}
                    {opt.image && (
                      <div className="ml-10 flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-[#131926] border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={opt.image}
                            alt="Option diagram"
                            className="w-8 h-8 object-contain rounded border border-slate-200 dark:border-slate-700 bg-white"
                          />
                          <span className="text-xs text-slate-600 dark:text-slate-400 truncate font-mono">
                            {opt.image}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionImage(optIdx)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remove option image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NAT Range */}
        {questionType === 'NAT' && (
          <div className="bg-slate-50/60 dark:bg-[#162030] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Numeric Value Range [Min, Max]
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Minimum Value</span>
                <input
                  type="number"
                  step="any"
                  value={natMin}
                  onChange={(e) => setNatMin(e.target.value)}
                  placeholder="e.g. 10.0"
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Maximum Value (Optional)</span>
                <input
                  type="number"
                  step="any"
                  value={natMax}
                  onChange={(e) => setNatMax(e.target.value)}
                  placeholder="e.g. 10.5"
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Accordion for Pedagogical Solution / Explanation */}
        <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setIsExplanationOpen(!isExplanationOpen)}
            className="w-full px-4 py-2.5 bg-slate-50/70 dark:bg-[#162030] flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2334] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Pedagogical Solution / Explanation (Optional)</span>
              {explanation.trim() && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  Added
                </span>
              )}
            </div>
            {isExplanationOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {isExplanationOpen && (
            <div className="p-3.5 bg-white dark:bg-[#131926] border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <textarea
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Step-by-step solution shown after candidate completes assessment (LaTeX supported)..."
                className="w-full p-2.5 bg-slate-50/50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {explanation.trim() && (
                <div className="p-2.5 bg-slate-50 dark:bg-[#162030] rounded-lg border border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Explanation KaTeX Preview:
                  </span>
                  <MathRenderer text={explanation} className="text-xs text-slate-800 dark:text-slate-200" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Action Bar for "Add to Question Paper" */}
        <div className="sticky bottom-0 pt-3 pb-1 bg-white/95 dark:bg-[#131926]/95 backdrop-blur-sm border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {questionType} · {subject}
          </span>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Question Paper</span>
          </button>
        </div>
      </form>
    </div>
  );
}
