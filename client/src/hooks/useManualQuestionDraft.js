import { useEffect, useRef, useCallback } from 'react';

export default function useManualQuestionDraft({
  user,
  formData,
  formSetters
}) {
  const {
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
  } = formData;

  const {
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
  } = formSetters;

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

  const clearQDraft = useCallback(() => {
    const uId = user?._id || 'guest';
    try {
      localStorage.removeItem(`pmt_draft_manual_question_${uId}`);
      localStorage.removeItem('pmt_draft_manual_question');
    } catch (e) {}
  }, [user?._id]);

  // Restore on mount from local storage
  useEffect(() => {
    try {
      const uId = user?._id || 'guest';
      const saved =
        localStorage.getItem(`pmt_draft_manual_question_${uId}`) ||
        localStorage.getItem('pmt_draft_manual_question');
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
  }, [user?._id, setQuestionText, setQuestionType, setImageAttachment, setSubject, setTopic, setStream, setTags, setOptions, setCorrectAnswers, setNatMin, setNatMax, setExplanation]);

  // Save on change (debounced)
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

  return { saveQDraft, clearQDraft };
}
