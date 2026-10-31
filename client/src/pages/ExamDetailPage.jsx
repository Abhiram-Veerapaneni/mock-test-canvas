import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ExamHeroSection from '../components/exam-detail/ExamHeroSection';
import ExamDetailTabs from '../components/exam-detail/ExamDetailTabs';
import ExamPreviewModal from '../components/exam-detail/ExamPreviewModal';
import RevealQuestionsModal from '../components/exam-detail/RevealQuestionsModal';
import ImageLightboxModal from '../components/test-builder/ImageLightboxModal';
import ExamLiveMonitorModal from '../components/proctoring/ExamLiveMonitorModal';
import api from '../services/api';
import useExamStore from '../store/useExamStore';
import useAuthStore from '../store/useAuthStore';
import useExamSchedule from '../hooks/useExamSchedule';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ExamDetailPage() {
  const { testId, examId: routeExamId } = useParams();
  const examId = testId || routeExamId;
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [isLoadingExam, setIsLoadingExam] = useState(true);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveMonitorOpen, setIsLiveMonitorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'proctoring' | 'attempts'
  const [lightboxImage, setLightboxImage] = useState(null);

  // Client-Side View Adjustment for Answer Key
  const [showAnswerKey, setShowAnswerKey] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('exam_show_answer_key');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [revealedQuestions, setRevealedQuestions] = useState(() => new Set());

  const handleToggleAnswerKey = () => {
    setShowAnswerKey((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('exam_show_answer_key', String(next));
      }
      return next;
    });
  };

  const handleToggleQuestionReveal = (qId) => {
    setRevealedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const { user, isAuthenticated, openAuthModal } = useAuthStore();

  // Test creator reveal status for generated tests
  const [isGeneratedRevealed, setIsGeneratedRevealed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`exam_revealed_${examId}`) === 'true';
    }
    return false;
  });
  const [showRevealConfirmationModal, setShowRevealConfirmationModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isRevealingQuestions, setIsRevealingQuestions] = useState(false);

  // Schedule hook
  const {
    nowTime,
    startTime,
    endTime,
    isScheduleUpcoming,
    isScheduleConcluded,
    isScheduleActive,
    allowPractice,
    canStartPractice,
    isPracticeExam,
    canViewResponses,
    isReviewLockedBySchedule,
    formatScheduleCountdown,
    formatScheduleVerbose,
  } = useExamSchedule(exam);

  const fetchExam = useCallback(async (explicitReveal = false) => {
    try {
      const shouldReveal =
        explicitReveal ||
        (typeof window !== 'undefined' && sessionStorage.getItem(`exam_revealed_${examId}`) === 'true');
      const url = shouldReveal ? `/exams/${examId}?reveal=true` : `/exams/${examId}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setExam(res.data.exam);
        if (res.data.isCreator) {
          setIsGeneratedRevealed(true);
        }
      } else {
        throw new Error('Failed to load exam');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load exam details.');
    } finally {
      setIsLoadingExam(false);
    }
  }, [examId]);

  const fetchAttempts = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoadingAttempts(false);
      return;
    }
    try {
      const res = await api.get(`/submissions/my/${examId}`);
      if (res.data?.success) setAttempts(res.data.attempts || []);
    } catch {
      // Silently ignore — user may have no attempts yet
    } finally {
      setIsLoadingAttempts(false);
    }
  }, [examId, isAuthenticated]);

  useEffect(() => {
    fetchExam();
    fetchAttempts();
  }, [fetchExam, fetchAttempts]);

  const handleStartExam = (isPractice = false, isPreview = false) => {
    const practice = typeof isPractice === 'boolean' ? isPractice : false;
    const preview = typeof isPreview === 'boolean' ? isPreview : false;

    if (!examId) return;

    const qCount = exam?.questionCount || exam?.questions?.length || 0;
    if (exam && qCount === 0) {
      setError('This exam does not have any questions yet. Please add questions in Authoring Studio first.');
      return;
    }

    if (!isAuthenticated) {
      openAuthModal({
        title: preview
          ? 'Sign In to Preview Test Run'
          : practice
          ? 'Sign In for Practice Mode'
          : 'Sign In to Start Assessment',
        subtitle: preview
          ? 'Log in to test run this exam in candidate simulation mode.'
          : practice
          ? 'Log in or create an account to start unproctored practice.'
          : 'Log in or create a candidate account to begin this proctored test.',
        onSuccess: () => {
          localStorage.setItem('active_exam_id', examId);
          sessionStorage.setItem('active_exam_mode', practice ? 'PRACTICE' : 'OFFICIAL');
          if (preview) sessionStorage.setItem('active_exam_preview', 'true');
          else sessionStorage.removeItem('active_exam_preview');
          useExamStore.getState().setActiveExamId(examId);
          navigate('/test', { state: { examId, isPractice: practice, isPreview: preview } });
        }
      });
      return;
    }
    localStorage.setItem('active_exam_id', examId);
    sessionStorage.setItem('active_exam_mode', practice ? 'PRACTICE' : 'OFFICIAL');
    if (preview) sessionStorage.setItem('active_exam_preview', 'true');
    else sessionStorage.removeItem('active_exam_preview');
    useExamStore.getState().setActiveExamId(examId);
    navigate('/test', { state: { examId, isPractice: practice, isPreview: preview } });
  };

  const isOwner = Boolean(
    user && exam && (
      (exam.creatorId?._id && String(exam.creatorId._id) === String(user._id || user.id)) ||
      (exam.creatorId && String(exam.creatorId) === String(user._id || user.id))
    )
  );

  const isCreator = Boolean(
    user && exam && (
      (!exam.isGenerated && (
        (exam.creatorId?._id && String(exam.creatorId._id) === String(user._id || user.id)) ||
        (exam.creatorId && String(exam.creatorId) === String(user._id || user.id)) ||
        user.role === 'examiner' ||
        user.role === 'admin'
      )) ||
      (exam.isGenerated && isOwner && isGeneratedRevealed)
    )
  );

  const handleConfirmReveal = async () => {
    setIsRevealingQuestions(true);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`exam_revealed_${examId}`, 'true');
      }
      setIsGeneratedRevealed(true);
      await fetchExam(true);
      setShowRevealConfirmationModal(false);
      setActiveTab('questions');
    } catch (err) {
      console.error('Failed to reveal questions:', err);
    } finally {
      setIsRevealingQuestions(false);
    }
  };

  const handleTogglePublic = async () => {
    try {
      const nextPublic = !exam.isPublic;
      const res = await api.put(`/exams/${examId}`, { isPublic: nextPublic });
      if (res.data?.success) {
        setExam((prev) => ({ ...prev, isPublic: nextPublic }));
      }
    } catch (err) {
      console.error('Failed to toggle public state:', err);
    }
  };

  const officialAttempts = attempts.filter((a) => !a.isPractice);
  const attemptsUsed = officialAttempts.length;
  const maxAttempts = exam?.maxAttempts ?? null;
  const isUnlimited = maxAttempts === null;
  const attemptsLeft = isUnlimited ? Infinity : Math.max(0, maxAttempts - attemptsUsed);
  const isExhausted = !isUnlimited && attemptsLeft === 0;
  const hasAttempted = officialAttempts.length > 0;

  const bestAttempt = attempts.length > 0
    ? attempts.reduce((best, a) => (a.score > best.score ? a : best), attempts[0])
    : null;

  if (isLoadingExam) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-600 dark:text-slate-400" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-6 text-center shadow-none">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-5">{error || 'Exam not found.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const validQuestions = (exam.questions || []).filter(Boolean);
  const subjects = [...new Set(validQuestions.map((q) => q.subject || 'General'))];
  const questions = validQuestions;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation & Breadcrumbs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <BackButton to="/dashboard" label="Return to Dashboard" />
          <Breadcrumbs
            items={[
              { label: 'Assessments', to: '/dashboard' },
              { label: exam.title }
            ]}
          />
        </div>

        {/* Main Hero Card */}
        <ExamHeroSection
          exam={exam}
          examId={examId}
          isCreator={isCreator}
          isOwner={isOwner}
          hasAttempted={hasAttempted}
          isGeneratedRevealed={isGeneratedRevealed}
          subjects={subjects}
          questions={questions}
          onTogglePublic={handleTogglePublic}
          onOpenLiveMonitor={() => setIsLiveMonitorOpen(true)}
          onOpenAudit={() => navigate(`/test/${examId}/audit`)}
          onOpenPreview={() => setShowPreviewModal(true)}
          onOpenRevealConfirmation={() => setShowRevealConfirmationModal(true)}
          onStartExam={handleStartExam}
          isScheduleUpcoming={isScheduleUpcoming}
          isScheduleConcluded={isScheduleConcluded}
          isScheduleActive={isScheduleActive}
          isExhausted={isExhausted}
          isPracticeExam={isPracticeExam}
          allowPractice={allowPractice}
          canStartPractice={canStartPractice}
          startTime={startTime}
          endTime={endTime}
          nowTime={nowTime}
          formatScheduleCountdown={formatScheduleCountdown}
          formatScheduleVerbose={formatScheduleVerbose}
          navigate={navigate}
        />

        {/* Examiner Tabbed View vs Candidate View */}
        <ExamDetailTabs
          isCreator={isCreator}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          questions={questions}
          exam={exam}
          examId={examId}
          attempts={attempts}
          showAnswerKey={showAnswerKey}
          onToggleAnswerKey={handleToggleAnswerKey}
          revealedQuestions={revealedQuestions}
          onToggleQuestionReveal={handleToggleQuestionReveal}
          onPreviewImage={(img) => setLightboxImage(img)}
          bestAttempt={bestAttempt}
          canViewResponses={canViewResponses}
          isReviewLockedBySchedule={isReviewLockedBySchedule}
          onLockForPractice={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem(`exam_revealed_${examId}`);
            }
            setIsGeneratedRevealed(false);
            fetchExam(false);
          }}
          navigate={navigate}
        />

        {/* Lightbox Modal */}
        <ImageLightboxModal
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />

        {/* Live Proctoring Modal */}
        {isLiveMonitorOpen && (
          <ExamLiveMonitorModal
            isOpen={isLiveMonitorOpen}
            examId={examId}
            examTitle={exam.title}
            onClose={() => setIsLiveMonitorOpen(false)}
          />
        )}

        {/* Confirmation Modal */}
        <RevealQuestionsModal
          isOpen={showRevealConfirmationModal}
          onClose={() => setShowRevealConfirmationModal(false)}
          onConfirm={handleConfirmReveal}
          isRevealing={isRevealingQuestions}
        />

        {/* Creator Preview Test Run Simulation Modal */}
        <ExamPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          exam={exam}
          examId={examId}
          navigate={navigate}
          onStartExam={handleStartExam}
        />
      </main>
    </div>
  );
}
