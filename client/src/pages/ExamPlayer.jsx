import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ExamHeader from '../components/exam/ExamHeader';
import QuestionWindow from '../components/exam/QuestionWindow';
import SidebarPalette from '../components/exam/SidebarPalette';
import ExamFooter from '../components/exam/ExamFooter';
import ExamScoreReport from '../components/exam/ExamScoreReport';
import ExamInstructionsModal from '../components/exam/ExamInstructionsModal';
import ExamQuestionPaperModal from '../components/exam/ExamQuestionPaperModal';
import ExamSubmitModal from '../components/exam/ExamSubmitModal';
import { FALLBACK_EXAM_PAPER } from '../utils/fallbackExamPaper';
import { computeOfflineScore } from '../utils/examScoring';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
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
        const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
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
            // Backend reached but no active exam found
            setExam(FALLBACK_EXAM_PAPER);
            setTimeRemainingSeconds(FALLBACK_EXAM_PAPER.durationMinutes * 60);
          }
        }
      } catch (err) {
        console.warn('Backend server unreachable; using fallback exam paper data:', err);
        setExam(FALLBACK_EXAM_PAPER);
        setTimeRemainingSeconds(FALLBACK_EXAM_PAPER.durationMinutes * 60);
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
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      
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
      } else {
        // Fallback local scoring calculation
        const offlineResult = computeOfflineScore(exam, userResponses, totalTimeSecs);
        setScoreResult(offlineResult);
      }
    } catch (err) {
      console.warn('Backend submit failed or offline; calculating score locally:', err);
      const totalTimeSecs = ((exam?.durationMinutes || 180) * 60) - timeRemainingSeconds;
      const offlineResult = computeOfflineScore(exam, userResponses, totalTimeSecs);
      setScoreResult(offlineResult);
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
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors shadow-xs"
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
      <ExamScoreReport
        scoreResult={scoreResult}
        examTitle={exam.title}
        durationMinutes={exam.durationMinutes}
        onBrowseExams={() => navigate('/exams')}
        onReturnDashboard={() => navigate('/dashboard')}
        darkMode={darkMode}
      />
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

      <ExamInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      <ExamQuestionPaperModal
        isOpen={showQuestionPaper}
        onClose={() => setShowQuestionPaper(false)}
        examTitle={exam.title}
        sections={exam.sections}
      />

      <ExamSubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        examTitle={exam.title}
        submissionSummary={submissionSummary}
        onConfirmSubmit={handleFinalSubmit}
        submitting={submitting}
      />
    </div>
  );
}
