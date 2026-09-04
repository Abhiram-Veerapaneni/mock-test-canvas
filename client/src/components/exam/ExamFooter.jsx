import React from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Send } from 'lucide-react';

export default function ExamFooter({
  onMarkForReviewAndNext,
  onClearResponse,
  onSaveAndNext,
  onSubmitExam,
  onPreviousQuestion,
  isFirstQuestion,
  isLastQuestion
}) {
  return (
    <div className="jee-footer-bar">
      {/* Left Action Buttons */}
      <div className="jee-footer-left">
        <button
          onClick={onPreviousQuestion}
          disabled={isFirstQuestion}
          className="jee-btn-footer jee-btn-prev"
          style={{ opacity: isFirstQuestion ? 0.4 : 1, cursor: isFirstQuestion ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <button
          onClick={onMarkForReviewAndNext}
          className="jee-btn-footer jee-btn-review"
        >
          <Bookmark size={16} />
          <span>Mark for Review & Next</span>
        </button>
      </div>

      {/* Right Action Buttons */}
      <div className="jee-footer-right">
        <button
          onClick={onClearResponse}
          className="jee-btn-footer jee-btn-clear"
        >
          <span>Clear Response</span>
        </button>

        <button
          onClick={onSaveAndNext}
          className="jee-btn-footer jee-btn-save"
        >
          <span>Save & Next</span>
          <ChevronRight size={16} />
        </button>

        <button
          onClick={onSubmitExam}
          className="jee-btn-footer jee-btn-submit"
        >
          <Send size={16} />
          <span>Submit Exam</span>
        </button>
      </div>
    </div>
  );
}
