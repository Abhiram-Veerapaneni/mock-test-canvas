import React, { useState, useRef } from 'react';
import MathRenderer from '../common/MathRenderer';
import api from '../../services/api';
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
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function ManualQuestionForm({ onAddQuestion, examId = 'draft', examTitle = 'exam' }) {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('MCQ');
  const [imageAttachment, setImageAttachment] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('');
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

  const handleRemoveOptionImage = (idx) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], image: '' };
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, { text: `Option ${String.fromCharCode(65 + options.length)}`, image: '' }]);
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    setCorrectAnswers(
      correctAnswers.filter((ans) => ans !== idx).map((ans) => (ans > idx ? ans - 1 : ans))
    );
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
      setCorrectAnswers([...correctAnswers, idx].sort((a, b) => a - b));
    }
  };

  const handleQuestionTypeChange = (newType) => {
    setQuestionType(newType);
    if (newType === 'MCQ' || newType === 'MSQ') {
      setCorrectAnswers([0]);
    } else if (newType === 'NAT') {
      setCorrectAnswers([]);
    }
  };

  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    setValidationError('');

    const hasText = questionText.trim().length > 0;
    const hasImage = Boolean(imageAttachment && imageAttachment.trim().length > 0);

    if (!hasText && !hasImage) {
      setValidationError('Question must have either a statement statement or an attached picture.');
      return;
    }

    if (!subject.trim()) {
      setValidationError('Subject field is required.');
      return;
    }

    let finalCorrectAnswers = [];

    if (questionType === 'MCQ' || questionType === 'MSQ') {
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (!opt.text.trim() && !opt.image) {
          setValidationError(`Option ${String.fromCharCode(65 + i)} must have either text or an image.`);
          return;
        }
      }
      if (correctAnswers.length === 0) {
        setValidationError('Please mark at least one correct answer.');
        return;
      }
      finalCorrectAnswers = correctAnswers;
    } else if (questionType === 'NAT') {
      const minVal = parseFloat(natMin);
      const maxVal = parseFloat(natMax || natMin);
      if (isNaN(minVal) || isNaN(maxVal)) {
        setValidationError('Please enter a valid numeric value or boundary for NAT.');
        return;
      }
      finalCorrectAnswers = [minVal, maxVal];
    }

    const newQuestion = {
      questionText: questionText.trim(),
      questionType,
      imageAttachment: imageAttachment.trim(),
      subject: subject.trim(),
      topic: topic.trim() || 'General',
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
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 text-slate-900 dark:text-zinc-100 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Question Authoring Panel
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            LaTeX equations parsed via KaTeX ($inline$ and $$block$$). Questions and options support diagrams.
          </p>
        </div>

        {/* Segmented View Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setPreviewMode('edit')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
              previewMode === 'edit'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
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
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
              previewMode === 'split'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('preview')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
              previewMode === 'preview'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
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
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmitQuestion} className="space-y-4">
        {/* Streamlined Question Type, Subject, and Topic Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) => handleQuestionTypeChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="MCQ">MCQ (Single Choice)</option>
              <option value="MSQ">MSQ (Multiple Choice)</option>
              <option value="NAT">NAT (Numerical Answer)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topic / Tag
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Definite Integrals"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Statement with Split/Preview Tabs & Picture Attachment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                {isUploadingQuestionImg ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Uploading Picture...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter question statement (e.g. Find $\int_0^1 x dx$). Can be left blank if statement is an image."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            )}

            {(previewMode === 'preview' || previewMode === 'split') && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-y-auto max-h-40 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Real-Time LaTeX Preview
                </span>
                {questionText ? (
                  <MathRenderer text={questionText} className="text-xs text-slate-900 dark:text-slate-100" />
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No text entered.</span>
                )}
              </div>
            )}
          </div>

          {/* Attached Question Picture Display */}
          {imageAttachment && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                  <img src={imageAttachment} alt="Question Diagram" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                    Question Diagram Attached
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                    {imageAttachment}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImageAttachment('')}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Remove picture"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Options Builder: Clean A, B, C, D input rows with drag handles, subtle green highlight */}
        {(questionType === 'MCQ' || questionType === 'MSQ') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Options Builder & Correct Key ({questionType === 'MCQ' ? 'Single Choice' : 'Multiple Choice'})
                </label>
                <p className="text-[10px] text-slate-400">
                  Click the option badge (A, B, C, D) to mark the correct choice. Rows highlight with subtle emerald.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddOption}
                disabled={options.length >= 6}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Option
              </button>
            </div>

            <div className="space-y-2">
              {options.map((opt, optIdx) => {
                const isSelected = correctAnswers.includes(optIdx);
                const isUploadingThis = uploadingOptIndex === optIdx;

                return (
                  <div
                    key={optIdx}
                    className={`space-y-1.5 p-2 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-950/25 dark:border-emerald-800/60 shadow-2xs'
                        : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
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
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? '✓' : String.fromCharCode(65 + optIdx)}
                      </button>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)} text/formula...`}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Attach option picture"
                      >
                        {isUploadingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
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
                      <div className="ml-12 flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={opt.image}
                            alt="Option diagram"
                            className="w-8 h-8 object-contain rounded border border-slate-200 dark:border-slate-700 bg-white"
                          />
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                            Option Diagram Uploaded
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
          <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Numeric Value Range [Min, Max]
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Minimum Value</span>
                <input
                  type="number"
                  step="any"
                  value={natMin}
                  onChange={(e) => setNatMin(e.target.value)}
                  placeholder="e.g. 10.0"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Maximum Value (Optional)</span>
                <input
                  type="number"
                  step="any"
                  value={natMax}
                  onChange={(e) => setNatMax(e.target.value)}
                  placeholder="e.g. 10.5"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Accordion for Pedagogical Solution / Explanation */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setIsExplanationOpen(!isExplanationOpen)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Pedagogical Solution / Explanation (Optional)</span>
              {explanation.trim() && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
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
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <textarea
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Step-by-step solution shown after candidate completes assessment (LaTeX supported)..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {explanation.trim() && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Explanation KaTeX Preview:
                  </span>
                  <MathRenderer text={explanation} className="text-xs text-slate-800 dark:text-slate-200" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Action Bar for "Add to Question Paper" */}
        <div className="sticky bottom-0 pt-3 pb-1 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            {questionType} • {subject}
          </span>
          <button
            type="submit"
            className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Question Paper</span>
          </button>
        </div>
      </form>
    </div>
  );
}
