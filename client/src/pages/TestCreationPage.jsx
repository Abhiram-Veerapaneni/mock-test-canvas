import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ManualQuestionForm from '../components/test-builder/ManualQuestionForm';
import IngestionReviewModal from '../components/test-builder/IngestionReviewModal';
import QuestionEditModal from '../components/test-builder/QuestionEditModal';
import QuestionPaperPDFModal from '../components/test-builder/QuestionPaperPDFModal';
import MathRenderer from '../components/common/MathRenderer';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import {
  CheckCircle2,
  AlertCircle,
  Layers,
  Trash2,
  Loader2,
  ShieldCheck,
  Plus,
  Database,
  Sparkles,
  Sliders,
  HelpCircle,
  UploadCloud,
  FileUp,
  FileText,
  ArrowUp,
  ArrowDown,
  Edit3,
  Bookmark,
  RotateCcw,
  Image as ImageIcon,
  Check,
  X,
  ExternalLink,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  BookOpen,
  Lock,
  CheckCheck,
  GripVertical,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function TestCreationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examIdParam = searchParams.get('examId');

  const { isAuthenticated, openAuthModal } = useAuthStore();

  const [existingExamId, setExistingExamId] = useState(examIdParam || null);
  const [examStatus, setExamStatus] = useState('draft');
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [tempExamId] = useState(() => 'exam_' + Date.now());

  // Client-Side View Adjustment: Answer Key visibility
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('JEE');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [correctMark, setCorrectMark] = useState(4);
  const [incorrectMark, setIncorrectMark] = useState(-1);
  const [isUnlimitedAttempts, setIsUnlimitedAttempts] = useState(true);
  const [maxAttemptsValue, setMaxAttemptsValue] = useState(3);

  // Scheduling & Practice / Review preferences
  const [allowPracticeMode, setAllowPracticeMode] = useState(true);
  const [allowReviewResponses, setAllowReviewResponses] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Proctor settings
  const [faceCheck, setFaceCheck] = useState(true);
  const [audioCheck, setAudioCheck] = useState(true);
  const [fullScreenLock, setFullScreenLock] = useState(true);
  const [objectCheck, setObjectCheck] = useState(true);
  const [liveNotifications, setLiveNotifications] = useState(false);

  // Added questions array
  const [questions, setQuestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing question modal state
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  // Image Lightbox preview
  const [lightboxImage, setLightboxImage] = useState(null);

  // Intentional Tab Layout & PDF Preview modal state
  const [activeStudioTab, setActiveStudioTab] = useState('questions'); // 'questions' | 'settings'
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isDropzoneExpanded, setIsDropzoneExpanded] = useState(false);

  // AI Ingestion pipeline state
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStep, setIngestionStep] = useState('');
  const [ingestionError, setIngestionError] = useState('');
  const [ingestionModalOpen, setIngestionModalOpen] = useState(false);
  const [ingestedQuestions, setIngestedQuestions] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef(null);

  // If examId is in URL, fetch existing exam for editing
  useEffect(() => {
    if (!examIdParam) return;
    setIsLoadingExisting(true);
    api.get(`/exams/${examIdParam}?reveal=true`)
      .then((res) => {
        if (res.data?.success && res.data.exam) {
          const ex = res.data.exam;
          setExistingExamId(ex._id);
          setTitle(ex.title || '');
          setDescription(ex.description || '');
          setCategory(ex.category || 'JEE');
          setDurationMinutes(ex.durationMinutes || 60);
          setExamStatus(ex.status || 'published');
          if (ex.markingScheme) {
            setCorrectMark(ex.markingScheme.correct ?? 4);
            setIncorrectMark(ex.markingScheme.incorrect ?? -1);
          }
          if (ex.maxAttempts === null || ex.maxAttempts === undefined) {
            setIsUnlimitedAttempts(true);
          } else {
            setIsUnlimitedAttempts(false);
            setMaxAttemptsValue(ex.maxAttempts);
          }
          if (ex.proctorSettings) {
            setFaceCheck(ex.proctorSettings.faceCheck ?? true);
            setAudioCheck(ex.proctorSettings.audioCheck ?? true);
            setFullScreenLock(ex.proctorSettings.fullScreenLock ?? true);
            setObjectCheck(ex.proctorSettings.objectCheck ?? true);
            setLiveNotifications(ex.proctorSettings.liveNotifications ?? false);
          }
          if (ex.allowPracticeMode !== undefined) {
            setAllowPracticeMode(Boolean(ex.allowPracticeMode));
          }
          if (ex.allowReviewResponses !== undefined) {
            setAllowReviewResponses(Boolean(ex.allowReviewResponses));
          }
          if (ex.schedule) {
            setIsScheduled(Boolean(ex.schedule.isScheduled));
            const pad = (n) => String(n).padStart(2, '0');
            if (ex.schedule.startTime) {
              const st = new Date(ex.schedule.startTime);
              setStartTime(`${st.getFullYear()}-${pad(st.getMonth() + 1)}-${pad(st.getDate())}T${pad(st.getHours())}:${pad(st.getMinutes())}`);
            }
            if (ex.schedule.endTime) {
              const et = new Date(ex.schedule.endTime);
              setEndTime(`${et.getFullYear()}-${pad(et.getMonth() + 1)}-${pad(et.getDate())}T${pad(et.getHours())}:${pad(et.getMinutes())}`);
            }
          }
          if (Array.isArray(ex.questions)) {
            setQuestions(ex.questions);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch existing exam:', err);
        setError('Failed to load assessment: ' + (err.response?.data?.message || err.message));
      })
      .finally(() => setIsLoadingExisting(false));
  }, [examIdParam]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!isAuthenticated) {
      openAuthModal({
        title: 'Sign In for AI Ingestion',
        subtitle: 'Log in or verify your account to parse exams and documents with AI.',
        onSuccess: () => handleFileUpload(file)
      });
      return;
    }
    setIsIngesting(true);
    setIngestionError('');
    setIngestionStep('Uploading file to AI pipeline...');

    const formData = new FormData();
    formData.append('document', file);

    try {
      setIngestionStep('Gemini AI is parsing questions & LaTeX formulas...');
      const res = await api.post('/ai/ingest', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });

      if (res.data?.success && res.data?.questions?.length > 0) {
        setIngestedQuestions(res.data.questions);
        setUploadedFileName(file.name);
        setIngestionModalOpen(true);
      } else {
        throw new Error(res.data?.message || 'No questions could be extracted from document.');
      }
    } catch (err) {
      console.error('Ingestion error:', err);
      setIngestionError(
        err.response?.data?.message || err.message || 'Failed to ingest document.'
      );
    } finally {
      setIsIngesting(false);
      setIngestionStep('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmIngestedQuestions = (approvedQuestions) => {
    setQuestions((prev) => [...prev, ...approvedQuestions]);
    setIngestionModalOpen(false);
    setIngestedQuestions([]);
    setSuccessMsg(`Successfully imported ${approvedQuestions.length} questions from AI document extraction!`);
  };

  const handleAddQuestion = (newQuestion) => {
    setQuestions([...questions, newQuestion]);
    setSuccessMsg(`Question #${questions.length + 1} added.`);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  // Re-ordering questions
  const handleMoveQuestionUp = (index) => {
    if (index <= 0) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveQuestionDown = (index) => {
    if (index >= questions.length - 1) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Updating an edited question
  const handleUpdateQuestion = (index, updatedQ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = updatedQ;
      return copy;
    });
    setSuccessMsg(`Question #${index + 1} updated successfully.`);
  };

  // Pop out clean printable preview of question paper in new window
  // Pop out clean printable preview of question paper in new window with Dark Mode support
  const handlePopoutPreview = () => {
    if (questions.length === 0) {
      setError('Please add at least one question to preview the question paper.');
      return;
    }

    const previewWin = window.open('', '_blank', 'width=1000,height=850,scrollbars=yes,resizable=yes');
    if (!previewWin) {
      alert('Pop-up window blocked! Please allow popups for this site to view the printable question paper.');
      return;
    }

    const cleanTitle = title || 'Question Paper Preview';
    const cleanCategory = category || 'Exam';

    let questionsHtml = '';
    questions.forEach((q, idx) => {
      let optionsHtml = '';
      if (Array.isArray(q.options)) {
        q.options.forEach((opt, oIdx) => {
          const letter = String.fromCharCode(65 + oIdx);
          const optText = typeof opt === 'object' ? (opt.text || '') : opt;
          const optImg = typeof opt === 'object' ? (opt.image || '') : '';
          optionsHtml += `
            <div class="option-row" style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
              <strong style="min-width:24px;color:#2563eb;">(${letter})</strong>
              <div>
                <span>${optText}</span>
                ${optImg ? `<br/><img src="${optImg}" style="max-height:120px;margin-top:6px;border-radius:4px;"/>` : ''}
              </div>
            </div>
          `;
        });
      }

      questionsHtml += `
        <div class="question-card" style="margin-bottom:24px;padding:18px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;page-break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;color:#64748b;">
            <strong style="font-size:13px;color:#0f172a;" class="q-title">Question ${idx + 1} (${q.questionType || 'MCQ'})</strong>
            <span style="font-family:monospace;font-weight:600;">+${correctMark} / ${incorrectMark} Marks</span>
          </div>
          <div class="q-text" style="font-size:14px;color:#0f172a;line-height:1.6;margin-bottom:12px;font-weight:500;">
            ${q.questionText}
          </div>
          ${q.imageAttachment ? `<div style="margin-bottom:12px;"><img src="${q.imageAttachment}" style="max-height:220px;border-radius:8px;border:1px solid #e2e8f0;"/></div>` : ''}
          <div style="margin-top:10px;">${optionsHtml}</div>
        </div>
      `;
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${cleanTitle} - Question Paper Preview</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; transition: background 0.2s, color 0.2s; }
          .paper-container { max-width: 860px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
          .toolbar { display: flex; gap: 8px; align-items: center; }
          .print-btn { background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; }
          .print-btn:hover { background: #1d4ed8; }
          .theme-btn { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; }
          .theme-btn:hover { background: #e2e8f0; }
          
          /* Dark mode support */
          body.dark-mode { background: #0b0f17; color: #f8fafc; }
          body.dark-mode .paper-container { background: #111827; border-color: #1e293b; box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
          body.dark-mode .header { border-bottom-color: #1e293b; }
          body.dark-mode .header h1 { color: #f8fafc !important; }
          body.dark-mode .header p { color: #94a3b8 !important; }
          body.dark-mode .theme-btn { background: #1f2937; color: #f8fafc; border-color: #374151; }
          body.dark-mode .theme-btn:hover { background: #374151; }
          body.dark-mode .question-card { background: #141d2e !important; border-color: #1e293b !important; }
          body.dark-mode .q-title, body.dark-mode .q-text { color: #f8fafc !important; }
          body.dark-mode .option-row { background: #111827 !important; border-color: #1e293b !important; color: #f8fafc !important; }
          body.dark-mode .guidelines { background: #141d2e !important; border-color: #2563eb !important; color: #cbd5e1 !important; }

          @media print { 
            body, body.dark-mode { background: #fff !important; color: #000 !important; padding: 0; } 
            .paper-container { box-shadow: none !important; padding: 0 !important; max-width: 100% !important; border: none !important; background: #fff !important; } 
            .toolbar { display: none !important; } 
            .question-card { background: #fff !important; border-color: #e2e8f0 !important; }
            .option-row { background: #f8fafc !important; border-color: #e2e8f0 !important; color: #000 !important; }
            .q-title, .q-text { color: #000 !important; }
          }
        </style>
      </head>
      <body>
        <div class="paper-container">
          <div class="header">
            <div>
              <h1 style="margin:0 0 6px 0;font-size:22px;color:#0f172a;">${cleanTitle}</h1>
              <p style="margin:0;font-size:13px;color:#64748b;">${cleanCategory} • ${durationMinutes} Minutes • Total Marks: ${questions.length * correctMark} • ${questions.length} Questions</p>
            </div>
            <div class="toolbar">
              <button class="theme-btn" id="themeBtn" onclick="togglePaperTheme()">🌓 Dark Mode</button>
              <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
            </div>
          </div>
          ${description ? `<div class="guidelines" style="background:#f8fafc;padding:12px 16px;border-radius:8px;border-left:4px solid #2563eb;font-size:13px;color:#475569;margin-bottom:24px;">${description}</div>` : ''}
          <div>${questionsHtml}</div>
        </div>
        <script>
          function togglePaperTheme() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            document.getElementById('themeBtn').innerText = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
          }

          document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.body, {
              delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
              ],
              throwOnError: false
            });
          });
        </script>
      </body>
      </html>
    `;

    previewWin.document.open();
    previewWin.document.write(fullHtml);
    previewWin.document.close();
  };

  // Pre-publish validation & modal trigger
  const handleInitiatePublish = (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim()) {
      setError('Please provide an assessment title before publishing.');
      return;
    }
    if (questions.length === 0) {
      setError('Please add at least one question before publishing.');
      return;
    }
    if (isScheduled) {
      if (!startTime || !endTime) {
        setError('Please set both Start Time and End Time for scheduled assessment.');
        return;
      }
      if (new Date(endTime) <= new Date(startTime)) {
        setError('Schedule End Time must be later than Start Time.');
        return;
      }
    }

    setShowConfirmModal(true);
  };

  // Save / Publish execution
  const executeSaveExam = async (targetStatus = 'published') => {
    setError('');
    setSuccessMsg('');

    if (!isAuthenticated) {
      openAuthModal({
        title: targetStatus === 'draft' ? 'Sign In to Save Draft' : 'Sign In to Publish Exam',
        subtitle: 'Log in or create a candidate account to save and publish your assessments.',
        onSuccess: () => executeSaveExam(targetStatus)
      });
      return;
    }

    if (!title.trim()) {
      setError('Please provide an assessment title.');
      return;
    }

    const isDraft = targetStatus === 'draft';
    if (!isDraft && questions.length === 0) {
      setError('Please add at least one question before publishing.');
      return;
    }

    if (isDraft) {
      setIsSavingDraft(true);
    } else {
      setIsSaving(true);
    }

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        status: targetStatus,
        durationMinutes: Number(durationMinutes),
        markingScheme: {
          correct: Number(correctMark),
          incorrect: Number(incorrectMark)
        },
        maxAttempts: isUnlimitedAttempts ? null : Math.max(1, Number(maxAttemptsValue)),
        allowPracticeMode: Boolean(allowPracticeMode),
        allowReviewResponses: Boolean(allowReviewResponses),
        schedule: {
          isScheduled: Boolean(isScheduled),
          startTime: isScheduled && startTime ? new Date(startTime).toISOString() : null,
          endTime: isScheduled && endTime ? new Date(endTime).toISOString() : null
        },
        proctorSettings: {
          faceCheck,
          audioCheck,
          fullScreenLock,
          objectCheck,
          liveNotifications,
          maxWarningsAllowed: 3
        },
        questions
      };

      let res;
      if (existingExamId) {
        res = await api.put(`/exams/${existingExamId}`, payload);
      } else {
        res = await api.post('/exams', payload);
      }

      if (res.data?.success) {
        setExamStatus(targetStatus);
        const savedExam = res.data.exam;
        if (savedExam?._id) setExistingExamId(savedExam._id);

        if (isDraft) {
          setSuccessMsg('Assessment draft saved successfully! You can continue editing.');
        } else {
          setSuccessMsg('Examination published successfully! Redirecting to candidate dashboard...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1200);
        }
      }
    } catch (err) {
      console.error('Failed to save exam:', err);
      setError(err.response?.data?.message || 'Error saving examination. Please try again.');
    } finally {
      setIsSaving(false);
      setIsSavingDraft(false);
    }
  };

  const handleSaveExam = (e, targetStatus = 'published') => {
    if (targetStatus === 'published') {
      handleInitiatePublish(e);
    } else {
      executeSaveExam('draft');
    }
  };

  const getOptionLabel = (idx) => String.fromCharCode(65 + idx);

  const formatOption = (opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { text: opt.text || '', image: opt.image || '' };
    }
    return { text: String(opt || ''), image: '' };
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <BackButton to="/dashboard" label="Return to Dashboard" />
          <Breadcrumbs
            items={[
              { label: 'Assessments', to: '/dashboard' },
              { label: 'Authoring Studio' },
              { label: existingExamId ? 'Edit Assessment' : 'Create New Exam' }
            ]}
          />
        </div>

        {/* Top Header Action Bar with Inline Title Edit */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-none">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Examination Title
              </span>
              {existingExamId && (
                <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      examStatus === 'draft' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span>{examStatus === 'draft' ? 'Draft' : 'Published'}</span>
                </span>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. JEE Advanced Full Mock 01 (Click to edit title)"
              className="w-full text-base sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 bg-transparent border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 focus:bg-zinc-50 dark:focus:bg-zinc-950 rounded-md px-2.5 py-1 -ml-2.5 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0">
            <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800">
              Questions: <strong className="text-zinc-900 dark:text-zinc-100 tabular-nums font-semibold">{questions.length}</strong>
            </div>

            {/* Preview Question Paper Modal Button */}
            <button
              type="button"
              onClick={() => {
                if (questions.length === 0) {
                  setError('Please add at least one question to preview the question paper.');
                  return;
                }
                setIsPDFModalOpen(true);
              }}
              disabled={questions.length === 0}
              title={questions.length === 0 ? "Add questions to preview paper" : "Preview question paper in dark/light mode and PDF export"}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-500" />
              <span>Preview Paper</span>
            </button>

            {/* Save as Draft Button */}
            <button
              type="button"
              onClick={(e) => handleSaveExam(e, 'draft')}
              disabled={isSavingDraft || isSaving}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Draft...</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Save Draft</span>
                </>
              )}
            </button>

            {/* Publish Button */}
            <button
              type="button"
              onClick={(e) => handleSaveExam(e, 'published')}
              disabled={isSaving || isSavingDraft || questions.length === 0}
              className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{examStatus === 'published' ? 'Save Changes' : 'Publish Examination'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Intentional Horizontal Tabs */}
        <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveStudioTab('questions')}
            className={`flex items-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
              activeStudioTab === 'questions'
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Questions & Content</span>
            <span className="text-xs text-zinc-400 tabular-nums">
              ({questions.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStudioTab('settings')}
            className={`flex items-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
              activeStudioTab === 'settings'
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Exam & Proctoring Settings</span>
          </button>
        </div>

        {/* TAB 2: Exam & Proctoring Settings */}
        {activeStudioTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* COLUMN 1: Assessment Details, Marking & Scheduling */}
            <div className="space-y-6">
              {/* Card 1: Core Parameters */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-zinc-500" />
                    <span>Assessment Core Details</span>
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Examination Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. JEE Advanced Full Mock 01"
                    className="input-base text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Description & Guidelines
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Exam instructions or syllabus summary..."
                    className="input-base text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Curriculum Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-base text-xs cursor-pointer"
                    >
                      <option value="JEE">JEE</option>
                      <option value="NEET">NEET</option>
                      <option value="GATE">GATE</option>
                      <option value="APTITUDE">APTITUDE</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={360}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="input-base text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Scoring & Marking Scheme */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-zinc-500" />
                    <span>Scoring & Negative Marking</span>
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
                    +{correctMark} / {incorrectMark} pts
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1 font-medium">Correct Mark (+)</span>
                    <input
                      type="number"
                      value={correctMark}
                      onChange={(e) => setCorrectMark(e.target.value)}
                      className="input-base text-xs font-mono py-1.5"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1 font-medium">Negative Mark (-)</span>
                    <input
                      type="number"
                      value={incorrectMark}
                      onChange={(e) => setIncorrectMark(e.target.value)}
                      className="input-base text-xs font-mono py-1.5"
                    />
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-normal">
                  Applied by default to newly added questions. Individual questions can override custom marks.
                </p>
              </div>

              {/* Card 3: Candidate Attempt Limits */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-zinc-500" />
                    <span>Candidate Attempt Limits</span>
                  </span>
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {isUnlimitedAttempts ? 'Unlimited (∞)' : `${maxAttemptsValue} ${maxAttemptsValue === 1 ? 'Attempt' : 'Attempts'}`}
                  </span>
                </div>

                {/* 3 Preset Mode Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlimitedAttempts(false);
                      setMaxAttemptsValue(1);
                    }}
                    className={`p-2.5 rounded-md border text-center transition-all cursor-pointer ${
                      !isUnlimitedAttempts && Number(maxAttemptsValue) === 1
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-medium'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                    }`}
                  >
                    <span className="block text-xs font-medium">1 Attempt</span>
                    <span className="block text-[11px] text-zinc-400 mt-0.5">Strict Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlimitedAttempts(false);
                      if (Number(maxAttemptsValue) === 1) setMaxAttemptsValue(3);
                    }}
                    className={`p-2.5 rounded-md border text-center transition-all cursor-pointer ${
                      !isUnlimitedAttempts && Number(maxAttemptsValue) > 1
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-medium'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                    }`}
                  >
                    <span className="block text-xs font-medium">Multiple</span>
                    <span className="block text-[11px] text-zinc-400 mt-0.5">Custom limit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsUnlimitedAttempts(true)}
                    className={`p-2.5 rounded-md border text-center transition-all cursor-pointer ${
                      isUnlimitedAttempts
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-medium'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                    }`}
                  >
                    <span className="block text-xs font-medium">Unlimited</span>
                    <span className="block text-[11px] text-zinc-400 mt-0.5">Practice (∞)</span>
                  </button>
                </div>

                {/* Number Stepper when Multiple is selected */}
                {!isUnlimitedAttempts && Number(maxAttemptsValue) > 1 && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span>Allowed Attempts:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMaxAttemptsValue(Math.max(2, Number(maxAttemptsValue) - 1))}
                          className="w-7 h-7 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={2}
                          max={50}
                          value={maxAttemptsValue}
                          onChange={(e) => setMaxAttemptsValue(Math.max(2, parseInt(e.target.value) || 2))}
                          className="w-14 text-center py-1 input-base text-xs font-semibold font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setMaxAttemptsValue(Math.min(50, Number(maxAttemptsValue) + 1))}
                          className="w-7 h-7 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-zinc-400 uppercase font-medium mr-1">Presets:</span>
                      {[2, 3, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setMaxAttemptsValue(preset)}
                          className={`px-2.5 py-0.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                            Number(maxAttemptsValue) === preset
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                              : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 4: Assessment Scheduling Window */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    <span>Scheduled Test Window</span>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-zinc-200 peer-focus:outline-hidden rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-zinc-600 peer-checked:bg-zinc-900 dark:peer-checked:bg-zinc-100"></div>
                  </label>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                  {isScheduled
                    ? 'Restricts candidate access strictly between opening and closing timestamp.'
                    : 'Unscheduled — candidates can begin this evaluation at any convenient time.'}
                </p>

                {isScheduled && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>Window Start Date & Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="input-base text-xs font-mono py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>Window End Date & Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="input-base text-xs font-mono py-1.5"
                      />
                    </div>

                    {startTime && endTime && new Date(endTime) <= new Date(startTime) && (
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>End time must be later than start time!</span>
                      </p>
                    )}

                    {startTime && endTime && new Date(endTime) > new Date(startTime) && (
                      <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                        <span>Window Span:</span>
                        <strong className="font-mono tabular-nums">
                          {Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60))} hours ({Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60))} mins)
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: Proctoring Security, Access Rules & Overview */}
            <div className="space-y-6">
              {/* Card 1: Proctoring Security Rules */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-zinc-500" />
                      <span>Proctoring Security Rules</span>
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Configure automated browser lockdown and AI vision monitoring safeguards.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                  {/* Facial Verification */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faceCheck}
                      onChange={(e) => setFaceCheck(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Facial Presence Verification</span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${faceCheck ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {faceCheck ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal block mt-0.5">
                        MediaPipe vision tracking for candidate absence, head turns, and multiple face intrusions.
                      </span>
                    </div>
                  </label>

                  {/* Acoustic Audio */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={audioCheck}
                      onChange={(e) => setAudioCheck(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Acoustic & Noise Level Detection</span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${audioCheck ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {audioCheck ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal block mt-0.5">
                        Detects vocal murmur, background discussions, and ambient audio spikes in decibels.
                      </span>
                    </div>
                  </label>

                  {/* Fullscreen Lock */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fullScreenLock}
                      onChange={(e) => setFullScreenLock(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Strict Fullscreen & Focus Lockdown</span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${fullScreenLock ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {fullScreenLock ? 'Enforced' : 'Off'}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal block mt-0.5">
                        Immediately penalizes tab switching, window blurring, browser navigation, or devtool inspection.
                      </span>
                    </div>
                  </label>

                  {/* Device / Object Check */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={objectCheck}
                      onChange={(e) => setObjectCheck(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Prohibited Device Detection</span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${objectCheck ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {objectCheck ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal block mt-0.5">
                        COCO-SSD model scans video feed for mobile smartphones, notes, books, and external hardware.
                      </span>
                    </div>
                  </label>

                  {/* WebSocket Live Alerts */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveNotifications}
                      onChange={(e) => setLiveNotifications(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Live Examiner Real-Time Alerts</span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${liveNotifications ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {liveNotifications ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal block mt-0.5">
                        Instantly triggers live toasts with snapshot evidence directly on your examiner screen when candidates violate rules.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card 2: Candidate Access & Review Rules */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 sm:p-6 space-y-4">
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-zinc-500" />
                    <span>Candidate Access & Solutions Policy</span>
                  </h2>
                </div>

                <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                  {/* Practice Mode Toggle */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPracticeMode}
                      onChange={(e) => setAllowPracticeMode(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 block">Allow Practice Mode (Unproctored)</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal mt-0.5 block">
                        Candidates can practice questions without webcam or audio lockdown. {isScheduled ? 'For scheduled exams, practice mode unlocks strictly after the scheduled window ends.' : 'Practice attempts remain private.'}
                      </span>
                    </div>
                  </label>

                  {/* View Responses / Answer Key Toggle */}
                  <label className="flex items-start gap-3 p-3 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowReviewResponses}
                      onChange={(e) => setAllowReviewResponses(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 block">Allow View Responses & Solutions</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal mt-0.5 block">
                        Candidates can view their submission responses and comprehensive solutions after completing their test. {isScheduled ? 'For scheduled exams, solutions are released strictly after the scheduled window closes to prevent leaks.' : ''}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card 3: Security & Proctoring Status Overview */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Security & Integrity Overview</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Real-time candidate monitoring profile</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      faceCheck && audioCheck && fullScreenLock && objectCheck
                        ? 'bg-emerald-500'
                        : (faceCheck || audioCheck || fullScreenLock)
                        ? 'bg-indigo-500'
                        : 'bg-amber-500'
                    }`} />
                    <span>
                      {faceCheck && audioCheck && fullScreenLock && objectCheck
                        ? 'Maximum Lockdown'
                        : (faceCheck || audioCheck || fullScreenLock)
                        ? 'Standard Monitoring'
                        : 'Minimal Security'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500">Facial Vision:</span>
                    <span className={`font-medium ${faceCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                      {faceCheck ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500">Audio Proctor:</span>
                    <span className={`font-medium ${audioCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                      {audioCheck ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500">Fullscreen Lock:</span>
                    <span className={`font-medium ${fullScreenLock ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                      {fullScreenLock ? 'Enforced' : 'Optional'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500">Device Scan:</span>
                    <span className={`font-medium ${objectCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                      {objectCheck ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span>Schedule Window:</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {isScheduled ? 'Restricted Date/Time' : 'Flexible (Anytime)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Candidate Attempts:</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 font-mono">
                      {isUnlimitedAttempts ? 'Unlimited Retakes' : `${maxAttemptsValue} Attempts maximum`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Live Examiner Alerts:</span>
                    <span className={`font-medium ${liveNotifications ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>
                      {liveNotifications ? 'Real-Time Toasts On' : 'Silent Logging'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Questions & Content */}
        {activeStudioTab === 'questions' && (
          <div className="space-y-6">
            {/* AI Document & Scanned Paper Ingestion Card - Compact & Expandable */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                    <Sparkles className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>Automated AI Question Paper Ingestion</span>
                      <span className="text-[11px] font-mono text-zinc-400 font-normal">
                        Gemini
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Parses questions, equations, and figures from PDF, Word (.docx), or photos.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleAddQuestion({
                        questionText: "A particle moves along the x-axis such that its position is given by $$x(t) = 3t^2 - 12t + 9$$. At what time $t$ does the particle momentarily come to rest?",
                        questionType: "MCQ",
                        subject: "Physics",
                        topic: "Kinematics",
                        difficulty: "Medium",
                        options: [
                          { text: "$$t = 1\\text{ s}$$", image: "" },
                          { text: "$$t = 2\\text{ s}$$", image: "" },
                          { text: "$$t = 3\\text{ s}$$", image: "" },
                          { text: "$$t = 4\\text{ s}$$", image: "" }
                        ],
                        correctAnswers: [1],
                        marks: correctMark,
                        negativeMarks: incorrectMark,
                        explanation: "The velocity is the derivative of position: $$v(t) = \\frac{dx}{dt} = 6t - 12$$. Setting $$v(t) = 0 \\implies 6t = 12 \\implies t = 2\\text{ s}$$."
                      });
                      setSuccessMsg('Sample competitive exam question loaded into paper!');
                      setTimeout(() => setSuccessMsg(''), 3000);
                    }}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                    title="Insert a sample JEE/NEET KaTeX question"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Load Sample Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDropzoneExpanded(!isDropzoneExpanded)}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isDropzoneExpanded ? 'Collapse' : 'Upload File'}</span>
                    {isDropzoneExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Drag and Drop Zone (Expandable) */}
              {(isDropzoneExpanded || isIngesting || dragActive) && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                  }}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    dragActive
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800'
                      : isIngesting
                      ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-wait'
                      : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-zinc-50/50 dark:bg-zinc-950/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,image/png,image/jpeg,image/webp,image/jpg,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {isIngesting ? (
                    <div className="py-3 space-y-3">
                      <Loader2 className="w-6 h-6 text-zinc-600 dark:text-zinc-300 animate-spin mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                          {ingestionStep || 'Processing document with Gemini AI...'}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Extracting questions, options, and formatting LaTeX formulas...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 space-y-2">
                      <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 mx-auto">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          <span className="text-zinc-900 dark:text-zinc-100 underline underline-offset-2">Click to browse</span> or drag and drop document here
                        </p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          Supports PDF (.pdf), Word (.docx) & Images (.png, .jpg, .webp) up to 15 MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {ingestionError && (
                <div className="p-3 rounded-md bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Document Ingestion Failed</p>
                    <p className="text-xs mt-0.5">{ingestionError}</p>
                  </div>
                </div>
              )}
            </div>

            <ManualQuestionForm
              onAddQuestion={handleAddQuestion}
              examId={existingExamId || tempExamId}
              examTitle={title}
            />

            {/* Questions Draft Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Question Items ({questions.length})
                  </h3>
                  <span className="text-xs text-zinc-400">
                    • Re-order or edit questions
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Client-Side View Adjustment: Answer Key Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAnswerKey((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
                      showAnswerKey
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 font-medium'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                    title={showAnswerKey ? 'Hide answer key styling to preview test as candidate' : 'Show verified answer keys'}
                  >
                    {showAnswerKey ? <EyeOff className="w-3.5 h-3.5 text-zinc-500" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                    <span>{showAnswerKey ? 'Candidate Preview' : 'Show Answer Key'}</span>
                  </button>

                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tabular-nums">
                    Projected Marks: <strong className="text-zinc-900 dark:text-zinc-100">{questions.length * correctMark} pts</strong>
                  </span>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 mx-auto mb-2">
                    <Plus className="w-4 h-4" />
                  </div>
                  <p className="font-medium text-zinc-600 dark:text-zinc-400">No questions composed yet.</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Use the Question Authoring form or AI Ingestion above to add items to this examination.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const isNat = q.questionType === 'NAT';
                    const opts = Array.isArray(q.options) ? q.options.map(formatOption) : [];
                    const correctIndices = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];

                    return (
                      <div
                        key={q._id || idx}
                        className="p-4 sm:p-5 rounded-lg bg-zinc-50/40 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-800 space-y-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                      >
                        {/* Question Item Header with Re-ordering & Edit Actions */}
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-800 pb-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center tabular-nums">
                              {idx + 1}
                            </span>
                            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                              {q.questionType || 'MCQ'}
                            </span>
                            <span className="text-zinc-500 text-xs">
                              · {q.subject || 'General'} {q.topic && `· ${q.topic}`}
                            </span>
                            {q.isEdited && (
                              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                (Edited)
                              </span>
                            )}
                          </div>

                          {/* Action Buttons: Contribute to Bank, Re-order, Edit, Delete */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Contribute to Bank Toggle (Phase 8.4) */}
                            <label className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors">
                              <input
                                type="checkbox"
                                checked={Boolean(q.contributeToBank || q.isInBank)}
                                onChange={(e) => {
                                  const updated = [...questions];
                                  updated[idx] = { ...updated[idx], contributeToBank: e.target.checked };
                                  setQuestions(updated);
                                }}
                                className="w-3.5 h-3.5 rounded text-zinc-900 border-zinc-300 focus:ring-0 cursor-pointer"
                              />
                              <span className="flex items-center gap-1">
                                <Database className="w-3 h-3 text-amber-500" />
                                <span>Contribute to Bank</span>
                              </span>
                            </label>

                            {/* Move Up */}
                            <button
                              type="button"
                              onClick={() => handleMoveQuestionUp(idx)}
                              disabled={idx === 0}
                              className="p-1.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Move question up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              onClick={() => handleMoveQuestionDown(idx)}
                              disabled={idx === questions.length - 1}
                              className="p-1.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Move question down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Question */}
                            <button
                              type="button"
                              onClick={() => setEditingQuestionIndex(idx)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 text-xs font-medium transition-colors cursor-pointer"
                              title="Edit question and options"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Question */}
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(idx)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                              title="Remove question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Question Statement Preview */}
                        {q.questionText && (
                          <div className="text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed font-sans">
                            <MathRenderer text={q.questionText} />
                          </div>
                        )}

                        {/* Question Image Attachment Preview */}
                        {q.imageAttachment && (
                          <div className="pt-1">
                            <div
                              onClick={() => setLightboxImage(q.imageAttachment)}
                              className="inline-block p-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-zinc-400 transition-all group"
                              title="Click to view high-resolution image"
                            >
                              <img
                                src={q.imageAttachment}
                                alt={`Question ${idx + 1} Diagram`}
                                className="max-h-40 max-w-xs sm:max-w-md rounded object-contain"
                              />
                              <span className="text-[11px] text-zinc-600 dark:text-zinc-400 group-hover:underline flex items-center gap-1 mt-1 font-medium">
                                <ExternalLink className="w-3 h-3" /> View full image
                              </span>
                            </div>
                          </div>
                        )}

                        {/* MCQ / MSQ Options Preview Grid */}
                        {!isNat && opts.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {opts.map((opt, optIdx) => {
                              const isCorrect = showAnswerKey && correctIndices.includes(optIdx);

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-md border flex items-start gap-2.5 transition-colors text-xs ${
                                    isCorrect
                                      ? 'bg-emerald-50/50 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                                      : 'bg-white dark:bg-zinc-850 border-zinc-200/80 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300'
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded flex items-center justify-center font-medium text-xs shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                    }`}
                                  >
                                    {isCorrect ? '✓' : getOptionLabel(optIdx)}
                                  </div>

                                  <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                                    {opt.text && (
                                      <div className="leading-relaxed">
                                        <MathRenderer text={opt.text} />
                                      </div>
                                    )}

                                    {opt.image && (
                                      <div
                                        onClick={() => setLightboxImage(opt.image)}
                                        className="cursor-pointer inline-block"
                                        title="Click to zoom option picture"
                                      >
                                        <img
                                          src={opt.image}
                                          alt={`Option ${getOptionLabel(optIdx)} diagram`}
                                          className="max-h-24 max-w-full rounded border border-zinc-200 dark:border-zinc-700 object-contain bg-white hover:opacity-90 transition-opacity"
                                        />
                                      </div>
                                    )}

                                    {isCorrect && showAnswerKey && (
                                      <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block pt-0.5">
                                        Correct Key
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* NAT Numerical Range Display */}
                        {isNat && (
                          showAnswerKey ? (
                            <div className="p-2.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs flex items-center gap-2">
                              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Accepted Answer Range:</span>
                              <span className="font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40">
                                {correctIndices[0] !== undefined
                                  ? correctIndices[0] === correctIndices[1] || correctIndices[1] === undefined
                                  ? `${correctIndices[0]}`
                                  : `[${correctIndices[0]}, ${correctIndices[1]}]`
                                  : 'Not specified'}
                              </span>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 italic">
                              Numerical Answer (Candidate preview — answer key hidden)
                            </div>
                          )
                        )}

                        {/* Pedagogical Explanation Preview */}
                        {showAnswerKey && q.explanation && (
                          <div className="p-2.5 rounded-md bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 text-xs space-y-1">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Pedagogical Explanation:</span>
                            </span>
                            <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed pl-5">
                              <MathRenderer text={q.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Edit Question Modal */}
      {editingQuestionIndex !== null && questions[editingQuestionIndex] && (
        <QuestionEditModal
          isOpen={editingQuestionIndex !== null}
          question={questions[editingQuestionIndex]}
          questionIndex={editingQuestionIndex}
          examId={existingExamId || tempExamId}
          examTitle={title}
          isPublishedExam={examStatus === 'published'}
          onSave={handleUpdateQuestion}
          onClose={() => setEditingQuestionIndex(null)}
        />
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[10000] bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-3xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-3 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">High Resolution Image Preview</h3>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 rounded-md overflow-hidden p-2 border border-zinc-200 dark:border-zinc-800">
              <img src={lightboxImage} alt="Diagram preview" className="max-h-[65vh] w-auto object-contain" />
            </div>
            <div className="flex justify-end">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Open original in new tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Ingestion Review Studio Modal */}
      {ingestionModalOpen && (
        <IngestionReviewModal
          isOpen={ingestionModalOpen}
          fileName={uploadedFileName}
          initialQuestions={ingestedQuestions}
          onConfirm={handleConfirmIngestedQuestions}
          onClose={() => {
            setIngestionModalOpen(false);
            setIngestedQuestions([]);
          }}
        />
      )}

      {/* Confirm Examination Settings Before Publishing Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[10000] bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="max-w-2xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-5 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Confirm Examination Parameters</h3>
                  <p className="text-xs text-zinc-500">
                    Review your test rules, scheduling window, and proctoring parameters before publishing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Test Meta Card */}
              <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Assessment Details</span>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{title}</div>
                <div className="text-zinc-500">
                  {category} · {durationMinutes} mins · {questions.length} Questions
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 font-medium">
                  Total Marks: {questions.length * correctMark} (+{correctMark} / {incorrectMark})
                </div>
              </div>

              {/* Schedule Card */}
              <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Schedule Window</span>
                {isScheduled ? (
                  <>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>Scheduled Window</span>
                    </span>
                    <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-mono">
                      <strong>Opens:</strong> {new Date(startTime).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-mono">
                      <strong>Closes:</strong> {new Date(endTime).toLocaleString()}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Open / Flexible Window</span>
                    </span>
                    <p className="text-zinc-500 text-[11px]">
                      Candidates can start this assessment at any time.
                    </p>
                  </>
                )}
              </div>

              {/* Candidate Access & Solutions Card */}
              <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Candidate Access Rules</span>
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                  <span>Attempt Limit:</span>
                  <strong>{isUnlimitedAttempts ? 'Unlimited (∞)' : `${maxAttemptsValue} Attempts`}</strong>
                </div>
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                  <span>Practice Mode:</span>
                  <strong className={allowPracticeMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}>
                    {allowPracticeMode ? (isScheduled ? 'After schedule ends' : 'Allowed anytime') : 'Disabled'}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                  <span>View Responses:</span>
                  <strong className={allowReviewResponses ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                    {allowReviewResponses ? (isScheduled ? 'Released after schedule' : 'Available immediately') : 'Hidden / Disabled'}
                  </strong>
                </div>
              </div>

              {/* Proctoring Rules Card */}
              <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Proctoring Enforcement</span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span className={faceCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}>
                    {faceCheck ? '●' : '○'} Face Detection
                  </span>
                  <span className={audioCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}>
                    {audioCheck ? '●' : '○'} Audio Monitor
                  </span>
                  <span className={fullScreenLock ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}>
                    {fullScreenLock ? '●' : '○'} Fullscreen Lock
                  </span>
                  <span className={objectCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}>
                    {objectCheck ? '●' : '○'} Device Detection
                  </span>
                </div>
                <div className="text-[11px] pt-1 border-t border-zinc-200 dark:border-zinc-700 text-zinc-500">
                  Live alerts: <strong>{liveNotifications ? 'Enabled' : 'Disabled'}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Back to Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  executeSaveExam('published');
                }}
                disabled={isSaving}
                className="btn-primary text-xs py-2 px-5 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Publish Examination</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Paper Dark & Light Mode PDF Preview Modal */}
      <QuestionPaperPDFModal
        isOpen={isPDFModalOpen}
        exam={{
          title: title || 'Untitled Examination',
          category,
          durationMinutes: Number(durationMinutes) || 60,
          markingScheme: { correct: Number(correctMark) || 4, incorrect: Number(incorrectMark) || -1 },
          questions,
          createdAt: new Date().toISOString()
        }}
        onClose={() => setIsPDFModalOpen(false)}
      />
    </div>
  );
}
