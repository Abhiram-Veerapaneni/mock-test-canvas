import React from 'react';
import AIDropzoneCard from './AIDropzoneCard';
import ManualQuestionForm from './ManualQuestionForm';
import QuestionListSection from './QuestionListSection';

export default function QuestionsStudioTab({
  isDropzoneExpanded,
  setIsDropzoneExpanded,
  isIngesting,
  ingestionStep,
  ingestionError,
  dragActive,
  setDragActive,
  fileInputRef,
  onFileUpload,
  onFileDrop,
  onAddQuestion,
  questions,
  correctMark,
  incorrectMark,
  showAnswerKey,
  setShowAnswerKey,
  onMoveUp,
  onMoveDown,
  onEdit,
  onRemove,
  onToggleContribute,
  onToggleContributeAll,
  onPreviewImage,
  examId,
  examTitle,
  contributeAllToBank,
  setSuccessMsg,
}) {
  return (
    <div className="space-y-6">
      <AIDropzoneCard
        isDropzoneExpanded={isDropzoneExpanded}
        setIsDropzoneExpanded={setIsDropzoneExpanded}
        isIngesting={isIngesting}
        ingestionStep={ingestionStep}
        ingestionError={ingestionError}
        dragActive={dragActive}
        setDragActive={setDragActive}
        fileInputRef={fileInputRef}
        onFileUpload={onFileUpload}
        onFileDrop={onFileDrop}
        onLoadSampleQuestion={() => {
          onAddQuestion({
            questionText: "A particle moves along the x-axis such that its position is given by $x(t) = 3t^2 - 12t + 9$. At what time $t$ does the particle momentarily come to rest?",
            questionType: "MCQ",
            subject: "Physics",
            topic: "Kinematics",
            difficulty: "Medium",
            options: [
              { text: "$t = 1\\text{ s}$", image: "" },
              { text: "$t = 2\\text{ s}$", image: "" },
              { text: "$t = 3\\text{ s}$", image: "" },
              { text: "$t = 4\\text{ s}$", image: "" }
            ],
            correctAnswers: [1],
            marks: correctMark,
            negativeMarks: incorrectMark,
            explanation: "The velocity is the derivative of position: $v(t) = \\frac{dx}{dt} = 6t - 12$. Setting $v(t) = 0 \\implies 6t = 12 \\implies t = 2\\text{ s}$."
          });
          setSuccessMsg('Sample competitive exam question loaded into paper!');
          setTimeout(() => setSuccessMsg(''), 3000);
        }}
      />

      <ManualQuestionForm
        onAddQuestion={onAddQuestion}
        examId={examId}
        examTitle={examTitle}
        defaultContributeToBank={contributeAllToBank}
      />

      <QuestionListSection
        questions={questions}
        correctMark={correctMark}
        incorrectMark={incorrectMark}
        showAnswerKey={showAnswerKey}
        setShowAnswerKey={setShowAnswerKey}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onEdit={onEdit}
        onRemove={onRemove}
        onToggleContribute={onToggleContribute}
        onToggleContributeAll={onToggleContributeAll}
        onPreviewImage={onPreviewImage}
      />
    </div>
  );
}

