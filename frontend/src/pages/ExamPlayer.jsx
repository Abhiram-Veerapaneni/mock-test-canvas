import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ExamHeader from '../components/exam/ExamHeader';
import QuestionWindow from '../components/exam/QuestionWindow';
import SidebarPalette from '../components/exam/SidebarPalette';
import ExamFooter from '../components/exam/ExamFooter';
import LatexRenderer from '../components/LatexRenderer';
import { X, CheckCircle, AlertTriangle, HelpCircle, FileText, Send, ArrowLeft, Award, Clock, Target, CheckCircle2, XCircle, MinusCircle, BookOpen } from 'lucide-react';
import '../styles/ExamPlayer.css';

export default function ExamPlayer() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, darkMode } = useAuth();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(180 * 60);
  const [userResponses, setUserResponses] = useState({});

  const [showInstructions, setShowInstructions] = useState(false);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_BASE}/exams/${examId || 'latest'}`);
        const data = await res.json();

        if (data.success && data.exam) {
          setExam(data.exam);
          if (data.exam.durationMinutes) {
            setTimeRemainingSeconds(data.exam.durationMinutes * 60);
          }
        } else {
          const listRes = await fetch(`${API_BASE}/exams`);
          const listData = await listRes.json();
          if (listData.success && (listData.papers?.length > 0 || listData.exams?.length > 0)) {
            const firstPaperId = listData.papers[0]?._id || listData.exams[0]?._id;
            const singleRes = await fetch(`${API_BASE}/exams/${firstPaperId}`);
            const singleData = await singleRes.json();
            if (singleData.success && singleData.exam) {
              setExam(singleData.exam);
              if (singleData.exam.durationMinutes) {
                setTimeRemainingSeconds(singleData.exam.durationMinutes * 60);
              }
            }
          } else {
            setError('No active exam paper found. Please seed the database.');
          }
        }
      } catch (err) {
        console.error('Error loading exam player:', err);
        setError('Failed to connect to backend server.');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  useEffect(() => {
    if (!exam || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, isSubmitted]);

  const currentSection = useMemo(() => {
    if (!exam || !exam.sections || exam.sections.length === 0) return null;
    return exam.sections[activeSectionIndex] || exam.sections[0];
  }, [exam, activeSectionIndex]);

  const currentQuestions = useMemo(() => {
    return currentSection ? currentSection.questions || [] : [];
  }, [currentSection]);

  const currentQuestion = useMemo(() => {
    return currentQuestions[activeQuestionIndex] || null;
  }, [currentQuestions, activeQuestionIndex]);

  useEffect(() => {
    if (currentQuestion) {
      const qId = currentQuestion._id || `${activeSectionIndex}-${activeQuestionIndex}`;
      setUserResponses((prev) => {
        const existing = prev[qId] || {};
        if (!existing.visited) {
          return {
            ...prev,
            [qId]: { ...existing, visited: true }
          };
        }
        return prev;
      });
    }
  }, [currentQuestion, activeSectionIndex, activeQuestionIndex]);

  const handleUpdateResponseValue = (newValue) => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id || `${activeSectionIndex}-${activeQuestionIndex}`;
    setUserResponses((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        value: newValue,
        visited: true
      }
    }));
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id || `${activeSectionIndex}-${activeQuestionIndex}`;
    setUserResponses((prev) => {
      const updated = { ...prev };
      if (updated[qId]) {
        delete updated[qId].value;
      }
      return updated;
    });
  };

  const handleSaveAndNext = () => {
    if (activeQuestionIndex < currentQuestions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
    } else if (activeSectionIndex < (exam?.sections?.length || 1) - 1) {
      setActiveSectionIndex((prev) => prev + 1);
      setActiveQuestionIndex(0);
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (currentQuestion) {
      const qId = currentQuestion._id || `${activeSectionIndex}-${activeQuestionIndex}`;
      setUserResponses((prev) => ({
        ...prev,
        [qId]: {
          ...prev[qId],
          isMarkedForReview: true,
          visited: true
        }
      }));
    }
    handleSaveAndNext();
  };

  const handlePreviousQuestion = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex((prev) => prev - 1);
    } else if (activeSectionIndex > 0) {
      setActiveSectionIndex((prev) => prev - 1);
      const prevSecQuestions = exam.sections[activeSectionIndex - 1]?.questions || [];
      setActiveQuestionIndex(Math.max(0, prevSecQuestions.length - 1));
    }
  };

  const submissionSummary = useMemo(() => {
    if (!exam || !exam.sections) return [];
    
    return exam.sections.map((sec, secIdx) => {
      const secQs = sec.questions || [];
      let answered = 0;
      let notAnswered = 0;
      let markedForReview = 0;
      let notVisited = 0;

      secQs.forEach((q, qIdx) => {
        const qId = q._id || `${secIdx}-${qIdx}`;
        const resp = userResponses[qId];
        const hasVal = Array.isArray(resp?.value) ? resp.value.length > 0 : !!resp?.value;

        if (resp?.isMarkedForReview) {
          markedForReview++;
        } else if (hasVal) {
          answered++;
        } else if (resp?.visited) {
          notAnswered++;
        } else {
          notVisited++;
        }
      });

      return {
        sectionName: sec.name || sec.subject,
        total: secQs.length,
        answered,
        notAnswered,
        markedForReview,
        notVisited
      };
    });
  }, [exam, userResponses]);

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      setShowSubmitModal(false);

      const totalTimeSecs = (exam.durationMinutes * 60) - timeRemainingSeconds;
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const res = await fetch(`${API_BASE}/exams/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam._id,
          userResponses,
          timeSpentSeconds: totalTimeSecs
        })
      });

      const data = await res.json();

      if (data.success && data.scoreResult) {
        setScoreResult(data.scoreResult);
      }
    } catch (err) {
      console.error('Error submitting exam:', err);
    } finally {
      setSubmitting(false);
      setIsSubmitted(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center text-slate-900 dark:text-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold">Initializing Candidate Portal...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-white">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-xl">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Exam Initialization Failed</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">{error || 'No active exam configuration found.'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/30"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  // Post-Exam Score Report Screen
  if (isSubmitted) {
    return (
      <div className={`jee-exam-portal ${darkMode ? 'dark' : ''}`} style={{ overflowY: 'auto', height: 'auto', minHeight: '100vh', padding: '32px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          {/* Top Success Badge */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '72px', height: '72px', backgroundColor: '#10b981', color: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 16px', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)' }}>
              <CheckCircle size={38} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '6px' }}>Exam Submitted Successfully!</h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--jee-text-secondary)' }}>
              Official Test Performance & Score Summary for <strong>{exam.title}</strong>
            </p>
          </div>

          {/* Main Score Summary Card */}
          {scoreResult && (
            <div style={{ backgroundColor: 'var(--jee-bg-card)', border: '2px solid var(--jee-border-card)', borderRadius: '18px', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {/* Score Box */}
                <div style={{ backgroundColor: 'var(--jee-sidebar-bg)', border: '2px solid #2563eb', padding: '20px', borderRadius: '14px', textAlign: 'center' }}>
                  <Award size={28} color="#2563eb" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--jee-text-muted)' }}>Score Obtained</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2563eb', margin: '4px 0' }}>
                    {scoreResult.totalScore} <span style={{ fontSize: '1rem', color: 'var(--jee-text-secondary)' }}>/ {scoreResult.maxScore}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a' }}>
                    {scoreResult.overallPercentage}% Overall
                  </div>
                </div>

                {/* Accuracy Box */}
                <div style={{ backgroundColor: 'var(--jee-sidebar-bg)', border: '2px solid #10b981', padding: '20px', borderRadius: '14px', textAlign: 'center' }}>
                  <Target size={28} color="#10b981" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--jee-text-muted)' }}>Accuracy</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981', margin: '4px 0' }}>
                    {scoreResult.accuracyPercentage}%
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--jee-text-secondary)' }}>
                    {scoreResult.correctCount} Correct of {scoreResult.attemptedCount} Attempted
                  </div>
                </div>

                {/* Time Spent Box */}
                <div style={{ backgroundColor: 'var(--jee-sidebar-bg)', border: '2px solid #9333ea', padding: '20px', borderRadius: '14px', textAlign: 'center' }}>
                  <Clock size={28} color="#9333ea" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--jee-text-muted)' }}>Time Spent</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#9333ea', margin: '8px 0' }}>
                    {Math.floor((scoreResult.timeSpentSeconds || 0) / 60)}m {(scoreResult.timeSpentSeconds || 0) % 60}s
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--jee-text-secondary)' }}>
                    Out of {exam.durationMinutes} Mins
                  </div>
                </div>
              </div>

              {/* Question Attempt Status Counters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px', backgroundColor: 'var(--jee-sidebar-bg)', borderRadius: '12px', textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', itemsCenter: 'center', justifyCenter: 'center', gap: '8px', color: '#16a34a', fontWeight: 800, fontSize: '0.9rem' }}>
                  <CheckCircle2 size={18} />
                  <span>{scoreResult.correctCount} Correct</span>
                </div>
                <div style={{ display: 'flex', itemsCenter: 'center', justifyCenter: 'center', gap: '8px', color: '#dc2626', fontWeight: 800, fontSize: '0.9rem' }}>
                  <XCircle size={18} />
                  <span>{scoreResult.incorrectCount} Incorrect</span>
                </div>
                <div style={{ display: 'flex', itemsCenter: 'center', justifyCenter: 'center', gap: '8px', color: 'var(--jee-text-muted)', fontWeight: 800, fontSize: '0.9rem' }}>
                  <MinusCircle size={18} />
                  <span>{scoreResult.unansweredCount} Unanswered</span>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              {scoreResult.subjectBreakdown && scoreResult.subjectBreakdown.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '14px', color: 'var(--jee-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={20} color="#2563eb" />
                    <span>Subject Performance Breakdown</span>
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem', textStyle: 'left', borderCollapse: 'collapse', border: '1px solid var(--jee-border-card)' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--jee-sidebar-bg)', color: 'var(--jee-text-muted)', fontWeight: 800 }}>
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
                            <td style={{ padding: '12px 16px', color: 'var(--jee-text-primary)', fontWeight: 800 }}>{sb.subject}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>{sb.totalQuestions}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>{sb.attempted}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', color: '#16a34a', fontWeight: 900 }}>{sb.correct}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', color: '#dc2626' }}>{sb.incorrect}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', color: '#2563eb', fontWeight: 900 }}>{sb.scoreEarned} / {sb.maxScore}</td>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/exams')}
              className="jee-btn-footer jee-btn-prev"
              style={{ padding: '12px 28px', fontSize: '0.9rem' }}
            >
              <BookOpen size={18} />
              <span>Browse More Exams</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
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

  const currentQId = currentQuestion?._id || `${activeSectionIndex}-${activeQuestionIndex}`;

  return (
    <div className={`jee-exam-portal ${darkMode ? 'dark' : ''}`}>
      <ExamHeader
        examTitle={exam.title}
        candidateName={user?.name || 'Candidate'}
        timeRemainingSeconds={timeRemainingSeconds}
        sections={exam.sections || []}
        activeSectionIndex={activeSectionIndex}
        onSelectSection={(idx) => {
          setActiveSectionIndex(idx);
          setActiveQuestionIndex(0);
        }}
        onOpenInstructions={() => setShowInstructions(true)}
        onOpenQuestionPaper={() => setShowQuestionPaper(true)}
      />

      <div className="jee-main-body">
        <QuestionWindow
          questionNumber={activeQuestionIndex + 1}
          totalQuestionsInSection={currentQuestions.length}
          sectionName={currentSection?.name || 'Section'}
          question={currentQuestion}
          userResponse={userResponses[currentQId]}
          onChangeResponse={handleUpdateResponseValue}
          onClearResponse={handleClearResponse}
        />

        <SidebarPalette
          candidateName={user?.name || 'Candidate'}
          questions={currentQuestions}
          activeQuestionIndex={activeQuestionIndex}
          onSelectQuestion={(qIdx) => setActiveQuestionIndex(qIdx)}
          userResponses={userResponses}
          sectionName={currentSection?.name || 'Section'}
        />
      </div>

      <ExamFooter
        onPreviousQuestion={handlePreviousQuestion}
        onMarkForReviewAndNext={handleMarkForReviewAndNext}
        onClearResponse={handleClearResponse}
        onSaveAndNext={handleSaveAndNext}
        onSubmitExam={() => setShowSubmitModal(true)}
        isFirstQuestion={activeSectionIndex === 0 && activeQuestionIndex === 0}
        isLastQuestion={
          activeSectionIndex === (exam.sections?.length || 1) - 1 &&
          activeQuestionIndex === currentQuestions.length - 1
        }
      />

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="jee-modal-overlay">
          <div className="jee-modal-card" style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--jee-border-card)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--jee-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={20} color="#2563eb" />
                <span>Examination Instructions</span>
              </h3>
              <button
                onClick={() => setShowInstructions(false)}
                style={{ background: 'none', border: 'none', color: 'var(--jee-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: 'var(--jee-text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p>1. The countdown timer at the top right displays the remaining time to complete the test.</p>
              <p>2. The question palette on the right side shows the status of each question.</p>
              <p>3. Click <strong>Save & Next</strong> to save your response and move to the next question.</p>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowInstructions(false)}
                className="jee-btn-footer jee-btn-save"
              >
                Close Instructions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Paper Modal */}
      {showQuestionPaper && (
        <div className="jee-modal-overlay">
          <div className="jee-modal-card" style={{ maxWidth: '850px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--jee-border-card)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--jee-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#2563eb" />
                <span>Full Question Paper - {exam.title}</span>
              </h3>
              <button
                onClick={() => setShowQuestionPaper(false)}
                style={{ background: 'none', border: 'none', color: 'var(--jee-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {exam.sections?.map((sec, secIdx) => (
                <div key={secIdx}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563eb', borderBottom: '1px solid var(--jee-border-card)', paddingBottom: '6px', marginBottom: '12px' }}>
                    {sec.name} ({sec.questions?.length} Questions)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sec.questions?.map((q, qIdx) => (
                      <div key={qIdx} style={{ backgroundColor: 'var(--jee-sidebar-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--jee-border-card)' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb', display: 'block', marginBottom: '8px' }}>
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
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="jee-modal-overlay">
          <div className="jee-modal-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '2px solid var(--jee-border-card)', paddingBottom: '12px', marginBottom: '16px' }}>
              <Send size={22} color="#16a34a" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--jee-text-primary)' }}>Confirm Exam Submission</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--jee-text-secondary)', marginBottom: '16px' }}>
              Are you sure you want to submit <strong>{exam.title}</strong>? Here is your response summary:
            </p>

            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', fontSize: '0.8rem', textStyle: 'left', borderCollapse: 'collapse', border: '1px solid var(--jee-border-card)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--jee-sidebar-bg)', color: 'var(--jee-text-muted)', fontWeight: 800 }}>
                    <th style={{ padding: '10px' }}>Section</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Total</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: '#16a34a' }}>Answered</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: '#dc2626' }}>Unanswered</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: '#9333ea' }}>Marked</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionSummary.map((sec, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid var(--jee-border-card)', fontWeight: 700 }}>
                      <td style={{ padding: '10px', color: 'var(--jee-text-primary)' }}>{sec.sectionName}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{sec.total}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#16a34a', fontWeight: 900 }}>{sec.answered}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#dc2626' }}>{sec.notAnswered}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#9333ea' }}>{sec.markedForReview}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="jee-btn-footer jee-btn-prev"
              >
                Continue Exam
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="jee-btn-footer jee-btn-submit"
              >
                {submitting ? 'Evaluating Score...' : 'Yes, Final Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
