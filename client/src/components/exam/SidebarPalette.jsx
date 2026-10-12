import React from 'react';
import { User, CheckCircle2 } from 'lucide-react';

export default function SidebarPalette({
  candidateName = 'Candidate',
  questions = [],
  activeQuestionIndex,
  onSelectQuestion,
  userResponses = {},
  sectionName = 'Section'
}) {
  const getQuestionStatus = (question, index) => {
    const qId = question._id || index;
    const response = userResponses[qId];
    const isCurrent = index === activeQuestionIndex;

    const hasValue = response && (Array.isArray(response.value) ? response.value.length > 0 : !!response.value);

    // Rule 4: Answered & Review -> Purple with green tick
    if (response?.isMarkedForReview && hasValue) {
      return 'ANSWERED_AND_MARKED';
    } else if (response?.isMarkedForReview) {
      // Rule 3: Review -> Purple
      return 'MARKED_FOR_REVIEW';
    } else if (hasValue) {
      // Rule 5: Answered -> Green
      return 'ANSWERED';
    } else if (isCurrent && !hasValue) {
      // Rule 1: Selected question not yet answered -> Blue
      return 'CURRENT_UNANSWERED';
    } else if (response?.visited) {
      // Rule 2: Left without answering -> Red
      return 'NOT_ANSWERED';
    }

    return isCurrent ? 'CURRENT_UNANSWERED' : 'NOT_VISITED';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'CURRENT_UNANSWERED': return 'jee-badge-current-unanswered';
      case 'ANSWERED': return 'jee-badge-answered';
      case 'NOT_ANSWERED': return 'jee-badge-not-answered';
      case 'MARKED_FOR_REVIEW': return 'jee-badge-review';
      case 'ANSWERED_AND_MARKED': return 'jee-badge-ans-review';
      case 'NOT_VISITED':
      default: return 'jee-badge-not-visited';
    }
  };

  const counts = questions.reduce(
    (acc, q, idx) => {
      const status = getQuestionStatus(q, idx);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { CURRENT_UNANSWERED: 0, ANSWERED: 0, NOT_ANSWERED: 0, MARKED_FOR_REVIEW: 0, ANSWERED_AND_MARKED: 0, NOT_VISITED: 0 }
  );

  return (
    <aside className="jee-sidebar-palette">
      {/* Candidate Card */}
      <div className="jee-user-card">
        <div className="jee-user-avatar">
          {candidateName ? candidateName.charAt(0).toUpperCase() : 'C'}
        </div>
        <div>
          <div className="jee-user-name">{candidateName}</div>
          <div className="jee-user-status">Verified Session</div>
        </div>
      </div>

      {/* Palette Legend Box */}
      <div className="jee-legend-box">
        <div className="jee-legend-title">Question Palette Legend</div>
        <div className="jee-legend-grid">
          <div className="jee-legend-item">
            <div className="jee-legend-badge jee-badge-current-unanswered">{counts.CURRENT_UNANSWERED}</div>
            <span>Selected (Unans)</span>
          </div>

          <div className="jee-legend-item">
            <div className="jee-legend-badge jee-badge-not-answered">{counts.NOT_ANSWERED}</div>
            <span>Not Answered</span>
          </div>

          <div className="jee-legend-item">
            <div className="jee-legend-badge jee-badge-answered">{counts.ANSWERED}</div>
            <span>Answered</span>
          </div>

          <div className="jee-legend-item">
            <div className="jee-legend-badge jee-badge-review">{counts.MARKED_FOR_REVIEW}</div>
            <span>Marked Review</span>
          </div>

          <div className="jee-legend-item">
            <div className="jee-legend-badge jee-badge-ans-review">{counts.ANSWERED_AND_MARKED}</div>
            <span>Ans & Review</span>
          </div>

          <div className="jee-legend-item">
            <div className="jee-legend-badge jee-badge-not-visited">{counts.NOT_VISITED}</div>
            <span>Not Visited</span>
          </div>
        </div>
      </div>

      {/* Question Grid */}
      <div className="jee-grid-container">
        <div className="jee-grid-title">
          <span>{sectionName} QUESTIONS</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Total: {questions.length}</span>
        </div>

        <div className="jee-q-grid">
          {questions.map((q, idx) => {
            const status = getQuestionStatus(q, idx);
            const isActive = idx === activeQuestionIndex;
            const badgeClass = getStatusClass(status);

            return (
              <button
                key={q._id || idx}
                onClick={() => onSelectQuestion(idx)}
                className={`jee-grid-btn ${badgeClass} ${isActive ? 'active' : ''}`}
                title={`Question ${idx + 1}: ${status.replace(/_/g, ' ')}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
