export default function useTestCreationQuestions({
  questions,
  setQuestions,
  contributeAllToBank,
  setContributeAllToBank,
  setHasUnsavedChanges,
  hasUnsavedChangesRef,
  setSuccessMsg,
  saveDraftToStorage,
  draftDataRef,
}) {
  const handleAddQuestion = (newQuestion) => {
    const formatted = {
      ...newQuestion,
      contributeToBank: newQuestion.contributeToBank !== undefined ? newQuestion.contributeToBank : contributeAllToBank,
      isInBank: newQuestion.isInBank !== undefined ? newQuestion.isInBank : contributeAllToBank
    };
    const updated = [...questions, formatted];
    setQuestions(updated);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    setSuccessMsg(`Question #${updated.length} added.`);
    saveDraftToStorage({ ...draftDataRef.current, questions: updated, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  const handleRemoveQuestion = (index) => {
    const updated = questions.filter((_, idx) => idx !== index);
    setQuestions(updated);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    saveDraftToStorage({ ...draftDataRef.current, questions: updated, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  const handleMoveQuestionUp = (index) => {
    if (index <= 0) return;
    const copy = [...questions];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    setQuestions(copy);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    saveDraftToStorage({ ...draftDataRef.current, questions: copy, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  const handleMoveQuestionDown = (index) => {
    if (index >= questions.length - 1) return;
    const copy = [...questions];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    setQuestions(copy);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    saveDraftToStorage({ ...draftDataRef.current, questions: copy, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  const handleUpdateQuestion = (index, updatedQ) => {
    const copy = [...questions];
    copy[index] = updatedQ;
    setQuestions(copy);
    const allChecked = copy.length > 0 && copy.every((q) => Boolean(q.contributeToBank !== undefined ? q.contributeToBank : q.isInBank));
    setContributeAllToBank(allChecked);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    setSuccessMsg(`Question #${index + 1} updated successfully.`);
    saveDraftToStorage({ ...draftDataRef.current, questions: copy, contributeAllToBank: allChecked, hasUnsavedChanges: true, isSyncedWithServer: false });
  };

  const handleToggleContribute = (idx, checked) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], contributeToBank: checked, isInBank: checked };
    setQuestions(updated);
    const allChecked = updated.length > 0 && updated.every((q) => Boolean(q.contributeToBank !== undefined ? q.contributeToBank : q.isInBank));
    setContributeAllToBank(allChecked);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    saveDraftToStorage({
      ...draftDataRef.current,
      contributeAllToBank: allChecked,
      questions: updated,
      hasUnsavedChanges: true,
      isSyncedWithServer: false
    });
  };

  const handleToggleContributeAll = (checked) => {
    setContributeAllToBank(checked);
    const updated = questions.map((q) => ({
      ...q,
      contributeToBank: checked,
      isInBank: checked
    }));
    setQuestions(updated);
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
    saveDraftToStorage({
      ...draftDataRef.current,
      contributeAllToBank: checked,
      questions: updated,
      hasUnsavedChanges: true,
      isSyncedWithServer: false
    });
    setSuccessMsg(
      checked
        ? `Marked all ${questions.length} questions to be contributed to the Question Bank!`
        : `Removed Question Bank contribution flag from all questions.`
    );
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return {
    handleAddQuestion,
    handleRemoveQuestion,
    handleMoveQuestionUp,
    handleMoveQuestionDown,
    handleUpdateQuestion,
    handleToggleContribute,
    handleToggleContributeAll,
  };
}

