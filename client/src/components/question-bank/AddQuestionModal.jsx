import React, { useState, useEffect } from 'react';
import MathRenderer from '../common/MathRenderer';
import api from '../../services/api';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Check,
  Tag,
  BookOpen,
  HelpCircle,
  Eye,
  Edit3
} from 'lucide-react';

export default function AddQuestionModal({
  isOpen,
  questionToEdit = null,
  onClose,
  onSuccess
}) {
  if (!isOpen) return null;

  const isEdit = Boolean(questionToEdit && questionToEdit._id);

  const [stream, setStream] = useState(questionToEdit?.stream || 'Mathematics');
  const [streamSuggestions, setStreamSuggestions] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(
    Array.isArray(questionToEdit?.tags) ? questionToEdit.tags : []
  );

  const [questionText, setQuestionText] = useState(questionToEdit?.questionText || '');
  const [questionType, setQuestionType] = useState(questionToEdit?.questionType || 'MCQ');
  const [imageAttachment, setImageAttachment] = useState(questionToEdit?.imageAttachment || '');

  const [options, setOptions] = useState(() => {
    if (Array.isArray(questionToEdit?.options) && questionToEdit.options.length > 0) {
      return questionToEdit.options.map((opt) => {
        if (typeof opt === 'object' && opt !== null) {
          return { text: opt.text || '', image: opt.image || '' };
        }
        return { text: String(opt || ''), image: '' };
      });
    }
    return [
      { text: '', image: '' },
      { text: '', image: '' },
      { text: '', image: '' },
      { text: '', image: '' }
    ];
  });

  const [correctAnswers, setCorrectAnswers] = useState(
    Array.isArray(questionToEdit?.correctAnswers) ? questionToEdit.correctAnswers : [0]
  );
  const [natMin, setNatMin] = useState(
    questionToEdit?.questionType === 'NAT' && questionToEdit.correctAnswers?.[0] !== undefined
      ? String(questionToEdit.correctAnswers[0])
      : ''
  );
  const [natMax, setNatMax] = useState(
    questionToEdit?.questionType === 'NAT' && questionToEdit.correctAnswers?.[1] !== undefined
      ? String(questionToEdit.correctAnswers[1])
      : ''
  );

  const [explanation, setExplanation] = useState(questionToEdit?.explanation || '');
  const [previewMode, setPreviewMode] = useState('split'); // 'edit' | 'split' | 'preview'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Image Upload States & Refs
  const diagramFileRef = React.useRef(null);
  const optionFileRefs = React.useRef([]);
  const [isUploadingDiagram, setIsUploadingDiagram] = useState(false);
  const [uploadingOptIndex, setUploadingOptIndex] = useState(null);

  const handleDiagramUpload = async (file) => {
    if (!file) return;
    setIsUploadingDiagram(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/questions/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data?.url) {
        setImageAttachment(res.data.url);
      } else {
        throw new Error(res.data?.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Question diagram upload error:', err);
      setError(err.response?.data?.message || err.message || 'Image upload failed.');
    } finally {
      setIsUploadingDiagram(false);
      if (diagramFileRef.current) diagramFileRef.current.value = '';
    }
  };

  const handleOptionImageUpload = async (file, optIdx) => {
    if (!file) return;
    setUploadingOptIndex(optIdx);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/questions/upload-image', formData, {
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
      setError(err.response?.data?.message || err.message || 'Option image upload failed.');
    } finally {
      setUploadingOptIndex(null);
      if (optionFileRefs.current[optIdx]) optionFileRefs.current[optIdx].value = '';
    }
  };

  // Fetch streams for datalist
  useEffect(() => {
    api.get('/questions/meta/streams')
      .then((res) => {
        if (res.data?.success) {
          setStreamSuggestions(res.data.streams || []);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^,+|,+$/g, '');
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleOptionTextChange = (idx, val) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], text: val };
    setOptions(updated);
  };

  const handleOptionImageChange = (idx, val) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], image: val };
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

  const toggleCorrectAnswer = (idx) => {
    if (questionType === 'MCQ') {
      setCorrectAnswers([idx]);
    } else if (questionType === 'MSQ') {
      if (correctAnswers.includes(idx)) {
        if (correctAnswers.length > 1) {
          setCorrectAnswers(correctAnswers.filter((i) => i !== idx));
        }
      } else {
        setCorrectAnswers([...correctAnswers, idx].sort());
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!questionText.trim() && !imageAttachment.trim()) {
      setError('Please provide a question statement or an image diagram.');
      return;
    }

    let finalCorrectAnswers = [];
    if (questionType === 'NAT') {
      const minVal = parseFloat(natMin);
      const maxVal = parseFloat(natMax || natMin);
      if (isNaN(minVal) || isNaN(maxVal)) {
        setError('Please provide valid numbers for the NAT accepted answer range.');
        return;
      }
      if (minVal > maxVal) {
        setError('NAT minimum accepted value cannot be greater than maximum value.');
        return;
      }
      finalCorrectAnswers = [minVal, maxVal];
    } else {
      for (let i = 0; i < options.length; i++) {
        if (!options[i].text.trim() && !options[i].image) {
          setError(`Option ${String.fromCharCode(65 + i)} cannot be empty.`);
          return;
        }
      }
      if (correctAnswers.length === 0) {
        setError('Please select at least one correct option.');
        return;
      }
      finalCorrectAnswers = correctAnswers;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        stream: stream.trim() || 'General',
        tags,
        questionText: questionText.trim(),
        questionType,
        imageAttachment: imageAttachment.trim(),
        options: questionType === 'NAT' ? [] : options,
        correctAnswers: finalCorrectAnswers,
        explanation: explanation.trim()
      };

      let res;
      if (isEdit) {
        res = await api.put(`/questions/${questionToEdit._id}`, payload);
      } else {
        res = await api.post('/questions', payload);
      }

      if (res.data?.success) {
        onSuccess(res.data.question, isEdit);
        onClose();
      } else {
        throw new Error(res.data?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Save bank question error:', err);
      setError(err.response?.data?.message || err.message || 'Error saving question to bank');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/90 dark:shadow-none rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#162030]/50">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {isEdit ? 'Edit Bank Question' : 'Add Question to Bank'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Contribute verified questions to the shared question repository.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode('edit')}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${previewMode === 'edit'
                    ? 'bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-medium'
                    : 'text-slate-500'
                  }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('split')}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${previewMode === 'split'
                    ? 'bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-medium'
                    : 'text-slate-500'
                  }`}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('preview')}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${previewMode === 'preview'
                    ? 'bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-medium'
                    : 'text-slate-500'
                  }`}
              >
                Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Stream & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Stream */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subject Stream
              </label>
              <input
                list="stream-suggestions"
                type="text"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                placeholder="e.g. Physics, Mathematics"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
              />
              <datalist id="stream-suggestions">
                {streamSuggestions.map((st) => (
                  <option key={st} value={st} />
                ))}
              </datalist>
            </div>

            {/* Question Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => {
                  const newType = e.target.value;
                  setQuestionType(newType);
                  if (newType === 'MCQ') setCorrectAnswers([0]);
                  else if (newType === 'MSQ') setCorrectAnswers([0]);
                  else if (newType === 'NAT') setCorrectAnswers([]);
                }}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
              >
                <option value="MCQ">MCQ (Single Choice)</option>
                <option value="MSQ">MSQ (Multiple Choice)</option>
                <option value="NAT">NAT (Numerical Answer)</option>
              </select>
            </div>

            {/* Tags Chip Input */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Concept Tags (Press Enter)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg min-h-[34px]">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-[11px]"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder={tags.length === 0 ? "Type tag & Enter" : ""}
                  className="flex-1 min-w-[80px] bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none px-1"
                />
              </div>
            </div>
          </div>

          {/* Statement Editor with Live KaTeX Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Question Statement (LaTeX formatted via $inline$ or $$block$$)
              </label>
            </div>

            <div className={`grid gap-3 ${previewMode === 'split' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
              }`}>
              {previewMode !== 'preview' && (
                <textarea
                  rows={4}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter problem statement... e.g. Solve the integral $\int_0^\pi \sin(x) dx$"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-mono"
                />
              )}

              {previewMode !== 'edit' && (
                <div className="p-3 bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-800/80 rounded-lg min-h-[96px] text-xs text-slate-800 dark:text-slate-200 overflow-y-auto">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Live Math Preview:</div>
                  {questionText.trim() ? (
                    <MathRenderer text={questionText} />
                  ) : (
                    <span className="italic text-slate-400">Statement preview will appear here...</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Diagram Upload & URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Optional Diagram Image
              </label>

              {/* Upload to Cloudinary Trigger */}
              <div className="flex items-center gap-2">
                <input
                  ref={diagramFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleDiagramUpload(e.target.files[0]);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => diagramFileRef.current?.click()}
                  disabled={isUploadingDiagram}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-[#162030] text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploadingDiagram ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                      <span>Uploading to Cloudinary...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{imageAttachment ? 'Change Picture' : 'Upload Image'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <input
              type="text"
              value={imageAttachment}
              onChange={(e) => setImageAttachment(e.target.value)}
              placeholder="Or paste direct image URL (https://... or Cloudinary link)"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
            />

            {/* Attached Diagram Preview Card */}
            {imageAttachment && (
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded overflow-hidden bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                    <img src={imageAttachment} alt="Diagram preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100 block truncate">
                      Diagram Image Attached
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block font-mono">
                      {imageAttachment}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setImageAttachment('')}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Remove diagram"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Options for MCQ / MSQ */}
          {questionType !== 'NAT' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Options ({questionType === 'MCQ' ? 'Select 1 correct' : 'Select all correct'})
                </label>
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => {
                  const isCorrect = correctAnswers.includes(idx);
                  const letter = String.fromCharCode(65 + idx);
                  const isUploadingThisOpt = uploadingOptIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border transition-colors space-y-2 ${isCorrect
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : 'bg-white dark:bg-[#162030] border-slate-200 dark:border-slate-700'
                        }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Checkbox / Radio */}
                        <button
                          type="button"
                          onClick={() => toggleCorrectAnswer(idx)}
                          className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-semibold shrink-0 cursor-pointer transition-colors ${isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          title={isCorrect ? 'Marked Correct' : 'Click to mark correct'}
                        >
                          {isCorrect ? '✓' : letter}
                        </button>

                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                            placeholder={`Option ${letter} text (LaTeX supported: $x^2$)`}
                            className="w-full px-2.5 py-1 text-xs bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none focus:border-slate-400 text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        {/* Option Image Trigger */}
                        <input
                          ref={(el) => (optionFileRefs.current[idx] = el)}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleOptionImageUpload(e.target.files[0], idx);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => optionFileRefs.current[idx]?.click()}
                          disabled={isUploadingThisOpt}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                          title="Attach option picture"
                        >
                          {isUploadingThisOpt ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer shrink-0"
                            title="Remove option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Option Image Preview if attached */}
                      {opt.image && (
                        <div className="ml-8 flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={opt.image}
                              alt={`Option ${letter}`}
                              className="w-8 h-8 object-contain rounded border border-slate-200 dark:border-slate-700 bg-white"
                            />
                            <span className="text-[10px] text-slate-400 truncate font-mono">
                              {opt.image}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOptionImageChange(idx, '')}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                            title="Remove option picture"
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


          {/* Numerical Range for NAT */}
          {questionType === 'NAT' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-800/80 space-y-3">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Accepted Numerical Value or Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Exact Value / Min Range:</span>
                  <input
                    type="number"
                    step="any"
                    value={natMin}
                    onChange={(e) => setNatMin(e.target.value)}
                    placeholder="e.g. 42 or 3.14"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Max Range (Optional):</span>
                  <input
                    type="number"
                    step="any"
                    value={natMax}
                    onChange={(e) => setNatMax(e.target.value)}
                    placeholder="Leave blank for exact"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pedagogical Explanation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Pedagogical Explanation & Hint (shown during review)</span>
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain the step-by-step logic, theorems, or formulas used to reach the answer..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#162030] cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEdit ? 'Save Changes' : 'Add to Question Bank'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
