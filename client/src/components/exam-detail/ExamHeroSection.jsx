import React from 'react';
import {
  ShieldCheck,
  Edit3,
  Radio,
  ExternalLink,
  FileText,
  Play,
  Clock,
  RotateCcw,
  FlaskConical,
  Sliders,
  Eye,
  Calendar
} from 'lucide-react';
import { formatTime12h, formatDateTime12h } from '../../utils/dateUtils';

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

export default function ExamHeroSection({
  exam,
  examId,
  isCreator,
  isOwner,
  hasAttempted,
  isGeneratedRevealed,
  subjects = [],
  questions = [],
  onTogglePublic,
  onOpenLiveMonitor,
  onOpenAudit,
  onOpenPreview,
  onOpenRevealConfirmation,
  onStartExam,
  isScheduleUpcoming,
  isScheduleConcluded,
  isScheduleActive,
  isExhausted,
  isPracticeExam,
  allowPractice,
  canStartPractice,
  startTime,
  endTime,
  nowTime,
  formatScheduleCountdown,
  formatScheduleVerbose,
  navigate
}) {
  const isScheduled = Boolean(exam?.schedule?.isScheduled);

  return (
    <section className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          {/* Header Status & Eyebrows */}
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${getCategoryEyebrowClass(
                exam.category
              )}`}
            >
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
                    onClick={onTogglePublic}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
                    title="Toggle visibility"
                  >
                    {exam.isPublic ? '(make private)' : '(make public)'}
                  </button>
                )}
              </div>
            )}

            {hasAttempted && !isCreator && (
              <span className="text-xs text-slate-500">Attempted</span>
            )}
          </div>

          {/* Title & Description */}
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {exam.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mt-1 line-clamp-2 sm:line-clamp-3">
              {exam.description ||
                'Comprehensive evaluation covering standard curriculum syllabus.'}
            </p>
          </div>

          {/* Modules / Subject pills */}
          {subjects.length > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Modules:
              </span>
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

        {/* Action Toolbar */}
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
                  onClick={onOpenLiveMonitor}
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
                onClick={onOpenAudit}
                className="btn-secondary text-xs py-2 px-3"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Violation Logs & Reports</span>
              </button>

              {/* Candidate Test Run for Creator */}
              <button
                onClick={onOpenPreview}
                className="btn-secondary border-dashed text-xs py-2 px-3 hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer"
                title="Simulate candidate experience before conducting or publishing"
              >
                <Play className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Preview Test Run</span>
              </button>
            </>
          ) : (
            /* Candidate CTA */
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 min-w-[190px]">
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
                  onClick={() => onStartExam(isPracticeExam)}
                  className="btn-primary text-xs py-2.5 px-5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {isPracticeExam ? 'Retake Practice Exam' : 'Retake Exam'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => onStartExam(isPracticeExam)}
                  className="btn-primary text-xs py-2.5 px-5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {isPracticeExam ? 'Start Practice Exam' : 'Start Proctored Exam'}
                  </span>
                </button>
              )}

              {/* Practice Mode Button */}
              {!isPracticeExam && allowPractice && (
                canStartPractice ? (
                  <button
                    onClick={() => onStartExam(true)}
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
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Test Creator Notice:{' '}
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Questions and solutions are kept hidden to protect your own
                practice attempt. Need to preview questions before conducting or
                modify in Studio?
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenRevealConfirmation}
            className="btn-secondary text-xs py-1.5 px-3 shrink-0 self-start sm:self-auto cursor-pointer flex items-center gap-1.5 font-medium"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect Questions & Modify</span>
          </button>
        </div>
      )}

      {/* Scheduled Examination Status Banner */}
      {isScheduled && (
        <div
          className={`p-3 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
            isScheduleUpcoming
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/50 text-amber-800 dark:text-amber-200'
              : isScheduleConcluded
              ? 'bg-slate-100 dark:bg-[#162030] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                isScheduleUpcoming
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : isScheduleConcluded
                  ? 'bg-slate-200 dark:bg-slate-800/80 text-slate-500'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-pulse'
              }`}
            >
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
                Start: {startTime ? formatDateTime12h(startTime) : 'Anytime'} • End:{' '}
                {endTime ? formatDateTime12h(endTime) : 'Open'}
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

      {/* Stats Metric Strip */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800/80 text-xs">
        <div className="py-2 pr-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Duration
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {exam.durationMinutes} mins
          </span>
        </div>

        <div className="py-2 px-0 sm:px-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Questions
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {questions.length} Items
          </span>
        </div>

        <div className="py-2 px-0 sm:px-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Marking Scheme
          </span>
          <div className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            <span>+{exam.markingScheme?.correct ?? 4}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span>{exam.markingScheme?.incorrect ?? -1}</span>
          </div>
        </div>

        <div className="py-2 pl-0 sm:pl-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Total Marks
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {exam.totalMarks ||
              questions.length * (exam.markingScheme?.correct ?? 4)}{' '}
            pts
          </span>
        </div>
      </div>
    </section>
  );
}
