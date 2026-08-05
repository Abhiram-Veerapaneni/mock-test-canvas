import React from 'react';
import { Clock, User, HelpCircle, FileText, AlertTriangle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ExamHeader({
  examTitle,
  candidateName = 'Candidate',
  timeRemainingSeconds,
  sections = [],
  activeSectionIndex,
  onSelectSection,
  onOpenInstructions,
  onOpenQuestionPaper
}) {
  const { darkMode, toggleTheme } = useAuth();

  const formatTime = (totalSecs) => {
    if (totalSecs <= 0) return '00:00:00';
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return [hours, minutes, seconds]
      .map((val) => String(val).padStart(2, '0'))
      .join(':');
  };

  const isLowTime = timeRemainingSeconds < 300;

  return (
    <>
      {/* 1. TOP NAVBAR HEADER */}
      <div className="jee-header-top">
        <div className="jee-exam-title-box">
          <div className="jee-exam-icon">
            <FileText size={22} />
          </div>
          <div>
            <div className="jee-exam-name">{examTitle}</div>
            <div className="jee-exam-subtitle">AI-Proctored Mock Test Portal</div>
          </div>
        </div>

        <div className="jee-header-controls">
          <button className="jee-btn-header" onClick={onOpenQuestionPaper}>
            <FileText size={16} />
            <span>Question Paper</span>
          </button>

          <button className="jee-btn-header" onClick={onOpenInstructions}>
            <HelpCircle size={16} />
            <span>Instructions</span>
          </button>

          <button className="jee-btn-header" onClick={toggleTheme} title="Toggle Theme">
            {darkMode ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#3b82f6" />}
          </button>

          <div className="jee-timer-badge" style={isLowTime ? { backgroundColor: '#7f1d1d', borderColor: '#ef4444', color: '#fef2f2' } : {}}>
            {isLowTime ? <AlertTriangle size={20} color="#f87171" /> : <Clock size={20} color="#3b82f6" />}
            <div>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'inherit', opacity: 0.8 }}>Time Left</div>
              <div>{formatTime(timeRemainingSeconds)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUBJECT TABS BAR */}
      <div className="jee-section-bar">
        <span className="jee-section-label">SELECT SECTION:</span>
        <div className="jee-section-tabs">
          {sections.map((section, idx) => {
            const isActive = idx === activeSectionIndex;
            return (
              <button
                key={section.name || idx}
                onClick={() => onSelectSection(idx)}
                className={`jee-tab-btn ${isActive ? 'active' : ''}`}
              >
                <span>{section.name || section.subject}</span>
                <span className="jee-tab-count">
                  {section.questions ? section.questions.length : 0} Qs
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
