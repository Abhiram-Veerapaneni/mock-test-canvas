import React from 'react';
import { Send } from 'lucide-react';

export default function ExamSubmitModal({
  isOpen,
  onClose,
  examTitle,
  submissionSummary,
  onConfirmSubmit,
  submitting
}) {
  if (!isOpen) return null;

  return (
    <div className="jee-modal-overlay">
      <div className="jee-modal-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '2px solid var(--jee-border-card)',
            paddingBottom: '12px',
            marginBottom: '16px'
          }}
        >
          <Send size={22} color="#16a34a" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--jee-text-primary)' }}>
            Confirm Exam Submission
          </h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--jee-text-secondary)', marginBottom: '16px' }}>
          Are you sure you want to submit <strong>{examTitle}</strong>? Here is your response summary:
        </p>

        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
          <table
            style={{
              width: '100%',
              fontSize: '0.8rem',
              textAlign: 'left',
              borderCollapse: 'collapse',
              border: '1px solid var(--jee-border-card)'
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--jee-sidebar-bg)',
                  color: 'var(--jee-text-muted)',
                  fontWeight: 800
                }}
              >
                <th style={{ padding: '10px' }}>Section</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Total</th>
                <th style={{ padding: '10px', textAlign: 'center', color: '#16a34a' }}>Answered</th>
                <th style={{ padding: '10px', textAlign: 'center', color: '#dc2626' }}>Unanswered</th>
                <th style={{ padding: '10px', textAlign: 'center', color: '#9333ea' }}>Marked</th>
              </tr>
            </thead>
            <tbody>
              {(submissionSummary || []).map((sec, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid var(--jee-border-card)', fontWeight: 700 }}>
                  <td style={{ padding: '10px', color: 'var(--jee-text-primary)' }}>{sec.sectionName}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{sec.total}</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#16a34a', fontWeight: 900 }}>
                    {sec.answered}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#dc2626' }}>
                    {sec.notAnswered}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#9333ea' }}>
                    {sec.markedForReview}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="jee-btn-footer jee-btn-prev">
            Continue Exam
          </button>
          <button
            onClick={onConfirmSubmit}
            disabled={submitting}
            className="jee-btn-footer jee-btn-submit"
          >
            {submitting ? 'Evaluating Score...' : 'Yes, Final Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
