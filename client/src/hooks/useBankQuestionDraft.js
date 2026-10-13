import { useEffect, useRef, useCallback } from 'react';

export default function useBankQuestionDraft({
  isEdit,
  user,
  formData,
  formSetters
}) {
  const {
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
  } = formData;

  const {
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
  } = formSetters;

  const isInitialBankMount = useRef(true);
  const bankQDraftRef = useRef(null);

  bankQDraftRef.current = {
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
  };

  const saveBankQDraft = useCallback(() => {
    if (isEdit) return;
    const d = bankQDraftRef.current;
    if (!d) return;
    const hasContent = Boolean(
      (d.questionText && d.questionText.trim()) ||
      (d.imageAttachment && d.imageAttachment.trim()) ||
      (d.explanation && d.explanation.trim()) ||
      (Array.isArray(d.options) && d.options.some((o) => o.text && o.text.trim()))
    );
    const uId = user?._id || 'guest';
    const key = `pmt_draft_bank_question_${uId}`;
    if (!hasContent) {
      try {
        localStorage.removeItem(key);
        localStorage.removeItem('pmt_draft_bank_question');
      } catch (e) {}
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(d));
    } catch (e) {}
  }, [isEdit, user?._id]);

  const clearBankQDraft = useCallback(() => {
    if (isEdit) return;
    const uId = user?._id || 'guest';
    try {
      localStorage.removeItem(`pmt_draft_bank_question_${uId}`);
      localStorage.removeItem('pmt_draft_bank_question');
    } catch (e) {}
  }, [isEdit, user?._id]);

  // Restore draft on open if not editing existing question
  useEffect(() => {
    if (isEdit) return;
    try {
      const uId = user?._id || 'guest';
      const saved =
        localStorage.getItem(`pmt_draft_bank_question_${uId}`) ||
        localStorage.getItem('pmt_draft_bank_question');
      if (saved) {
        const q = JSON.parse(saved);
        if (q.questionText || (Array.isArray(q.options) && q.options.some((o) => o.text))) {
          if (q.stream !== undefined) setStream(q.stream);
          if (Array.isArray(q.tags)) setTags(q.tags);
          if (q.questionText !== undefined) setQuestionText(q.questionText);
          if (q.questionType !== undefined) setQuestionType(q.questionType);
          if (q.imageAttachment !== undefined) setImageAttachment(q.imageAttachment);
          if (Array.isArray(q.options)) setOptions(q.options);
          if (Array.isArray(q.correctAnswers)) setCorrectAnswers(q.correctAnswers);
          if (q.natMin !== undefined) setNatMin(q.natMin);
          if (q.natMax !== undefined) setNatMax(q.natMax);
          if (q.explanation !== undefined) setExplanation(q.explanation);
        }
      }
    } catch (e) {
      console.warn('Failed to restore bank question draft:', e);
    }
  }, [isEdit, user?._id, setStream, setTags, setQuestionText, setQuestionType, setImageAttachment, setOptions, setCorrectAnswers, setNatMin, setNatMax, setExplanation]);

  // Auto-save on every change
  useEffect(() => {
    if (isEdit) return;
    if (isInitialBankMount.current) {
      isInitialBankMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveBankQDraft();
    }, 400);
    return () => clearTimeout(timer);
  }, [
    isEdit,
    stream,
    tags,
    questionText,
    questionType,
    imageAttachment,
    options,
    correctAnswers,
    natMin,
    natMax,
    explanation,
    saveBankQDraft
  ]);

  // Save on unload / unmount
  useEffect(() => {
    if (isEdit) return;
    const handleUnload = () => saveBankQDraft();
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      saveBankQDraft();
    };
  }, [isEdit, saveBankQDraft]);

  return { saveBankQDraft, clearBankQDraft };
}
