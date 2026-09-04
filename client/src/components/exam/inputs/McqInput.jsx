import React from 'react';
import LatexRenderer from '../../LatexRenderer';

export default function McqInput({ options = [], selectedOption = '', onSelectOption }) {
  return (
    <div className="jee-options-container">
      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#2563eb', marginBottom: '8px' }}>
        Select ONE correct option:
      </div>
      {options.map((option) => {
        const isSelected = selectedOption === option.id;
        return (
          <div
            key={option.id}
            onClick={() => onSelectOption(option.id)}
            className={`jee-option-card ${isSelected ? 'selected' : ''}`}
          >
            <div className="jee-radio-circle">
              {isSelected && <div className="jee-radio-inner" />}
            </div>

            <div className="jee-option-letter">
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
