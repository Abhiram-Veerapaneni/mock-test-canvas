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
  Check,
  X,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon
} from 'lucide-react';

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

  const { user } = useAuthStore();

  const fetchExam = useCallback(async () => {
    try {
      const res = await api.get(`/exams/${examId}`);
      if (res.data?.success) setExam(res.data.exam);
      else throw new Error('Failed to load exam');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load exam details.');
    } finally {
      setIsLoadingExam(false);
    }
  }, [examId]);

  const fetchAttempts = useCallback(async () => {
    try {
      const res = await api.get(`/submissions/my/${examId}`);
      if (res.data?.success) setAttempts(res.data.attempts || []);
    } catch {
      // Silently ignore — user may have no attempts yet
    } finally {
      setIsLoadingAttempts(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExam();
    fetchAttempts();
  }, [fetchExam, fetchAttempts]);

  const handleStartExam = () => {
    if (!examId) return;
    localStorage.setItem('active_exam_id', examId);
    useExamStore.getState().setActiveExamId(examId);
    navigate('/test', { state: { examId } });
  };

  const isCreator = Boolean(
    user && exam && (
      (exam.creatorId?._id && String(exam.creatorId._id) === String(user._id || user.id)) ||
      (exam.creatorId && String(exam.creatorId) === String(user._id || user.id)) ||
      user.role === 'examiner' ||
      user.role === 'admin'
    )
  );

  const attemptsUsed = attempts.length;
  const maxAttempts = exam?.maxAttempts ?? null;
  const isUnlimited = maxAttempts === null;
  const attemptsLeft = isUnlimited ? Infinity : Math.max(0, maxAttempts - attemptsUsed);
  const isExhausted = !isUnlimited && attemptsLeft === 0;
  const hasAttempted = attemptsUsed > 0;

  const bestAttempt = attempts.length > 0
    ? attempts.reduce((best, a) => (a.score > best.score ? a : best), attempts[0])
    : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getAccuracyColor = (acc) => {
    if (acc >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (acc >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  if (isLoadingExam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f293d] rounded-2xl p-6 text-center shadow-lg">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-5">{error || 'Exam not found.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const subjects = exam.questions
    ? [...new Set(exam.questions.map((q) => q.subject || 'General'))]
    : [];

  const questions = exam.questions || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
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

        {/* ── Main Hero Card ────────────────────────────────────────────────── */}
        <section className="rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3.5 flex-1">
              {/* Badges strip */}
              <div className="flex items-center gap-2 flex-wrap">
                {isCreator ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Examiner Studio</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60">
                    {exam.category || 'General'}
                  </span>
                )}

                {/* Draft / Published status */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${
                    exam.status === 'draft'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      exam.status === 'draft' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <span>{exam.status === 'draft' ? 'Draft Paper' : 'Published Assessment'}</span>
                </span>

                {exam.proctorSettings?.faceCheck !== false && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>AI Proctored</span>
                  </span>
                )}

                {hasAttempted && !isCreator && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60">
                    Attempted
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {exam.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mt-2">
                  {exam.description || 'Comprehensive proctored examination covering competitive syllabus standards with real-time biometric and environment verification.'}
                </p>
              </div>

              {/* Modules / Subject pills */}
              {subjects.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Modules:</span>
                  {subjects.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Action Toolbar ────────────────────────────────────────────── */}
            <div className="shrink-0 flex flex-wrap lg:flex-col gap-2.5 items-stretch min-w-[200px]">
              {isCreator ? (
                <>
                  {/* Primary Creator Action: Edit Exam */}
                  <button
                    onClick={() => navigate(`/create-test?examId=${examId}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit in Studio</span>
                  </button>

                  {/* Creator Action: Live Proctoring Console */}
                  <button
                    onClick={() => setIsLiveMonitorOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>Live Console</span>
                  </button>

                  {/* Creator Action: Violation Logs */}
                  <button
                    onClick={() => navigate(`/test/${examId}/audit`)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Violation Logs & Reports</span>
                  </button>

                  {/* Candidate Test Run for Creator */}
                  <button
                    onClick={handleStartExam}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-medium text-xs border border-dashed border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                    title="Simulate candidate experience"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Preview Test Run</span>
                  </button>
                </>
              ) : (
                /* Student Candidate CTA */
                isExhausted ? (
                  <button
                    disabled
                    className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-semibold text-xs cursor-not-allowed"
                  >
                    Attempts Exhausted
                  </button>
                ) : hasAttempted ? (
                  <button
                    onClick={handleStartExam}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake Exam</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartExam}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Proctored Exam</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* ── Stats Metric Strip ─────────────────────────────────────── */}
          <div className="pt-6 border-t border-slate-100 dark:border-[#1f293d] grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/70 dark:bg-[#090d16]/70 border border-slate-200/70 dark:border-[#1f293d]">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-900/40">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Duration</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{exam.durationMinutes} mins</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/70 dark:bg-[#090d16]/70 border border-slate-200/70 dark:border-[#1f293d]">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-900/40">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Questions</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{questions.length} Items</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/70 dark:bg-[#090d16]/70 border border-slate-200/70 dark:border-[#1f293d]">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-900/40">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Marking Scheme</div>
                <div className="text-sm font-bold tabular-nums">
                  <span className="text-emerald-600 dark:text-emerald-400">+{exam.markingScheme?.correct ?? 4}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-rose-600 dark:text-rose-400">{exam.markingScheme?.incorrect ?? -1}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/70 dark:bg-[#090d16]/70 border border-slate-200/70 dark:border-[#1f293d]">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-900/40">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Marks</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                  {exam.totalMarks || questions.length * (exam.markingScheme?.correct ?? 4)} pts
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Examiner Tabbed View ─────────────────────────────────────────── */}
        {isCreator ? (
          <section className="space-y-5">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1f293d] pb-1 gap-4 overflow-x-auto">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('questions')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'questions'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Question Paper & Answer Key ({questions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('proctoring')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'proctoring'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Proctoring Security Rules</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('attempts')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'attempts'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Test Runs & Attempts ({attempts.length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/create-test?examId=${examId}`)}
                className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modify in Studio</span>
              </button>
            </div>

            {/* TAB 1: Questions & Answer Key */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f293d]">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No questions added yet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Click below to author or import questions for this examination.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/create-test?examId=${examId}`)}
                      className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                    >
                      Add Questions Now
                    </button>
                  </div>
                ) : (
                  questions.map((q, idx) => {
                    const isNAT = q.type === 'NAT';
                    const correctAnswers = q.correctAnswers || q.correctAnswer || [];

                    return (
                      <div
                        key={q._id || idx}
                        className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] p-5 shadow-xs space-y-4"
                      >
                        {/* Question Card Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1f293d] pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Question {idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {q.type || 'MCQ'}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              +{q.marks || exam.markingScheme?.correct || 4} / {-(q.negativeMarks || Math.abs(exam.markingScheme?.incorrect || 1))} pts
                            </span>
                            {q.isEdited && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                [Edited]
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400">
                            {q.subject && <span>{q.subject}</span>}
                            {q.topic && <span> • {q.topic}</span>}
                          </div>
                        </div>

                        {/* Statement */}
                        {q.questionText && (
                          <div className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-normal">
                            <MathRenderer text={q.questionText} />
                          </div>
                        )}

                        {/* Question Diagram / Image Attachment */}
                        {q.imageAttachment && (
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 inline-block">
                            <img
                              src={q.imageAttachment}
                              alt={`Question ${idx + 1} diagram`}
                              onClick={() => setLightboxImage(q.imageAttachment)}
                              className="max-h-56 max-w-full rounded-lg object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
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
                              const isCorrect =
                                (Array.isArray(correctAnswers) && (correctAnswers.includes(optIdx) || correctAnswers.includes(optText))) ||
                                correctAnswers === optIdx ||
                                correctAnswers === optText;

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-3 rounded-xl border flex items-start gap-2.5 transition-colors ${
                                    isCorrect
                                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80'
                                      : 'bg-slate-50/50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                                  }`}
                                >
                                  <span
                                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
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
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
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
                          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs">
                            <span className="font-bold text-emerald-800 dark:text-emerald-300 mr-2">
                              Numerical Correct Range:
                            </span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">
                              {Array.isArray(correctAnswers) ? correctAnswers.join(' to ') : String(correctAnswers)}
                            </span>
                          </div>
                        )}

                        {/* Pedagogical Explanation */}
                        {q.explanation && (
                          <div className="p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Pedagogical Explanation:</span>
                            </div>
                            <div className="text-slate-600 dark:text-slate-300 leading-relaxed pl-5">
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
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/60">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Biometric Face & Eye Gaze</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">MediaPipe Vision Face Mesh</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {exam.proctorSettings?.faceCheck !== false ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Tracks candidate gaze orientation, detects multi-person presence, and flags candidate absence during assessment.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-900/60">
                        <Mic className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Acoustic & Voice Activity</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Web Audio API Spectrum</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {exam.proctorSettings?.audioCheck !== false ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Detects speech, whispering, background voices, and sudden volume spikes during test administration.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200/60 dark:border-purple-900/60">
                        <Maximize2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Full-Screen Lockdown</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Fullscreen API & Window Blur</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {exam.proctorSettings?.fullScreenLock !== false ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Forces continuous full-screen view. Flags window tab switching, minimizing, or cursor loss.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-900/60">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Prohibited Device Detection</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">COCO-SSD Object Classifier</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {exam.proctorSettings?.objectCheck !== false ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Real-time object detection detecting cell phones, notes, or books brought in front of the camera.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: Attempts & Performance */}
            {activeTab === 'attempts' && (
              <div className="space-y-6">
                {bestAttempt && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                    }}
                    className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-blue-400/30"
                  >
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-semibold uppercase tracking-wider backdrop-blur-xs">
                          <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                          <span>Personal Best Score</span>
                        </div>
                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-4xl font-extrabold tabular-nums tracking-tight">{bestAttempt.score}</span>
                          <span className="text-blue-100 text-sm font-medium">/ {exam.totalMarks || questions.length * 4} points</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 bg-black/15 p-3.5 rounded-xl border border-white/10 backdrop-blur-xs text-center min-w-[260px]">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">Accuracy</span>
                          <span className="text-xl font-bold tabular-nums text-white block mt-0.5">{bestAttempt.accuracy}%</span>
                        </div>
                        <div className="border-x border-white/15 px-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Correct</span>
                          <span className="text-xl font-bold tabular-nums text-white block mt-0.5">{bestAttempt.correct ?? '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-300">Incorrect</span>
                          <span className="text-xl font-bold tabular-nums text-white block mt-0.5">{bestAttempt.incorrect ?? '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submissions Table */}
                <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] overflow-hidden shadow-xs">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1f293d] flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Attempt History ({attempts.length})
                    </h3>
                  </div>

                  {attempts.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-xs">
                      No attempts recorded for this exam yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-[#1f293d] bg-slate-50/75 dark:bg-[#090d16]/70 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <th className="py-3 px-5">Attempt</th>
                            <th className="py-3 px-5">Date</th>
                            <th className="py-3 px-5 text-center">Answered</th>
                            <th className="py-3 px-5 text-right">Score</th>
                            <th className="py-3 px-5 text-right">Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#1f293d] text-xs">
                          {attempts.map((attempt, idx) => (
                            <tr key={attempt._id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-5 font-bold tabular-nums text-slate-900 dark:text-white">#{attempts.length - idx}</td>
                              <td className="py-3 px-5 text-slate-600 dark:text-slate-400">{formatDate(attempt.submittedAt || attempt.createdAt)}</td>
                              <td className="py-3 px-5 text-center tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                                {(attempt.correct || 0) + (attempt.incorrect || 0)}
                              </td>
                              <td className="py-3 px-5 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                                {attempt.score} pts
                              </td>
                              <td className={`py-3 px-5 text-right font-bold tabular-nums ${getAccuracyColor(attempt.accuracy)}`}>
                                {attempt.accuracy}%
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
              <div
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                }}
                className="rounded-2xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden border border-blue-400/30"
              >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-semibold uppercase tracking-wider backdrop-blur-xs">
                      <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Personal Best Performance</span>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-4xl sm:text-5xl font-extrabold tabular-nums tracking-tight">{bestAttempt.score}</span>
                      <span className="text-blue-100 text-sm font-medium">/ {exam.totalMarks} points</span>
                    </div>
                    <p className="text-xs text-blue-100/90">
                      Recorded on {formatDate(bestAttempt.submittedAt || bestAttempt.createdAt)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:gap-6 bg-black/15 p-4 rounded-xl border border-white/10 backdrop-blur-xs text-center min-w-[280px]">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-blue-200">Accuracy</span>
                      <span className="text-xl sm:text-2xl font-bold tabular-nums text-white mt-1">{bestAttempt.accuracy}%</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-white/15 px-3 sm:px-6">
                      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Correct</span>
                      <span className="text-xl sm:text-2xl font-bold tabular-nums text-white mt-1">{bestAttempt.correct ?? '—'}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-rose-300">Incorrect</span>
                      <span className="text-xl sm:text-2xl font-bold tabular-nums text-white mt-1">{bestAttempt.incorrect ?? '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Submissions Table */}
            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1f293d]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Attempt History
                </h3>
              </div>

              {attempts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No attempts logged yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Begin this assessment to record your verified test results, question breakdowns, and timing.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-[#1f293d] bg-slate-50/75 dark:bg-[#090d16]/70 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-5">Attempt</th>
                        <th className="py-3 px-5">Submission Date</th>
                        <th className="py-3 px-5 text-center">Answered</th>
                        <th className="py-3 px-5 text-right">Score</th>
                        <th className="py-3 px-5 text-right">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1f293d] text-xs">
                      {attempts.map((attempt, idx) => (
                        <tr key={attempt._id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white tabular-nums">#{attempts.length - idx}</td>
                          <td className="py-3.5 px-5 text-slate-600 dark:text-slate-300">{formatDate(attempt.submittedAt || attempt.createdAt)}</td>
                          <td className="py-3.5 px-5 text-center tabular-nums">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                              {(attempt.correct || 0) + (attempt.incorrect || 0)}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                            {attempt.score} / {exam.totalMarks} pts
                          </td>
                          <td className={`py-3.5 px-5 text-right font-bold tabular-nums ${getAccuracyColor(attempt.accuracy)}`}>
                            {attempt.accuracy}%
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
            className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="max-w-3xl w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-5 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">High Resolution Image Preview</h3>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[70vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden p-2">
                <img src={lightboxImage} alt="Diagram preview" className="max-h-[65vh] w-auto object-contain" />
              </div>
              <div className="flex justify-end">
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Open original in new tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Live Proctoring Modal for Creator */}
        {isLiveMonitorOpen && (
          <ExamLiveMonitorModal
            examId={examId}
            examTitle={exam.title}
            onClose={() => setIsLiveMonitorOpen(false)}
          />
        )}
      </main>
    </div>
  );
}
