import React, { useState } from 'react';
import {
  Clock,
  FileText,
  Award,
  Calendar,
  Shield,
  Share2,
  Check,
  Globe,
  Link2,
  Lock
} from 'lucide-react';
import { formatDateTime12h } from '../../utils/dateUtils';

/**
 * Format schedule metadata into clean human-readable schedule string
 */
function getScheduleString(schedule) {
  if (typeof schedule === 'string') {
    return schedule;
  }
  if (!schedule || !schedule.isScheduled) {
    return 'Flexible · Anytime';
  }
  const now = Date.now();
  const start = schedule.startTime ? new Date(schedule.startTime) : null;
  const end = schedule.endTime ? new Date(schedule.endTime) : null;
  const startMs = start && !isNaN(start.getTime()) ? start.getTime() : null;
  const endMs = end && !isNaN(end.getTime()) ? end.getTime() : null;

  if (startMs && now < startMs) {
    return `Opens ${formatDateTime12h(start)}`;
  }
  if (endMs && now > endMs) {
    return `Ended ${formatDateTime12h(end)}`;
  }
  if (endMs) {
    return `Closes ${formatDateTime12h(end)}`;
  }
  if (startMs) {
    return `Live since ${formatDateTime12h(start)}`;
  }
  return 'Flexible · Anytime';
}

/**
 * Exam / Assessment Card Component
 * Refactored to align with Mongoose Exam schema and brand specs.
 */
