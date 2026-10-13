import React from 'react';
import { FileText, X } from 'lucide-react';
import LatexRenderer from '../LatexRenderer';

export default function ExamQuestionPaperModal({ isOpen, onClose, examTitle, sections }) {
  if (!isOpen) return null;

  return (
    <div className="jee-modal-overlay">
      <div className="jee-modal-card" style={{ maxWidth: '850px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--jee-border-card)',
            paddingBottom: '12px',
            marginBottom: '16px'
          }}
        >
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: 'var(--jee-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileText size={20} color="#2563eb" />
            <span>Full Question Paper - {examTitle}</span>
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--jee-text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {(sections || []).map((sec, secIdx) => (
            <div key={secIdx}>
              <h4
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: '#2563eb',
                  borderBottom: '1px solid var(--jee-border-card)',
                  paddingBottom: '6px',
                  marginBottom: '12px'
                }}
              >
                {sec.name} ({sec.questions?.length} Questions)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(sec.questions || []).map((q, qIdx) => (
                  <div
                    key={qIdx}
                    style={{
                      backgroundColor: 'var(--jee-sidebar-bg)',
                      padding: '16px',
                      borderRadius: '10px',
                      border: '1px solid var(--jee-border-card)'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#2563eb',
                        display: 'block',
                        marginBottom: '8px'
                      }}
                    >
                      Q{qIdx + 1} ({q.questionType}):
                    </span>
                    <LatexRenderer content={q.contentLaTeX} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
