import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ExamHeroSection from '../components/exam-detail/ExamHeroSection';
import ExamQuestionsTab from '../components/exam-detail/ExamQuestionsTab';
import ExamProctoringTab from '../components/exam-detail/ExamProctoringTab';
import ExamAttemptsTab from '../components/exam-detail/ExamAttemptsTab';
import ExamPreviewModal from '../components/exam-detail/ExamPreviewModal';
import RevealQuestionsModal from '../components/exam-detail/RevealQuestionsModal';
import ImageLightboxModal from '../components/test-builder/ImageLightboxModal';
import ExamLiveMonitorModal from '../components/proctoring/ExamLiveMonitorModal';
import api from '../services/api';
import useExamStore from '../store/useExamStore';
import useAuthStore from '../store/useAuthStore';
import { Loader2, AlertCircle, Eye, EyeOff, Lock, Edit3 } from 'lucide-react';

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

  // Official attempts count toward limit; practice attempts do not
  const officialAttempts = attempts.filter((a) => !a.isPractice);
  const attemptsUsed = officialAttempts.length;
  const maxAttempts = exam?.maxAttempts ?? null;
  const isUnlimited = maxAttempts === null;
  const attemptsLeft = isUnlimited ? Infinity : Math.max(0, maxAttempts - attemptsUsed);
  const isExhausted = !isUnlimited && attemptsLeft === 0;
  const hasAttempted = officialAttempts.length > 0;

  // Schedule status calculations and live ticker
  const [nowTime, setNowTime] = useState(Date.now());
  const isScheduled = Boolean(exam?.schedule?.isScheduled);
  const startTime = exam?.schedule?.startTime ? new Date(exam.schedule.startTime).getTime() : null;
  const endTime = exam?.schedule?.endTime ? new Date(exam.schedule.endTime).getTime() : null;

  useEffect(() => {
    if (!isScheduled) return;
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isScheduled]);

  const formatScheduleCountdown = (targetTime, currentNow = Date.now()) => {
    if (!targetTime) return '';
    const diffMs = Math.max(0, targetTime - currentNow);
    if (diffMs <= 0) return '00:00:00';

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');

    if (days > 0) {
      const parts = [`${days}d`];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0 || parts.length === 1) parts.push(`${minutes}m`);
      return parts.join(' ');
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const formatScheduleVerbose = (targetTime, currentNow = Date.now()) => {
    if (!targetTime) return '';
    const diffMs = Math.max(0, targetTime - currentNow);
    if (diffMs <= 0) return 'Concluded';

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
    return parts.join(' ');
  };

  const isScheduleUpcoming = isScheduled && startTime && nowTime < startTime;
  const isScheduleConcluded = isScheduled && endTime && nowTime > endTime;
  const isScheduleActive = isScheduled
    ? ((!startTime || nowTime >= startTime) && (!endTime || nowTime <= endTime))
    : true;

  const allowPractice = exam?.allowPracticeMode !== false;
  const isPracticeLockedBySchedule = isScheduled && !isScheduleConcluded;
  const canStartPractice = allowPractice && !isPracticeLockedBySchedule;
  const isPracticeExam = Boolean(exam?.examType === 'practice' || exam?.isGenerated || exam?.isPractice);

  const allowReview = exam?.allowReviewResponses !== false;
  const isReviewLockedBySchedule = isScheduled && !isScheduleConcluded;
  const canViewResponses = allowReview && !isReviewLockedBySchedule;

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
        {isCreator ? (
          <section className="space-y-4">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 gap-6 overflow-x-auto">
              <div className="flex items-center gap-6 h-10">
                <button
                  type="button"
                  onClick={() => setActiveTab('questions')}
                  className={`h-full flex items-center text-xs tracking-tight transition-colors border-b-2 -mb-[1px] cursor-pointer ${
                    activeTab === 'questions'
                      ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-slate-100 font-medium'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                  }`}
                >
                  <span>Questions & Answer Key ({questions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('proctoring')}
                  className={`h-full flex items-center text-xs tracking-tight transition-colors border-b-2 -mb-[1px] cursor-pointer ${
                    activeTab === 'proctoring'
                      ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-slate-100 font-medium'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                  }`}
                >
                  <span>Proctoring Security Rules</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('attempts')}
                  className={`h-full flex items-center text-xs tracking-tight transition-colors border-b-2 -mb-[1px] cursor-pointer ${
                    activeTab === 'attempts'
                      ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-slate-100 font-medium'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                  }`}
                >
                  <span>Attempt History ({attempts.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Answer Key Toggle */}
                <button
                  type="button"
                  onClick={handleToggleAnswerKey}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
                    showAnswerKey
                      ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 font-medium'
                      : 'bg-white dark:bg-[#131926] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  title={showAnswerKey ? 'Hide answers for unassisted self-testing' : 'Display answer key and solutions'}
                >
                  {showAnswerKey ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{showAnswerKey ? 'Hide Answer Key' : 'Show Answer Key'}</span>
                </button>

                {exam.isGenerated && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem(`exam_revealed_${examId}`);
                      }
                      setIsGeneratedRevealed(false);
                      fetchExam(false);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors cursor-pointer"
                    title="Re-lock questions to take practice test without answer spoilers"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock for Practice</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate(`/create-test?examId=${examId}`)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modify in Studio</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Questions & Answer Key */}
            {activeTab === 'questions' && (
              <ExamQuestionsTab
                questions={questions}
                exam={exam}
                examId={examId}
                showAnswerKey={showAnswerKey}
                revealedQuestions={revealedQuestions}
                onToggleQuestionReveal={handleToggleQuestionReveal}
                onPreviewImage={(img) => setLightboxImage(img)}
                navigate={navigate}
              />
            )}

            {/* TAB 2: Proctoring Security Rules */}
            {activeTab === 'proctoring' && (
              <ExamProctoringTab exam={exam} />
            )}

            {/* TAB 3: Attempts & Performance */}
            {activeTab === 'attempts' && (
              <ExamAttemptsTab
                attempts={attempts}
                exam={exam}
                examId={examId}
                isCreator={true}
                bestAttempt={bestAttempt}
                canViewResponses={canViewResponses}
                isReviewLockedBySchedule={isReviewLockedBySchedule}
                navigate={navigate}
              />
            )}
          </section>
        ) : (
          /* Non-Examiner Candidate View */
          <section className="space-y-6">
            <ExamAttemptsTab
              attempts={attempts}
              exam={exam}
              examId={examId}
              isCreator={false}
              bestAttempt={bestAttempt}
              canViewResponses={canViewResponses}
              isReviewLockedBySchedule={isReviewLockedBySchedule}
              navigate={navigate}
            />
          </section>
        )}

        {/* Lightbox Modal for Diagram Zoom */}
        <ImageLightboxModal
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />

        {/* Live Proctoring Modal for Creator */}
        {isLiveMonitorOpen && (
          <ExamLiveMonitorModal
            isOpen={isLiveMonitorOpen}
            examId={examId}
            examTitle={exam.title}
            onClose={() => setIsLiveMonitorOpen(false)}
          />
        )}

        {/* Confirmation Modal for Generated Practice Test Creators */}
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