export function ExamCard({
  // Mongoose Exam Schema mapped props
  category = 'CUSTOM',
  title = '',
  description = '',
  status = 'published',
  creatorName = '',
  isCreator = false,
  durationMinutes = 0,
  totalMarks = 0,
  markingScheme = { correct: 4, incorrect: -1 },
  questionsCount = 0,
  maxAttempts = null,
  userAttemptsCount = 0,
  schedule = { isScheduled: false, startTime: null, endTime: null },
  proctorSettings = { faceCheck: false, audioCheck: false, fullScreenLock: false },
  allowReviewResponses = true,

  // Callbacks
  onStart,
  onPractice,
  onReview,
  onEditDraft,
  onDiscardDraft,
  onManage,

  // Optional container click and styling extensions
  onClick,
  className = '',
  exam, // allows passing whole exam object directly
  ...restProps
}) {
  // Support both individual props and full exam document fallback
  const effectiveIsCreator = Boolean(
    isCreator ?? exam?.isCreator
  );
  const effectiveCreatorName = creatorName || exam?.creatorName || exam?.creatorId?.name || '';
  const effectiveCategory = (category ?? exam?.category ?? 'CUSTOM').toUpperCase();
  const effectiveTitle = title || exam?.title || 'Untitled Assessment';
  const effectiveDescription = description !== undefined && description !== null && description !== ''
    ? description
    : (exam?.description || '');
  const effectiveStatus = status ?? exam?.status ?? 'published';
  const effectiveVisibility = (
    restProps.visibility ||
    exam?.visibility ||
    (exam?.isPublic === false ? 'private' : 'public')
  );

  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const id = exam?._id || restProps._id;
    if (!id) return;
    const url = `${window.location.origin}/test/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.warn('Failed to copy link:', err);
    });
  };

  const effectiveDuration = durationMinutes || exam?.durationMinutes || 0;
  const effectiveMarking = markingScheme || exam?.markingScheme || { correct: 4, incorrect: -1 };
  const correctMark = effectiveMarking?.correct ?? 4;
  const incorrectMark = effectiveMarking?.incorrect ?? -1;

  const effectiveQuestionsCount = questionsCount !== undefined && questionsCount !== null
    ? questionsCount
    : (exam?.questionsCount ?? exam?.questionCount ?? exam?.questions?.length ?? 0);

  const calculatedMarks = totalMarks || exam?.totalMarks || (effectiveQuestionsCount * correctMark);

  const effectiveMaxAttempts = maxAttempts !== undefined
    ? maxAttempts
    : (exam?.maxAttempts ?? null);

  const effectiveUserAttempts = userAttemptsCount ?? exam?.userAttemptsCount ?? exam?.userAttemptCount ?? 0;
  const isUnlimited = effectiveMaxAttempts === null || effectiveMaxAttempts === undefined;
  const isMaxReached = !isUnlimited && effectiveUserAttempts >= effectiveMaxAttempts;

  const effectiveSchedule = schedule || exam?.schedule;
  const scheduleText = getScheduleString(effectiveSchedule);

  const effectiveProctor = proctorSettings || exam?.proctorSettings;
  const isProctored = Boolean(effectiveProctor?.faceCheck || effectiveProctor?.fullScreenLock);
  const effectiveAllowReview = allowReviewResponses ?? exam?.allowReviewResponses ?? true;

  const isDraft = effectiveStatus === 'draft';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-150 p-4 sm:p-5 flex flex-col dark:bg-[#131926] dark:border-slate-800/80 dark:hover:border-slate-700 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...restProps}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        {/* Left: Category Eyebrow + optional Proctoring tag */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="inline-flex items-center text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/40">
            {effectiveCategory}
          </span>
          {isProctored && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/50">
              <Shield className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Proctored</span>
            </span>
          )}
        </div>

        {/* Right: Status / Context & External Author */}
        <div className="flex items-center gap-2 shrink-0">
          {!effectiveIsCreator && effectiveCreatorName ? (
            <span
              className="text-xs text-slate-400 dark:text-slate-500 font-normal truncate max-w-[160px]"
              title={`Created by ${effectiveCreatorName}`}
            >
              By {effectiveCreatorName}
            </span>
          ) : null}

          {effectiveVisibility === 'unlisted' ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 px-1.5 py-0.5 rounded-md shrink-0"
              title="Accessible only via shared link"
            >
              <Link2 className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Link Only</span>
            </span>
          ) : effectiveVisibility === 'private' ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 px-1.5 py-0.5 rounded-md shrink-0"
              title="Private to creator"
            >
              <Lock className="w-3 h-3 text-rose-500 shrink-0" />
              <span>Private</span>
            </span>
          ) : effectiveIsCreator ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 px-1.5 py-0.5 rounded-md shrink-0"
              title="Visible in public catalog"
            >
              <Globe className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Public</span>
            </span>
          ) : null}

          {isDraft && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 px-2 py-0.5 rounded-md shrink-0">
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <div className="mt-1">
        <h3
          className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-1 dark:text-slate-100 tracking-tight"
          title={effectiveTitle}
        >
          {effectiveTitle}
        </h3>
        {effectiveDescription ? (
          <p
            className="text-xs text-slate-500 line-clamp-2 mt-1 dark:text-slate-400 leading-relaxed"
            title={effectiveDescription}
          >
            {effectiveDescription}
          </p>
        ) : (
          <p className="text-xs text-slate-400/80 dark:text-slate-500 italic mt-0.5">
            No description provided.
          </p>
        )}
      </div>

      {/* 2x2 Metadata Grid */}
      <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 py-2.5 my-2.5 border-y border-slate-100 dark:border-slate-800 text-xs">
        {/* Duration */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-indigo-50/70 text-indigo-600 p-1 rounded-md w-[24px] h-[24px] flex items-center justify-center shrink-0 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300 truncate">
            {effectiveDuration} mins
          </span>
        </div>

        {/* Questions */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-indigo-50/70 text-indigo-600 p-1 rounded-md w-[24px] h-[24px] flex items-center justify-center shrink-0 dark:bg-indigo-950/50 dark:text-indigo-400">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300 truncate">
            {effectiveQuestionsCount} Questions
          </span>
        </div>

        {/* Marks & Scheme */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-indigo-50/70 text-indigo-600 p-1 rounded-md w-[24px] h-[24px] flex items-center justify-center shrink-0 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Award className="w-3.5 h-3.5" />
          </div>
          <span
            className="tabular-nums font-medium text-slate-700 dark:text-slate-300 truncate"
            title={`${calculatedMarks} Marks (+${correctMark}/${incorrectMark})`}
          >
            {calculatedMarks} Marks{' '}
            <span className="text-slate-400 dark:text-slate-500 font-normal">
              (+{correctMark}/{incorrectMark})
            </span>
          </span>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-indigo-50/70 text-indigo-600 p-1 rounded-md w-[24px] h-[24px] flex items-center justify-center shrink-0 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <span
            className="font-medium text-slate-700 dark:text-slate-300 truncate"
            title={scheduleText}
          >
            {scheduleText}
          </span>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-2 mt-auto flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Attempts Tracker (or Host Status for Creator) */}
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-1 min-w-0">
          {effectiveIsCreator ? (
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span className="tabular-nums">
                {effectiveUserAttempts > 0
                  ? `${effectiveUserAttempts} preview run${effectiveUserAttempts > 1 ? 's' : ''}`
                  : '0 preview runs'}
              </span>
            </span>
          ) : (
            <>
              <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                {isUnlimited
                  ? `${effectiveUserAttempts} / ∞ attempts`
                  : `${effectiveUserAttempts} / ${effectiveMaxAttempts} attempts`}
              </span>
              {isMaxReached && (
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  (Max reached)
                </span>
              )}
            </>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {isDraft ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDiscardDraft?.();
                }}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditDraft?.();
                }}
                className="text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md shadow-xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Edit Draft
              </button>
            </>
          ) : effectiveIsCreator ? (
            /* Creator Actions: Practice and Retake/Start Exam buttons are completely removed! */
            <>
              {effectiveUserAttempts > 0 && effectiveAllowReview && onReview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReview();
                  }}
                  className="text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md shadow-xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Review
                </button>
              )}
              {onEditDraft && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditDraft();
                  }}
                  className="text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md shadow-xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Edit
                </button>
              )}
              {!isDraft && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 rounded-md shadow-xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                  title="Copy shareable test link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Share</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onManage) onManage();
                  else onStart?.();
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                Manage Exam
              </button>
            </>
          ) : (
            /* Candidate Actions */
            <>
              {effectiveUserAttempts > 0 && effectiveAllowReview && onReview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReview();
                  }}
                  className="text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md shadow-xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Review
                </button>
              )}

              {onPractice && !isMaxReached && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPractice();
                  }}
                  className="text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md shadow-xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Practice
                </button>
              )}

              {isMaxReached ? (
                <button
                  type="button"
                  disabled
                  className="text-xs font-medium px-3.5 py-1.5 rounded-md bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed dark:bg-slate-800/80 dark:text-slate-500 dark:border-slate-700/80 shadow-xs"
                >
                  Completed
                </button>
              ) : effectiveUserAttempts > 0 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart?.();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  Retake Exam
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart?.();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  Start Exam
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExamCard;
