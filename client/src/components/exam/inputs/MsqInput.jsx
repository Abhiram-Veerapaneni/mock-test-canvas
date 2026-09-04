import React from 'react';
import LatexRenderer from '../../LatexRenderer';

export default function MsqInput({ options = [], selectedOptions = [], onToggleOption }) {
  return (
    <div className="jee-options-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#9333ea' }}>
          Select ONE OR MORE correct option(s):
        </span>
      </div>
      {options.map((option) => {
        const isSelected = Array.isArray(selectedOptions) && selectedOptions.includes(option.id);
        return (
          <div
            key={option.id}
            onClick={() => onToggleOption(option.id)}
            className={`jee-option-card ${isSelected ? 'selected' : ''}`}
          >
            <div className="jee-checkbox-box">
              {isSelected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            <div className="jee-option-letter" style={{ color: isSelected ? '#9333ea' : 'inherit' }}>
              ({option.id})
            </div>

            <div className="jee-option-text">
              <LatexRenderer content={option.textLaTeX} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
