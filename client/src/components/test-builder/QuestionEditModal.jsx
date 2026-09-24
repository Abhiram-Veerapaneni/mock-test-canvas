import React, { useState, useRef } from 'react';
import MathRenderer from '../common/MathRenderer';
import api from '../../services/api';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';

export default function QuestionEditModal({
  isOpen,
  question,
  questionIndex,
  examId,
  examTitle,
  isPublishedExam,
  onSave,
  onClose
}) {
  if (!isOpen || !question) return null;

  const [questionText, setQuestionText] = useState(question.questionText || '');
  const [questionType, setQuestionType] = useState(question.questionType || 'MCQ');
  const [imageAttachment, setImageAttachment] = useState(question.imageAttachment || '');
  const [subject, setSubject] = useState(question.subject || 'Mathematics');
  const [topic, setTopic] = useState(question.topic || '');
  
  // Format options into [{ text, image }]
  const [options, setOptions] = useState(() => {
    if (!Array.isArray(question.options) || question.options.length === 0) {
      return [
        { text: 'Option A', image: '' },
        { text: 'Option B', image: '' },
        { text: 'Option C', image: '' },
        { text: 'Option D', image: '' }
      ];
    }
    return question.options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return { text: opt.text || '', image: opt.image || '' };
      }
      return { text: String(opt || ''), image: '' };
    });
  });

  const [correctAnswers, setCorrectAnswers] = useState(
    Array.isArray(question.correctAnswers) ? question.correctAnswers : [0]
  );
  const [natMin, setNatMin] = useState(
    question.questionType === 'NAT' && question.correctAnswers?.[0] !== undefined
      ? String(question.correctAnswers[0])
      : ''
  );
  const [natMax, setNatMax] = useState(
    question.questionType === 'NAT' && question.correctAnswers?.[1] !== undefined
      ? String(question.correctAnswers[1])
      : ''
  );
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [previewMode, setPreviewMode] = useState('split');
  const [validationError, setValidationError] = useState('');

  // Upload states
  const [isUploadingQuestionImg, setIsUploadingQuestionImg] = useState(false);
  const [uploadingOptIndex, setUploadingOptIndex] = useState(null);

  const questionFileRef = useRef(null);
  const optionFileRefs = useRef({});

  // Question Image Upload to Cloudinary
  const handleQuestionImageUpload = async (file) => {
    if (!file) return;
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
        throw new Error(res.data?.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Question image upload error:', err);
      setValidationError(err.response?.data?.message || err.message || 'Image upload failed.');
    } finally {
      setIsUploadingQuestionImg(false);
      if (questionFileRef.current) questionFileRef.current.value = '';
    }
  };

  // Option Image Upload to Cloudinary
  const handleOptionImageUpload = async (file, optIdx) => {
    if (!file) return;
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

  const handleOptionTextChange = (idx, textVal) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], text: textVal };
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

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    setValidationError('');

    const hasText = questionText.trim().length > 0;
    const hasImage = Boolean(imageAttachment && imageAttachment.trim().length > 0);

    if (!hasText && !hasImage) {
      setValidationError('Question must have either a statement text or an attached picture.');
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

    const updatedQuestion = {
      ...question,
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
      explanation: explanation.trim(),
      // Tag as edited if modifying a published exam
      isEdited: isPublishedExam ? true : Boolean(question.isEdited),
      editedAt: isPublishedExam ? new Date() : question.editedAt
    };

    onSave(questionIndex, updatedQuestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="max-w-4xl w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#334155] flex items-center justify-between bg-slate-50/80 dark:bg-[#151f32] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
              #{questionIndex + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Edit Question Item
                </h2>
                {isPublishedExam && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                    Will be Tagged [Edited]
                  </span>
                )}
                {question.isEdited && !isPublishedExam && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                    Edited
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Modify statement, replace KaTeX formulas, or update attached pictures & options.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Segmented Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode('edit')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  previewMode === 'edit'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('split')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  previewMode === 'split'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('preview')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  previewMode === 'preview'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-900 dark:text-slate-100">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{validationError}</span>
            </div>
          )}

          <form id="edit-question-form" onSubmit={handleSaveQuestion} className="space-y-5">
            {/* Meta Row: Type, Subject, Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Question Type
                </label>
                <select
                  value={questionType}
                  onChange={(e) => handleQuestionTypeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                  Topic / Subtopic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Thermodynamics"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Question Statement & Image */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Question Statement (Text / LaTeX / Formula)
                </label>

                {/* Cloudinary Question Image Upload Trigger */}
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingQuestionImg ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>Uploading Picture...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{imageAttachment ? 'Replace Picture' : 'Attach Picture (Cloudinary)'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Statement Editor & Preview */}
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
                    placeholder="Enter question statement (e.g. Find $\int_0^1 x dx$). Can be blank if statement is an image."
                    className="w-full p-3 bg-white dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                  />
                )}

                {(previewMode === 'preview' || previewMode === 'split') && (
                  <div className="p-3 bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] rounded-xl overflow-y-auto max-h-48 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Formula Rendered Preview
                    </span>
                    {questionText ? (
                      <MathRenderer text={questionText} className="text-xs text-slate-900 dark:text-slate-100" />
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No text provided.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Attached Question Picture Display */}
              {imageAttachment && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                      <img
                        src={imageAttachment}
                        alt="Question diagram"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                        Question Diagram Attached
                      </span>
                      <a
                        href={imageAttachment}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline truncate block"
                      >
                        {imageAttachment}
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageAttachment('')}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                    title="Remove question image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* MCQ / MSQ Options */}
            {(questionType === 'MCQ' || questionType === 'MSQ') && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Options & Correct Answer ({questionType === 'MCQ' ? 'Single Choice' : 'Multiple Choices'})
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Each option can be text, a picture (saved to Cloudinary), or both.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOption}
                    disabled={options.length >= 6}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                </div>

                <div className="space-y-2.5">
                  {options.map((opt, optIdx) => {
                    const isSelected = correctAnswers.includes(optIdx);
                    const isUploadingThis = uploadingOptIndex === optIdx;

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800/80'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Correct toggle button */}
                          <button
                            type="button"
                            onClick={() =>
                              questionType === 'MCQ'
                                ? handleCorrectMcqChange(optIdx)
                                : handleCorrectMsqToggle(optIdx)
                            }
                            title={isSelected ? 'Marked correct' : 'Click to mark correct'}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? '✓' : String.fromCharCode(65 + optIdx)}
                          </button>

                          {/* Option text */}
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)} text or formula...`}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />

                          {/* Cloudinary Option Picture Upload */}
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
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Attach option image to Cloudinary"
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
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Delete option"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Option image preview if present */}
                        {opt.image && (
                          <div className="mt-2.5 ml-9 flex items-center justify-between p-2 rounded-lg bg-slate-100/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={opt.image}
                                alt={`Option ${String.fromCharCode(65 + optIdx)} preview`}
                                className="w-9 h-9 object-contain rounded border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                              />
                              <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                                Option Picture Uploaded
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionImage(optIdx)}
                              className="text-xs text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
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
              <div className="bg-slate-50 dark:bg-[#151f32] p-4 rounded-xl border border-slate-200 dark:border-[#334155] space-y-2.5">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Accepted Numeric Answer Range [Min, Max]
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Minimum Value</span>
                    <input
                      type="number"
                      step="any"
                      value={natMin}
                      onChange={(e) => setNatMin(e.target.value)}
                      placeholder="e.g. 10.0"
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Maximum Value (Optional)</span>
                    <input
                      type="number"
                      step="any"
                      value={natMax}
                      onChange={(e) => setNatMax(e.target.value)}
                      placeholder="e.g. 10.5"
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Explanation */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Pedagogical Solution / Explanation (LaTeX supported)
              </label>
              <textarea
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Step-by-step solution shown after candidate completes assessment..."
                className="w-full p-3 bg-white dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-[#334155] flex items-center justify-between bg-slate-50/80 dark:bg-[#151f32] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="edit-question-form"
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save Question Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
