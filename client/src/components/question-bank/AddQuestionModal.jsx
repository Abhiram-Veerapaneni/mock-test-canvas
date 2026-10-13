import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/useAuthStore';
import useBankQuestionDraft from '../../hooks/useBankQuestionDraft';
import BankQuestionMetaFields from './BankQuestionMetaFields';
import BankQuestionStatementEditor from './BankQuestionStatementEditor';
import BankQuestionOptionsEditor from './BankQuestionOptionsEditor';
import {
  X,
  Loader2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function AddQuestionModal({
  isOpen,
  questionToEdit = null,
  onClose,
  onSuccess
}) {
  const { user } = useAuthStore();
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
  const diagramFileRef = useRef(null);
  const optionFileRefs = useRef([]);
  const [isUploadingDiagram, setIsUploadingDiagram] = useState(false);
  const [uploadingOptIndex, setUploadingOptIndex] = useState(null);

  // Auto-save in-progress bank question draft to local storage
  const { clearBankQDraft } = useBankQuestionDraft({
    isEdit,
    user,
    formData: {
      stream,
      tags,
      questionText,
      questionType,
      imageAttachment,
      options,
      correctAnswers,
      natMin,
      natMax,
      explanation
    },
    formSetters: {
      setStream,
      setTags,
      setQuestionText,
      setQuestionType,
      setImageAttachment,
      setOptions,
      setCorrectAnswers,
      setNatMin,
      setNatMax,
      setExplanation
    }
  });

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
        clearBankQDraft();
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

  if (!isOpen) return null;

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
          <BankQuestionMetaFields
            stream={stream}
            onStreamChange={setStream}
            streamSuggestions={streamSuggestions}
            questionType={questionType}
            onQuestionTypeChange={(newType) => {
              setQuestionType(newType);
              if (newType === 'MCQ') setCorrectAnswers([0]);
              else if (newType === 'MSQ') setCorrectAnswers([0]);
              else if (newType === 'NAT') setCorrectAnswers([]);
            }}
            tags={tags}
            tagInput={tagInput}
            onTagInputChange={setTagInput}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />

          {/* Statement Editor with Live KaTeX Preview & Diagram Upload */}
          <BankQuestionStatementEditor
            questionText={questionText}
            onQuestionTextChange={setQuestionText}
            previewMode={previewMode}
            imageAttachment={imageAttachment}
            onImageAttachmentChange={setImageAttachment}
            isUploadingDiagram={isUploadingDiagram}
            onDiagramUpload={handleDiagramUpload}
            diagramFileRef={diagramFileRef}
          />

          {/* Options for MCQ / MSQ or NAT numerical range */}
          <BankQuestionOptionsEditor
            questionType={questionType}
            options={options}
            correctAnswers={correctAnswers}
            onToggleCorrectAnswer={toggleCorrectAnswer}
            onOptionTextChange={handleOptionTextChange}
            onAddOption={handleAddOption}
            onRemoveOption={handleRemoveOption}
            onOptionImageUpload={handleOptionImageUpload}
            onOptionImageChange={handleOptionImageChange}
            uploadingOptIndex={uploadingOptIndex}
            optionFileRefs={optionFileRefs}
            natMin={natMin}
            onNatMinChange={setNatMin}
            natMax={natMax}
            onNatMaxChange={setNatMax}
          />

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
