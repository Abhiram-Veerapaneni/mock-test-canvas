import React from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function ExamInstructionsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="jee-modal-overlay">
      <div className="jee-modal-card" style={{ maxWidth: '650px' }}>
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
            <HelpCircle size={20} color="#2563eb" />
            <span>Examination Instructions</span>
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--jee-text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>
        <div
          style={{
            fontSize: '0.85rem',
            lineHeight: '1.8',
            color: 'var(--jee-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <p>1. The countdown timer at the top right displays the remaining time to complete the test.</p>
          <p>2. The question palette on the right side shows the status of each question.</p>
          <p>3. Click <strong>Save &amp; Next</strong> to save your response and move to the next question.</p>
        </div>
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="jee-btn-footer jee-btn-save">
            Close Instructions
          </button>
        </div>
      </div>
    </div>
  );
}
