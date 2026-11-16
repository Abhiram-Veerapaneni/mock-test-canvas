import React from 'react';
import ManualQuestionForm from './ManualQuestionForm';
import QuestionListSection from './QuestionListSection';
import { Database, BookOpen } from 'lucide-react';

export default function QuestionsStudioTab({
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
  onOpenQuestionBank
}) {
  return (
    <div className="space-y-6">
      {/* Quick Action Bar: Bank Import & Sample Template */}
      <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Questions &amp; Content Studio
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Author questions with LaTeX equations, import verified items from Question Bank, or load sample templates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenQuestionBank && (
            <button
              type="button"
              onClick={onOpenQuestionBank}
              className="px-3 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Import verified questions directly from Question Bank"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Import from Bank</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
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
              if (setSuccessMsg) {
                setSuccessMsg('Sample competitive exam question loaded into paper!');
                setTimeout(() => setSuccessMsg(''), 3000);
              }
            }}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
            title="Insert a sample JEE/NEET KaTeX question"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Load Sample Question</span>
          </button>
        </div>
      </div>

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
        onOpenQuestionBank={onOpenQuestionBank}
      />
    </div>
  );
}
