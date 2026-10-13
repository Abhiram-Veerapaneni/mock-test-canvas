import React from 'react';
import {
  CheckCircle,
  Award,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  BookOpen,
  ArrowLeft
} from 'lucide-react';

export default function ExamScoreReport({
  scoreResult,
  examTitle,
  durationMinutes,
  onBrowseExams,
  onReturnDashboard,
  darkMode
}) {
  return (
    <div
      className={`jee-exam-portal ${darkMode ? 'dark' : ''}`}
      style={{ overflowY: 'auto', height: 'auto', minHeight: '100vh', padding: '32px 24px' }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        {/* Top Success Badge */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)'
            }}
          >
            <CheckCircle size={38} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '6px' }}>
            Exam Submitted Successfully!
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--jee-text-secondary)' }}>
            Official Test Performance &amp; Score Summary for <strong>{examTitle}</strong>
          </p>
        </div>

        {/* Main Score Summary Card */}
        {scoreResult && (
          <div
            style={{
              backgroundColor: 'var(--jee-bg-card)',
              border: '2px solid var(--jee-border-card)',
              borderRadius: '18px',
              padding: '32px',
              marginBottom: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
              }}
            >
              {/* Score Box */}
              <div
                style={{
                  backgroundColor: 'var(--jee-sidebar-bg)',
                  border: '2px solid #2563eb',
                  padding: '20px',
                  borderRadius: '14px',
                  textAlign: 'center'
                }}
              >
                <Award size={28} color="#2563eb" style={{ margin: '0 auto 8px' }} />
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--jee-text-muted)'
                  }}
                >
                  Score Obtained
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2563eb', margin: '4px 0' }}>
                  {scoreResult.totalScore}{' '}
                  <span style={{ fontSize: '1rem', color: 'var(--jee-text-secondary)' }}>
                    / {scoreResult.maxScore}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a' }}>
                  {scoreResult.overallPercentage}% Overall
                </div>
              </div>

              {/* Accuracy Box */}
              <div
                style={{
                  backgroundColor: 'var(--jee-sidebar-bg)',
                  border: '2px solid #10b981',
                  padding: '20px',
                  borderRadius: '14px',
                  textAlign: 'center'
                }}
              >
                <Target size={28} color="#10b981" style={{ margin: '0 auto 8px' }} />
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--jee-text-muted)'
                  }}
                >
                  Accuracy
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981', margin: '4px 0' }}>
                  {scoreResult.accuracyPercentage}%
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--jee-text-secondary)' }}>
                  {scoreResult.correctCount} Correct of {scoreResult.attemptedCount} Attempted
                </div>
              </div>

              {/* Time Spent Box */}
              <div
                style={{
                  backgroundColor: 'var(--jee-sidebar-bg)',
                  border: '2px solid #9333ea',
                  padding: '20px',
                  borderRadius: '14px',
                  textAlign: 'center'
                }}
              >
                <Clock size={28} color="#9333ea" style={{ margin: '0 auto 8px' }} />
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--jee-text-muted)'
                  }}
                >
                  Time Spent
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#9333ea', margin: '8px 0' }}>
                  {Math.floor((scoreResult.timeSpentSeconds || 0) / 60)}m{' '}
                  {(scoreResult.timeSpentSeconds || 0) % 60}s
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--jee-text-secondary)' }}>
                  Out of {durationMinutes} Mins
                </div>
              </div>
            </div>

            {/* Question Attempt Status Counters */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'var(--jee-sidebar-bg)',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '32px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#16a34a',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                <CheckCircle2 size={18} />
                <span>{scoreResult.correctCount} Correct</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#dc2626',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                <XCircle size={18} />
                <span>{scoreResult.incorrectCount} Incorrect</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: 'var(--jee-text-muted)',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                <MinusCircle size={18} />
                <span>{scoreResult.unansweredCount} Unanswered</span>
              </div>
            </div>

            {/* Subject Breakdown Table */}
            {scoreResult.subjectBreakdown && scoreResult.subjectBreakdown.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    marginBottom: '14px',
                    color: 'var(--jee-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <BookOpen size={20} color="#2563eb" />
                  <span>Subject Performance Breakdown</span>
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      fontSize: '0.85rem',
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
                        <th style={{ padding: '12px 16px' }}>Subject</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>Total Qs</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>Attempted</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#16a34a' }}>Correct</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#dc2626' }}>Incorrect</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#2563eb' }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreResult.subjectBreakdown.map((sb, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--jee-border-card)', fontWeight: 700 }}>
                          <td style={{ padding: '12px 16px', color: 'var(--jee-text-primary)', fontWeight: 800 }}>
                            {sb.subject}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>{sb.totalQuestions}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>{sb.attempted}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: '#16a34a', fontWeight: 900 }}>
                            {sb.correct}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: '#dc2626' }}>
                            {sb.incorrect}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: '#2563eb', fontWeight: 900 }}>
                            {sb.scoreEarned} / {sb.maxScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Action Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onBrowseExams}
            className="jee-btn-footer jee-btn-prev"
            style={{ padding: '12px 28px', fontSize: '0.9rem' }}
          >
            <BookOpen size={18} />
            <span>Browse More Exams</span>
          </button>

          <button
            onClick={onReturnDashboard}
            className="jee-btn-footer jee-btn-save"
            style={{ padding: '12px 28px', fontSize: '0.9rem' }}
          >
            <ArrowLeft size={18} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
