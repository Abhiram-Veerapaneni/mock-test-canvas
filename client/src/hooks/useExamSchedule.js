import { useState, useEffect } from 'react';

export default function useExamSchedule(exam) {
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

  return {
    nowTime,
    isScheduled,
    startTime,
    endTime,
    isScheduleUpcoming,
    isScheduleConcluded,
    isScheduleActive,
    allowPractice,
    canStartPractice,
    isPracticeExam,
    allowReview,
    canViewResponses,
    isReviewLockedBySchedule,
    formatScheduleCountdown,
    formatScheduleVerbose,
  };
}

