import React from 'react';
import ExamQuestionsTab from './ExamQuestionsTab';
import ExamProctoringTab from './ExamProctoringTab';
import ExamAttemptsTab from './ExamAttemptsTab';
import { Eye, EyeOff, Lock, Edit3 } from 'lucide-react';

export default function ExamDetailTabs({
  isCreator,
  activeTab,
  setActiveTab,
  questions,
  exam,
  examId,
  attempts,
  showAnswerKey,
  onToggleAnswerKey,
  revealedQuestions,
  onToggleQuestionReveal,
  onPreviewImage,
  bestAttempt,
  canViewResponses,
  isReviewLockedBySchedule,
  onLockForPractice,
  navigate,
}) {
  if (!isCreator) {
    return (
      <section className="space-y-6">
        <ExamAttemptsTab
          attempts={attempts}
          exam={exam}
          examId={examId}
          isCreator={false}
          bestAttempt={bestAttempt}
          canViewResponses={canViewResponses}
          isReviewLockedBySchedule={isReviewLockedBySchedule}
          navigate={navigate}
        />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 gap-6 overflow-x-auto">
        <div className="flex items-center gap-6 h-10">
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`h-full flex items-center text-xs tracking-tight transition-colors border-b-2 -mb-[1px] cursor-pointer ${
              activeTab === 'questions'
                ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-slate-100 font-medium'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
            }`}
          >
            <span>Questions & Answer Key ({questions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('proctoring')}
            className={`h-full flex items-center text-xs tracking-tight transition-colors border-b-2 -mb-[1px] cursor-pointer ${
              activeTab === 'proctoring'
                ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-slate-100 font-medium'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
            }`}
          >
            <span>Proctoring Security Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attempts')}
            className={`h-full flex items-center text-xs tracking-tight transition-colors border-b-2 -mb-[1px] cursor-pointer ${
              activeTab === 'attempts'
                ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-slate-100 font-medium'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
            }`}
          >
            <span>Attempt History ({attempts.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Answer Key Toggle */}
          <button
            type="button"
            onClick={onToggleAnswerKey}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
              showAnswerKey
                ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 font-medium'
                : 'bg-white dark:bg-[#131926] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            title={
              showAnswerKey
                ? 'Hide answers for unassisted self-testing'
                : 'Display answer key and solutions'
            }
          >
            {showAnswerKey ? (
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>
              {showAnswerKey ? 'Hide Answer Key' : 'Show Answer Key'}
            </span>
          </button>

          {exam.isGenerated && (
            <button
              type="button"
              onClick={onLockForPractice}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors cursor-pointer"
              title="Re-lock questions to take practice test without answer spoilers"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock for Practice</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(`/create-test?examId=${examId}`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Modify in Studio</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Questions & Answer Key */}
      {activeTab === 'questions' && (
        <ExamQuestionsTab
          questions={questions}
          exam={exam}
          examId={examId}
          showAnswerKey={showAnswerKey}
          revealedQuestions={revealedQuestions}
          onToggleQuestionReveal={onToggleQuestionReveal}
          onPreviewImage={onPreviewImage}
          navigate={navigate}
        />
      )}

      {/* TAB 2: Proctoring Security Rules */}
      {activeTab === 'proctoring' && (
        <ExamProctoringTab exam={exam} />
      )}

      {/* TAB 3: Attempts & Performance */}
      {activeTab === 'attempts' && (
        <ExamAttemptsTab
          attempts={attempts}
          exam={exam}
          examId={examId}
          isCreator={true}
          bestAttempt={bestAttempt}
          canViewResponses={canViewResponses}
          isReviewLockedBySchedule={isReviewLockedBySchedule}
          navigate={navigate}
        />
      )}
    </section>
  );
}

