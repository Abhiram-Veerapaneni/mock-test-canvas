import React, { useState, useRef, useEffect, useCallback } from 'react';
import MathRenderer from '../common/MathRenderer';
import api from '../../services/api';
import useAuthStore from '../../store/useAuthStore';
import useManualQuestionDraft from '../../hooks/useManualQuestionDraft';
import QuestionMetaFields from './QuestionMetaFields';
import QuestionStatementEditor from './QuestionStatementEditor';
import QuestionOptionsEditor from './QuestionOptionsEditor';
import QuestionExplanationEditor from './QuestionExplanationEditor';
import {
  Plus,
  Eye,
  Edit3,
  AlertCircle,
  Database
} from 'lucide-react';

export default function ManualQuestionForm({
  onAddQuestion,
  examId = 'draft',
  examTitle = 'exam',
  defaultContributeToBank = false
}) {
  const { user } = useAuthStore();
  const [contributeToBank, setContributeToBank] = useState(defaultContributeToBank);
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

  // Auto-save & draft restoration hook
  const { clearQDraft } = useManualQuestionDraft({
    user,
    formData: {
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
    },
    formSetters: {
      setQuestionText,
      setQuestionType,
      setImageAttachment,
      setSubject,
      setTopic,
      setStream,
      setTags,
      setOptions,
      setCorrectAnswers,
      setNatMin,
      setNatMax,
      setExplanation
    }
  });

  // Sync defaultContributeToBank prop
  useEffect(() => {
    setContributeToBank(defaultContributeToBank);
  }, [defaultContributeToBank]);

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
      explanation: explanation.trim(),
      contributeToBank,
      isInBank: contributeToBank
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

    clearQDraft();
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
        <div className="p-3 rounded-lg bg-white dark:bg-[#131926] border-l-4 border-l-rose-600 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-medium text-slate-900 dark:text-slate-100">{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmitQuestion} className="space-y-4">
        {/* Question Type, Subject, Topic, Stream & Tags */}
        <QuestionMetaFields
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

        {/* Statement with Split/Preview Tabs & Picture Attachment */}
        <QuestionStatementEditor
          questionText={questionText}
          onQuestionTextChange={setQuestionText}
          imageAttachment={imageAttachment}
          onRemoveImageAttachment={() => setImageAttachment('')}
          previewMode={previewMode}
          onPreviewModeChange={setPreviewMode}
          isUploadingQuestionImg={isUploadingQuestionImg}
          onQuestionImageUpload={handleQuestionImageUpload}
          questionFileRef={questionFileRef}
        />

        {/* Options Builder or NAT Range */}
        <QuestionOptionsEditor
          questionType={questionType}
          options={options}
          correctAnswers={correctAnswers}
          onOptionTextChange={handleOptionTextChange}
          onCorrectMcqChange={handleCorrectMcqChange}
          onCorrectMsqToggle={handleCorrectMsqToggle}
          onAddOption={handleAddOption}
          onRemoveOption={handleRemoveOption}
          onOptionImageUpload={handleOptionImageUpload}
          onRemoveOptionImage={handleRemoveOptionImage}
          uploadingOptIndex={uploadingOptIndex}
          optionFileRefs={optionFileRefs}
          natMin={natMin}
          setNatMin={setNatMin}
          natMax={natMax}
          setNatMax={setNatMax}
        />

        {/* Collapsible Accordion for Pedagogical Solution / Explanation */}
        <QuestionExplanationEditor
          isExplanationOpen={isExplanationOpen}
          setIsExplanationOpen={setIsExplanationOpen}
          explanation={explanation}
          onExplanationChange={setExplanation}
        />

        {/* Sticky Action Bar for "Add to Question Paper" */}
        <div className="sticky bottom-0 pt-3 pb-1 bg-white/95 dark:bg-[#131926]/95 backdrop-blur-sm border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {questionType} · {subject}
            </span>
            <label className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors">
              <input
                type="checkbox"
                checked={contributeToBank}
                onChange={(e) => setContributeToBank(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-0 cursor-pointer accent-indigo-600"
              />
              <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Contribute to Bank</span>
            </label>
          </div>
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
