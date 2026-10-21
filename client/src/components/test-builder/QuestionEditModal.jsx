import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import EditQuestionMetaFields from './EditQuestionMetaFields';
import EditQuestionStatementEditor from './EditQuestionStatementEditor';
import EditQuestionOptionsEditor from './EditQuestionOptionsEditor';
import { X, AlertCircle, Check, Database } from 'lucide-react';

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
  const [contributeToBank, setContributeToBank] = useState(
    Boolean(question.contributeToBank !== undefined ? question.contributeToBank : question.isInBank)
  );
  const [questionType, setQuestionType] = useState(question.questionType || 'MCQ');
  const [imageAttachment, setImageAttachment] = useState(question.imageAttachment || '');
  const [subject, setSubject] = useState(question.subject || 'Mathematics');
  const [topic, setTopic] = useState(question.topic || '');
  const [stream, setStream] = useState(question.stream || question.subject || 'Mathematics');
  const [tags, setTags] = useState(
    Array.isArray(question.tags) ? question.tags : (question.topic && question.topic !== 'General' ? [question.topic] : [])
  );
  const [tagInput, setTagInput] = useState('');
  const [streamSuggestions, setStreamSuggestions] = useState([]);

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

  const handleRemoveTag = (tg) => {
    setTags(tags.filter((item) => item !== tg));
  };

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

    const cleanStream = stream.trim() || subject.trim() || 'General';
    const cleanTags = tags.length > 0 ? tags : (topic.trim() ? [topic.trim()] : []);

    const updatedQuestion = {
      ...question,
      questionText: questionText.trim(),
      questionType,
      imageAttachment: imageAttachment.trim(),
      subject: cleanStream,
      topic: cleanTags.length > 0 ? cleanTags[0] : (topic.trim() || 'General'),
      stream: cleanStream,
      tags: cleanTags,
      options: questionType === 'NAT' ? [] : options.map((o) => ({
        text: o.text.trim(),
        image: o.image || ''
      })),
      correctAnswers: finalCorrectAnswers,
      explanation: explanation.trim(),
      contributeToBank,
      isInBank: contributeToBank,
      isEdited: isPublishedExam ? true : Boolean(question.isEdited),
      editedAt: isPublishedExam ? new Date() : question.editedAt
    };

    onSave(questionIndex, updatedQuestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="max-w-4xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg shadow-sm overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-[#F8FAFC] dark:bg-[#0C0F17] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-semibold text-xs tabular-nums">
              #{questionIndex + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                  Edit Question Item
                </h2>
                {isPublishedExam && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    (Tagged Edited)
                  </span>
                )}
                {question.isEdited && !isPublishedExam && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    (Edited)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Modify statement, replace KaTeX formulas, or update attached pictures &amp; options.
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
            <div className="p-3 rounded-lg bg-white dark:bg-[#131926] border-l-4 border-l-rose-600 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="font-medium text-slate-900 dark:text-slate-100">{validationError}</span>
            </div>
          )}

          <form id="edit-question-form" onSubmit={handleSaveQuestion} className="space-y-5">
            <EditQuestionMetaFields
              questionType={questionType}
              onQuestionTypeChange={handleQuestionTypeChange}
              subject={subject}
              onSubjectChange={setSubject}
              topic={topic}
              onTopicChange={setTopic}
              stream={stream}
              onStreamChange={setStream}
              streamSuggestions={streamSuggestions}
              tags={tags}
              tagInput={tagInput}
              onTagInputChange={setTagInput}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />

            <EditQuestionStatementEditor
              questionText={questionText}
              onQuestionTextChange={setQuestionText}
              imageAttachment={imageAttachment}
              onRemoveImageAttachment={() => setImageAttachment('')}
              previewMode={previewMode}
              isUploadingQuestionImg={isUploadingQuestionImg}
              questionFileRef={questionFileRef}
              onQuestionImageUpload={handleQuestionImageUpload}
            />

            <EditQuestionOptionsEditor
              questionType={questionType}
              options={options}
              onAddOption={handleAddOption}
              onRemoveOption={handleRemoveOption}
              onOptionTextChange={handleOptionTextChange}
              onRemoveOptionImage={handleRemoveOptionImage}
              correctAnswers={correctAnswers}
              onCorrectMcqChange={handleCorrectMcqChange}
              onCorrectMsqToggle={handleCorrectMsqToggle}
              optionFileRefs={optionFileRefs}
              uploadingOptIndex={uploadingOptIndex}
              onOptionImageUpload={handleOptionImageUpload}
              natMin={natMin}
              setNatMin={setNatMin}
              natMax={natMax}
              setNatMax={setNatMax}
            />

            {/* Explanation */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Pedagogical Solution / Explanation (LaTeX supported)
              </label>
              <textarea
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Step-by-step solution shown after candidate completes assessment..."
                className="w-full p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 leading-relaxed"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-[#F8FAFC] dark:bg-[#0C0F17] shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-1.5 px-3.5"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors">
              <input
                type="checkbox"
                checked={contributeToBank}
                onChange={(e) => setContributeToBank(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-0 cursor-pointer accent-indigo-600"
              />
              <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Contribute to Bank</span>
            </label>

            <button
              type="submit"
              form="edit-question-form"
              className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Question Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
