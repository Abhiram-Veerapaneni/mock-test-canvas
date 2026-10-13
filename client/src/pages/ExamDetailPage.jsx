import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import MathRenderer from '../components/common/MathRenderer';
import api from '../services/api';
import useExamStore from '../store/useExamStore';
import useAuthStore from '../store/useAuthStore';
import ExamLiveMonitorModal from '../components/proctoring/ExamLiveMonitorModal';
import { formatTime12h, formatDateTime12h } from '../utils/dateUtils';
import {
  Clock,
  BookOpen,
  Award,
  ShieldCheck,
  Play,
  RotateCcw,
  Loader2,
  AlertCircle,
  Trophy,
  CalendarDays,
  Infinity as InfinityIcon,
  Radio,
  FileText,
  Target,
  Sparkles,
  Edit3,
  Sliders,
  CheckCircle2,
  Lock,
  Camera,
  Mic,
  Maximize2,
  Smartphone,
  Eye,
  EyeOff,
  Check,
  X,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon,
  Calendar,
  FlaskConical,
  CheckCheck
} from 'lucide-react';

const getCategoryEyebrowClass = (category) => {
  const cat = String(category || '').toUpperCase();
  if (cat.includes('JEE') || cat.includes('NEET')) {
    return 'text-indigo-600 dark:text-indigo-400';
  }
  if (cat.includes('GATE')) {
    return 'text-blue-600 dark:text-sky-400';
  }
  if (cat.includes('APTITUDE')) {
    return 'text-amber-600 dark:text-amber-400';
  }
  return 'text-slate-500 dark:text-slate-400';
};

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
    // Sanitize in case a click Event was passed
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

  // Format schedule remaining duration:
  // e.g. 4153 mins -> "2d 21h 13m", < 24h -> "02:53:15", < 1h -> "00:02:55"
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

  // Practice mode access rule:
  // Allowed if examiner enabled it. If exam is scheduled, locked until the schedule ends!
  const allowPractice = exam?.allowPracticeMode !== false;
  const isPracticeLockedBySchedule = isScheduled && !isScheduleConcluded;
  const canStartPractice = allowPractice && !isPracticeLockedBySchedule;
  const isPracticeExam = Boolean(exam?.examType === 'practice' || exam?.isGenerated || exam?.isPractice);

  // View responses security rule:
  // If exam is scheduled, released strictly after schedule concludes.
  const allowReview = exam?.allowReviewResponses !== false;
  const isReviewLockedBySchedule = isScheduled && !isScheduleConcluded;
  const canViewResponses = allowReview && !isReviewLockedBySchedule;

  const bestAttempt = attempts.length > 0
    ? attempts.reduce((best, a) => (a.score > best.score ? a : best), attempts[0])
    : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return formatDateTime12h(dateStr, { includeYear: true });
  };

  const formatSeconds = (sec) => {
    if (!sec || sec <= 0) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const getAccuracyColor = (acc) => {
    if (acc >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (acc >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

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

        {/* ── Main Hero Card ────────────────────────── */}
        <section className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              {/* Header Status & Eyebrows */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${getCategoryEyebrowClass(exam.category)}`}>
                  {exam.category || 'General'}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      exam.status === 'draft' ? 'bg-slate-400' : 'bg-emerald-500'
                    }`}
                  />
                  <span>{exam.status === 'draft' ? 'Draft' : 'Published'}</span>
                </div>

                {exam.proctorSettings?.faceCheck !== false && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>AI Proctored</span>
                  </div>
                )}

                {exam.isGenerated && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span>{exam.isPublic ? 'Public' : 'Private'}</span>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={handleTogglePublic}
                        className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
                        title="Toggle visibility"
                      >
                        {exam.isPublic ? '(make private)' : '(make public)'}
                      </button>
                    )}
                  </div>
                )}

                {hasAttempted && !isCreator && (
                  <span className="text-xs text-slate-500">
                    Attempted
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                  {exam.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mt-1 line-clamp-2 sm:line-clamp-3">
                  {exam.description || 'Comprehensive evaluation covering standard curriculum syllabus.'}
                </p>
              </div>

              {/* Modules / Subject pills */}
              {subjects.length > 0 && (
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Modules:</span>
                  {subjects.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Action Toolbar ────────────────────────────────────────────── */}
            <div className="shrink-0 flex flex-wrap sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-2 min-w-[210px]">
              {isCreator ? (
                <>
                  {/* Primary Creator Action: Edit Exam */}
                  <button
                    onClick={() => navigate(`/create-test?examId=${examId}`)}
                    className="btn-primary text-xs py-2 px-3.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit in Studio</span>
                  </button>

                  {/* Creator Action: Live Proctoring Console (Combined Modal + Pop-out) */}
                  <div className="flex items-stretch rounded-md border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] shadow-none overflow-hidden transition-colors hover:border-slate-300 dark:hover:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setIsLiveMonitorOpen(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors cursor-pointer"
                      title="Open Live Proctoring Console"
                    >
                      <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
                      <span>Live Console</span>
                    </button>
                    <div className="w-[1px] bg-slate-200 dark:bg-slate-800/80 self-stretch" />
                    <button
                      type="button"
                      onClick={() => {
                        const width = Math.min(1400, window.screen.availWidth - 80);
                        const height = Math.min(900, window.screen.availHeight - 80);
                        const left = Math.max(0, (window.screen.availWidth - width) / 2);
                        const top = Math.max(0, (window.screen.availHeight - height) / 2);
                        window.open(
                          `/test/${examId}/live`,
                          `proctor_live_${examId}`,
                          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
                        );
                      }}
                      className="px-2.5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors cursor-pointer"
                      title="Open Live Console in separate window"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Creator Action: Violation Logs */}
                  <button
                    onClick={() => navigate(`/test/${examId}/audit`)}
                    className="btn-secondary text-xs py-2 px-3"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Violation Logs & Reports</span>
                  </button>

                  {/* Candidate Test Run for Creator */}
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="btn-secondary border-dashed text-xs py-2 px-3 hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer"
                    title="Simulate candidate experience before conducting or publishing"
                  >
                    <Play className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Preview Test Run</span>
                  </button>
                </>
              ) : (
                /* Student Candidate CTA */
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 min-w-[190px]">
                  {/* Official Test Button */}
                  {isScheduleUpcoming ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Starts {formatTime12h(startTime)}</span>
                    </button>
                  ) : isScheduleConcluded ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-400 font-medium text-xs cursor-not-allowed"
                    >
                      Testing Window Ended
                    </button>
                  ) : isExhausted ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-400 font-medium text-xs cursor-not-allowed"
                    >
                      Attempts Exhausted
                    </button>
                  ) : hasAttempted ? (
                    <button
                      onClick={() => handleStartExam(isPracticeExam)}
                      className="btn-primary text-xs py-2.5 px-5 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isPracticeExam ? 'Retake Practice Exam' : 'Retake Exam'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartExam(isPracticeExam)}
                      className="btn-primary text-xs py-2.5 px-5 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isPracticeExam ? 'Start Practice Exam' : 'Start Proctored Exam'}</span>
                    </button>
                  )}

                  {/* Practice Mode Button (Unproctored) — for official exams with practice enabled */}
                  {!isPracticeExam && allowPractice && (
                    canStartPractice ? (
                      <button
                        onClick={() => handleStartExam(true)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 border-dashed cursor-pointer"
                        title="Practice this test with proctoring turned off. Attempts are private and will not notify the examiner."
                      >
                        <FlaskConical className="w-3 h-3 text-slate-500" />
                        <span>Practice Mode</span>
                      </button>
                    ) : (
                      <div
                        className="text-center text-[10px] text-slate-400 py-1 px-2 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                        title="Practice mode will unlock after the official scheduled exam has ended"
                      >
                        Practice unlocks after schedule ends
                      </div>
                    )
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Test Creator Notice Banner for Generated Practice Tests */}
          {exam.isGenerated && isOwner && !isGeneratedRevealed && (
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Test Creator Notice: </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Questions and solutions are kept hidden to protect your own practice attempt. Need to preview questions before conducting or modify in Studio?
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRevealConfirmationModal(true)}
                className="btn-secondary text-xs py-1.5 px-3 shrink-0 self-start sm:self-auto cursor-pointer flex items-center gap-1.5 font-medium"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Questions & Modify</span>
              </button>
            </div>
          )}

          {/* Scheduled Examination Status Banner */}
          {isScheduled && (
            <div className={`p-3 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
              isScheduleUpcoming
                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/50 text-amber-800 dark:text-amber-200'
                : isScheduleConcluded
                ? 'bg-slate-100 dark:bg-[#162030] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  isScheduleUpcoming
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : isScheduleConcluded
                    ? 'bg-slate-200 dark:bg-slate-800/80 text-slate-500'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-pulse'
                }`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">
                    {isScheduleUpcoming
                      ? 'Scheduled Assessment — Upcoming'
                      : isScheduleConcluded
                      ? 'Scheduled Window Ended'
                      : 'Live Examination Window Active'}
                  </div>
                  <div className="text-[11px] opacity-80 font-mono mt-0.5">
                    Start: {startTime ? formatDateTime12h(startTime) : 'Anytime'} • End: {endTime ? formatDateTime12h(endTime) : 'Open'}
                  </div>
                </div>
              </div>
              <div className="text-xs font-semibold shrink-0">
                {isScheduleUpcoming && (
                  <span
                    className="text-amber-600 dark:text-amber-400 font-mono"
                    title={formatScheduleVerbose(startTime, nowTime)}
                  >
                    Starts in {formatScheduleCountdown(startTime, nowTime)}
                  </span>
                )}
                {isScheduleActive && endTime && (
                  <span
                    className="text-emerald-600 dark:text-emerald-400 font-mono"
                    title={formatScheduleVerbose(endTime, nowTime)}
                  >
                    Window closes in {formatScheduleCountdown(endTime, nowTime)}
                  </span>
                )}
                {isScheduleConcluded && (
                  <span className="text-slate-400">Schedule concluded</span>
                )}
              </div>
            </div>
          )}

          {/* ── Stats Metric Strip (Clean divided grid) ─────────────── */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800/80 text-xs">
            <div className="py-2 pr-4">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Duration</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{exam.durationMinutes} mins</span>
            </div>

            <div className="py-2 px-0 sm:px-4">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Questions</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{questions.length} Items</span>
            </div>

            <div className="py-2 px-0 sm:px-4">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Marking Scheme</span>
              <div className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                <span>+{exam.markingScheme?.correct ?? 4}</span>
                <span className="text-slate-400 mx-1">/</span>
                <span>{exam.markingScheme?.incorrect ?? -1}</span>
              </div>
            </div>

            <div className="py-2 pl-0 sm:pl-4">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Marks</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {exam.totalMarks || questions.length * (exam.markingScheme?.correct ?? 4)} pts
              </span>
            </div>
          </div>
        </section>

        {/* ── Examiner Tabbed View ─────────────────────────────────────────── */}
        {isCreator ? (
          <section className="space-y-4">
            {/* Tabs Header: Horizontal text tabs with active bottom border indicator */}
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
                {/* Client-Side View Adjustment for Answer Key */}
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
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <div className="p-12 text-center card-base">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No questions added yet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Click below to author or import questions for this examination.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/create-test?examId=${examId}`)}
                      className="mt-4 btn-primary"
                    >
                      Add Questions Now
                    </button>
                  </div>
                ) : (
                  questions.map((q, idx) => {
                    const qId = q._id ? q._id.toString() : String(idx);
                    const isNAT = q.type === 'NAT';
                    const correctAnswers = q.correctAnswers || q.correctAnswer || [];
                    const isRevealed = showAnswerKey || revealedQuestions.has(qId);

                    return (
                      <div
                        key={qId}
                        className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 space-y-4"
                      >
                        {/* Question Card Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              Question {idx + 1}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400">
                              {q.type || 'MCQ'}
                            </span>
                            <span className="text-xs text-slate-500 tabular-nums">
                              +{q.marks || exam.markingScheme?.correct || 4} / {-(q.negativeMarks || Math.abs(exam.markingScheme?.incorrect || 1))} pts
                            </span>
                            {q.isEdited && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                [Edited]
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <div className="text-slate-400">
                              {q.subject && <span>{q.subject}</span>}
                              {q.topic && <span> • {q.topic}</span>}
                            </div>
                            {!showAnswerKey && (
                              <button
                                type="button"
                                onClick={() => handleToggleQuestionReveal(qId)}
                                className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 underline cursor-pointer"
                              >
                                {isRevealed ? 'Hide Answer' : 'Reveal Answer'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Statement */}
                        {q.questionText && (
                          <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                            <MathRenderer text={q.questionText} />
                          </div>
                        )}

                        {/* Question Diagram / Image Attachment */}
                        {q.imageAttachment && (
                          <div className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 inline-block">
                            <img
                              src={q.imageAttachment}
                              alt={`Question ${idx + 1} diagram`}
                              onClick={() => setLightboxImage(q.imageAttachment)}
                              className="max-h-56 max-w-full rounded object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
                            />
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              <span>Click image to zoom</span>
                            </div>
                          </div>
                        )}

                        {/* Options Grid */}
                        {!isNAT && Array.isArray(q.options) && q.options.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                            {q.options.map((opt, optIdx) => {
                              const optText = typeof opt === 'object' ? opt.text : opt;
                              const optImg = typeof opt === 'object' ? opt.image : null;
                              const isCorrect = isRevealed && (
                                (Array.isArray(correctAnswers) && (correctAnswers.includes(optIdx) || correctAnswers.includes(optText))) ||
                                correctAnswers === optIdx ||
                                correctAnswers === optText
                              );

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-3 rounded-lg border flex items-start gap-2.5 transition-colors ${
                                    isCorrect
                                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60'
                                      : 'bg-white dark:bg-[#131926] border-slate-200/80 dark:border-slate-800/80'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded text-xs font-medium flex items-center justify-center shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>

                                  <div className="flex-1 min-w-0 space-y-1.5">
                                    {optText && (
                                      <div className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                                        <MathRenderer text={optText} />
                                      </div>
                                    )}
                                    {optImg && (
                                      <img
                                        src={optImg}
                                        alt={`Option ${String.fromCharCode(65 + optIdx)}`}
                                        onClick={() => setLightboxImage(optImg)}
                                        className="max-h-24 max-w-full rounded object-contain cursor-zoom-in border border-slate-200 dark:border-slate-700 bg-white"
                                      />
                                    )}
                                  </div>

                                  {isCorrect && (
                                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                                      ✓ Correct
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* NAT correct range */}
                        {isNAT && (
                          isRevealed ? (
                            <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 text-xs">
                              <span className="font-medium text-emerald-800 dark:text-emerald-300 mr-2">
                                Numerical Correct Range:
                              </span>
                              <span className="font-mono text-slate-800 dark:text-slate-200">
                                {Array.isArray(correctAnswers) ? correctAnswers.join(' to ') : String(correctAnswers)}
                              </span>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-400 italic flex items-center justify-between">
                              <span>Numerical Answer (Answer key hidden)</span>
                              <button
                                type="button"
                                onClick={() => handleToggleQuestionReveal(qId)}
                                className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 underline cursor-pointer"
                              >
                                Reveal
                              </button>
                            </div>
                          )
                        )}

                        {/* Pedagogical Explanation */}
                        {isRevealed && q.explanation && (
                          <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Explanation:</span>
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                              <MathRenderer text={q.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: Proctoring Security Rules */}
            {activeTab === 'proctoring' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">AI Biometric Face & Eye Gaze</h4>
                        <p className="text-[11px] text-slate-400">MediaPipe Vision Face Mesh</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${exam.proctorSettings?.faceCheck !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{exam.proctorSettings?.faceCheck !== false ? 'Active' : 'Disabled'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tracks candidate gaze orientation, detects multi-person presence, and flags candidate absence during assessment.
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Acoustic & Voice Activity</h4>
                        <p className="text-[11px] text-slate-400">Web Audio API Spectrum</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${exam.proctorSettings?.audioCheck !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{exam.proctorSettings?.audioCheck !== false ? 'Active' : 'Disabled'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Detects speech, whispering, background voices, and sudden volume spikes during test administration.
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Full-Screen Lockdown</h4>
                        <p className="text-[11px] text-slate-400">Fullscreen API & Window Blur</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${exam.proctorSettings?.fullScreenLock !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{exam.proctorSettings?.fullScreenLock !== false ? 'Active' : 'Disabled'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Forces continuous full-screen view. Flags window tab switching, minimizing, or cursor loss.
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Prohibited Device Detection</h4>
                        <p className="text-[11px] text-slate-400">COCO-SSD Object Classifier</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${exam.proctorSettings?.objectCheck !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{exam.proctorSettings?.objectCheck !== false ? 'Active' : 'Disabled'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Real-time object detection detecting cell phones, notes, or books brought in front of the camera.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: Attempts & Performance */}
            {activeTab === 'attempts' && (
              <div className="space-y-6">
                {bestAttempt && (
                  <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-medium text-[11px] uppercase tracking-wider">Personal Best</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{bestAttempt.score}</span>
                        <span className="text-xs text-slate-400">/ {exam.totalMarks || questions.length * 4} pts</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-slate-800/80 text-center min-w-[240px]">
                      <div className="px-3">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Accuracy</span>
                        <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5 block">{bestAttempt.accuracy}%</span>
                      </div>
                      <div className="px-3">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Correct</span>
                        <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5 block">{bestAttempt.correct ?? '—'}</span>
                      </div>
                      <div className="px-3">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Incorrect</span>
                        <span className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5 block">{bestAttempt.incorrect ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submissions Table */}
                <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-lg overflow-hidden bg-white dark:bg-[#131926]">
                  <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Attempt History ({attempts.length})
                    </h3>
                  </div>

                  {attempts.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No attempts recorded for this exam yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/75 dark:bg-[#131926]/75 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <th className="py-2.5 px-4">Attempt</th>
                            <th className="py-2.5 px-4">Mode</th>
                            <th className="py-2.5 px-4">Date</th>
                            <th className="py-2.5 px-4 text-center">Time Taken</th>
                            <th className="py-2.5 px-4 text-center">Answered</th>
                            <th className="py-2.5 px-4 text-right">Score</th>
                            <th className="py-2.5 px-4 text-right">Accuracy</th>
                            <th className="py-2.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                          {attempts.map((attempt, idx) => (
                            <tr key={attempt._id || idx} className="hover:bg-slate-50/50 dark:hover:bg-[#162030]/40 transition-colors">
                              <td className="py-2.5 px-4 font-mono tabular-nums text-slate-900 dark:text-slate-100">#{attempts.length - idx}</td>
                              <td className="py-2.5 px-4">
                                {attempt.isPractice ? (
                                  <span className="text-slate-500">Practice</span>
                                ) : (
                                  <span className="text-slate-900 dark:text-slate-100 font-medium">Official</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-slate-500">{formatDate(attempt.submittedAt || attempt.createdAt)}</td>
                              <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                                {formatSeconds(attempt.timeTakenSeconds)}
                              </td>
                              <td className="py-2.5 px-4 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                {(attempt.correct || 0) + (attempt.incorrect || 0)}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                {attempt.score} pts
                              </td>
                              <td className={`py-2.5 px-4 text-right font-mono font-semibold tabular-nums ${getAccuracyColor(attempt.accuracy)}`}>
                                {attempt.accuracy}%
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/test/${examId}/review/${attempt._id}`)}
                                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium cursor-pointer"
                                >
                                  Responses
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        ) : (
          /* ── Non-Examiner Candidate View ───────────────────────────────── */
          <section className="space-y-6">
            {bestAttempt && (
              <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-medium text-[11px] uppercase tracking-wider">Personal Best</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{bestAttempt.score}</span>
                    <span className="text-xs text-slate-400">/ {exam.totalMarks} pts</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-slate-800/80 text-center min-w-[240px]">
                  <div className="px-3">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Accuracy</span>
                    <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5 block">{bestAttempt.accuracy}%</span>
                  </div>
                  <div className="px-3">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Correct</span>
                    <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5 block">{bestAttempt.correct ?? '—'}</span>
                  </div>
                  <div className="px-3">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Incorrect</span>
                    <span className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5 block">{bestAttempt.incorrect ?? '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Submissions Table */}
            <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-lg overflow-hidden bg-white dark:bg-[#131926]">
              <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Attempt History
                </h3>
              </div>

              {attempts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No attempts logged yet. Begin this assessment to record your verified test results.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/75 dark:bg-[#131926]/75 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="py-2.5 px-4">Attempt</th>
                        <th className="py-2.5 px-4">Mode</th>
                        <th className="py-2.5 px-4">Submission Date</th>
                        <th className="py-2.5 px-4 text-center">Time Taken</th>
                        <th className="py-2.5 px-4 text-center">Answered</th>
                        <th className="py-2.5 px-4 text-right">Score</th>
                        <th className="py-2.5 px-4 text-right">Accuracy</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                      {attempts.map((attempt, idx) => (
                        <tr key={attempt._id || idx} className="hover:bg-slate-50/50 dark:hover:bg-[#162030]/40 transition-colors">
                          <td className="py-2.5 px-4 font-mono tabular-nums text-slate-900 dark:text-slate-100">#{attempts.length - idx}</td>
                          <td className="py-2.5 px-4">
                            {attempt.isPractice ? (
                              <span className="text-slate-500">Practice</span>
                            ) : (
                              <span className="text-slate-900 dark:text-slate-100 font-medium">Official</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500">{formatDate(attempt.submittedAt || attempt.createdAt)}</td>
                          <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                            {formatSeconds(attempt.timeTakenSeconds)}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                            {(attempt.correct || 0) + (attempt.incorrect || 0)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                            {attempt.score} / {exam.totalMarks} pts
                          </td>
                          <td className={`py-2.5 px-4 text-right font-mono font-semibold tabular-nums ${getAccuracyColor(attempt.accuracy)}`}>
                            {attempt.accuracy}%
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {canViewResponses ? (
                              <button
                                onClick={() => navigate(`/test/${exam._id}/review/${attempt._id}`)}
                                className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium cursor-pointer"
                              >
                                View Answers
                              </button>
                            ) : isReviewLockedBySchedule ? (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                Locked
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Disabled
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Lightbox Modal for Diagram Zoom ─────────────────────────────── */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="max-w-3xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg overflow-hidden shadow-md p-4 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Image Preview</h3>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[70vh] flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0C0F17] rounded border border-slate-200/80 dark:border-slate-800/80 p-2 overflow-hidden">
                <img src={lightboxImage} alt="Diagram preview" className="max-h-[65vh] w-auto object-contain" />
              </div>
              <div className="flex justify-end pt-1">
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 font-medium"
                >
                  <span>Open in new tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

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
        {showRevealConfirmationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-xl w-full max-w-md shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Reveal Questions & Solutions?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    This practice exam was generated from the question bank. Revealing the questions will expose the statements, answer keys, and explanations.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="font-medium text-slate-800 dark:text-slate-200">Before you continue:</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  • If you plan to <strong>take this test yourself</strong>, viewing the questions beforehand will spoil your test practice.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  • If you are <strong>conducting this test for others</strong> or want to <strong>modify it in Studio</strong>, proceed to unlock authoring mode.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevealConfirmationModal(false)}
                  disabled={isRevealingQuestions}
                  className="btn-secondary text-xs py-2 px-3.5 cursor-pointer"
                >
                  Keep Hidden (Take Test First)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReveal}
                  disabled={isRevealingQuestions}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
                >
                  {isRevealingQuestions ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Revealing...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reveal Questions & Studio Access</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Creator Preview Test Run Simulation Modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Preview Test Run Simulation
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Test candidate experience, question flow, and scoring before publishing.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(exam?.questionCount === 0 || (!exam?.questions || exam.questions.length === 0)) ? (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>No questions in this examination paper yet</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                    Add questions in the Authoring Studio before previewing.
                  </p>
                  <button
                    onClick={() => {
                      setShowPreviewModal(false);
                      navigate(`/create-test?examId=${examId}`);
                    }}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Open Authoring Studio
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {/* Mode 1: Quick Unproctored Preview */}
                  <div className="p-3.5 rounded-lg border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            Quick Test Run (Practice Mode)
                          </span>
                          <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Test questions, math renderer, timer, answer palette, and instant grading. No webcam, mic, or browser lockdown required.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowPreviewModal(false);
                          handleStartExam(true, true);
                        }}
                        className="btn-primary text-xs py-2 px-3.5 shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Quick Preview</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode 2: Full Proctored Simulation */}
                  <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-[#162030]/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Full Proctored Simulation
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Test the full candidate security flow, including hardware verification gate, camera monitor, face detection, and browser lockdown.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowPreviewModal(false);
                          handleStartExam(false, true);
                        }}
                        className="btn-secondary text-xs py-2 px-3.5 shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Proctored Run</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
