import React from 'react';
import LatexRenderer from '../LatexRenderer';
import McqInput from './inputs/McqInput';
import MsqInput from './inputs/MsqInput';
import NatInput from './inputs/NatInput';
import { Award, RefreshCw } from 'lucide-react';

export default function QuestionWindow({
  questionNumber,
  totalQuestionsInSection,
  sectionName,
  question,
  userResponse,
  onChangeResponse,
  onClearResponse
}) {
  if (!question) {
    return (
      <div className="jee-question-canvas" style={{ alignItems: 'center', justifyCenter: 'center' }}>
        No question selected.
      </div>
    );
  }

  const { questionType, contentLaTeX, options, positiveMarks = 4, negativeMarks = 1 } = question;

  const getTypeLabel = () => {
    switch (questionType) {
      case 'MCQ': return 'Single Choice Correct (MCQ)';
      case 'MSQ': return 'Multiple Choice Correct (MSQ)';
      case 'NUMERICAL':
      case 'NAT': return 'Numerical Answer Type (NAT)';
      default: return questionType;
    }
  };

  return (
    <div className="jee-question-canvas">
      {/* Question Info Bar */}
      <div className="jee-question-meta-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span className="jee-q-num">Question {questionNumber}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--jee-text-secondary)', fontWeight: 600 }}>
            of {totalQuestionsInSection} in <strong>{sectionName}</strong>
          </span>
          <span className="jee-q-type-badge">{getTypeLabel()}</span>
        </div>

        <div className="jee-marking-badge">
          <Award size={18} color="#f59e0b" />
          <span className="jee-mark-pos">+{positiveMarks} Marks</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span className="jee-mark-neg">-{negativeMarks} Negative</span>
        </div>
      </div>

      {/* Question Statement Box */}
      <div className="jee-question-box">
        <LatexRenderer content={contentLaTeX} />
      </div>

      {/* Dynamic Input Component */}
      <div>
        {questionType === 'MCQ' && (
          <McqInput
            options={options}
            selectedOption={userResponse?.value || ''}
            onSelectOption={(val) => onChangeResponse(val)}
          />
        )}

        {questionType === 'MSQ' && (
          <MsqInput
            options={options}
            selectedOptions={userResponse?.value || []}
            onToggleOption={(optId) => {
              const currentVals = Array.isArray(userResponse?.value) ? [...userResponse.value] : [];
              const updated = currentVals.includes(optId)
                ? currentVals.filter((id) => id !== optId)
                : [...currentVals, optId];
              onChangeResponse(updated);
            }}
          />
        )}

        {(questionType === 'NUMERICAL' || questionType === 'NAT') && (
          <NatInput
            value={userResponse?.value || ''}
            onChangeValue={(val) => onChangeResponse(val)}
          />
        )}
      </div>

      {/* Clear Response Button */}
      {userResponse?.value && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClearResponse}
            className="jee-btn-footer jee-btn-clear"
          >
            <RefreshCw size={14} />
            <span>Clear Response</span>
          </button>
        </div>
      )}
    </div>
  );
}
