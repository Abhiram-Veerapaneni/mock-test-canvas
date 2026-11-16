import { create } from 'zustand';

const getStorageKey = (examId) => `mock_test_session_${examId}`;

/**
 * Shuffles questions while preserving contiguous subject sections.
 * Within each subject group, questions are shuffled using Fisher-Yates algorithm.
 */
function shuffleQuestionsWithinSubjects(questionsList = []) {
  if (!questionsList || questionsList.length <= 1) return questionsList;

  const subjectGroups = new Map();
  for (const q of questionsList) {
    const subj = q.subject || 'General';
    if (!subjectGroups.has(subj)) {
      subjectGroups.set(subj, []);
    }
    subjectGroups.get(subj).push(q);
  }

  const result = [];
  for (const group of subjectGroups.values()) {
    const shuffled = [...group];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    result.push(...shuffled);
  }
  return result;
}

/**
 * Reorders a list of questions to match an explicit sequence of question IDs.
 */
function applyQuestionOrder(questionsList = [], targetOrderIds = []) {
  if (!Array.isArray(targetOrderIds) || targetOrderIds.length === 0) return questionsList;
  const idMap = new Map();
  questionsList.forEach((q) => {
    const id = q._id?.toString() || q.id?.toString();
    if (id) idMap.set(id, q);
  });

  const ordered = [];
  targetOrderIds.forEach((id) => {
    const idStr = id?.toString();
    if (idMap.has(idStr)) {
      ordered.push(idMap.get(idStr));
      idMap.delete(idStr);
    }
  });

  // Append any remaining questions not present in targetOrderIds to prevent omission
  idMap.forEach((q) => ordered.push(q));
  return ordered;
}

export const useExamStore = create((set, get) => ({
  exam: null,
  questions: [],
  currentIndex: 0,
  // Answers mapped by questionId: array of numbers (or single number in array for NAT/MCQ)
  answers: {},
  // Status mapped by questionId: 'NOT_VISITED' | 'NOT_ANSWERED' | 'ANSWERED' | 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED_FOR_REVIEW'
  questionStatus: {},
  timeRemainingSeconds: 0,
  isInitialized: false,
  activeExamId: typeof window !== 'undefined' ? localStorage.getItem('active_exam_id') || null : null,

  setActiveExamId: (id) => {
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem('active_exam_id', id);
      else localStorage.removeItem('active_exam_id');
    }
    set({ activeExamId: id || null });
  },

  // Initialize exam session with localStorage persistence
  initExam: (examData, serverQuestionOrder = null) => {
    if (!examData) return;
    const rawQuestions = (examData.questions || []).filter(Boolean);
    if (rawQuestions.length === 0) return;

    const storageKey = getStorageKey(examData._id);
    const savedSessionRaw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;

    let initialAnswers = {};
    let initialStatus = {};
    let initialTimeRemaining = (examData.durationMinutes || 180) * 60;
    let initialIndex = 0;
    let cachedQuestionOrder = null;

    if (savedSessionRaw) {
      try {
        const parsed = JSON.parse(savedSessionRaw);
        if (parsed.answers) initialAnswers = parsed.answers;
        if (parsed.questionStatus) initialStatus = { ...initialStatus, ...parsed.questionStatus };
        if (Array.isArray(parsed.questionOrder) && parsed.questionOrder.length > 0) {
          cachedQuestionOrder = parsed.questionOrder;
        }
        if (typeof parsed.timeRemainingSeconds === 'number' && parsed.timeRemainingSeconds > 0) {
          initialTimeRemaining = parsed.timeRemainingSeconds;
          // Bug fix: subtract actual wall-clock time elapsed since the last sync
          // This prevents the timer appearing to gain time on refresh
          if (typeof parsed.updatedAt === 'number') {
            const wallClockElapsed = Math.floor((Date.now() - parsed.updatedAt) / 1000);
            if (wallClockElapsed > 0) {
              initialTimeRemaining = Math.max(0, initialTimeRemaining - wallClockElapsed);
            }
          }
        }
        if (typeof parsed.currentIndex === 'number') initialIndex = parsed.currentIndex;
      } catch (err) {
        console.warn('Could not parse cached session:', err);
      }
    }

    // Determine final question order:
    // 1. Cached in localStorage (preserves active candidate attempt across browser refresh)
    // 2. Server attempt question order (synced from startAttempt)
    // 3. Exam shuffle setting enabled (fresh client-side shuffle preserving subject groups)
    // 4. Default original author sequence
    let finalQuestions = rawQuestions;
    if (cachedQuestionOrder) {
      finalQuestions = applyQuestionOrder(rawQuestions, cachedQuestionOrder);
    } else if (Array.isArray(serverQuestionOrder) && serverQuestionOrder.length > 0) {
      finalQuestions = applyQuestionOrder(rawQuestions, serverQuestionOrder);
    } else if (examData.shuffleQuestions) {
      finalQuestions = shuffleQuestionsWithinSubjects(rawQuestions);
    }

    // Default status for all questions is NOT_VISITED except the first one which becomes NOT_ANSWERED
    finalQuestions.forEach((q, idx) => {
      const qId = q._id || q.id;
      if (qId && !initialStatus[qId]) {
        initialStatus[qId] = idx === 0 ? 'NOT_ANSWERED' : 'NOT_VISITED';
      }
    });

    // Dynamic timer cap: if exam is scheduled, time remaining cannot exceed the window's endTime
    if (examData.schedule?.isScheduled && examData.schedule?.endTime) {
      const scheduleEndMs = new Date(examData.schedule.endTime).getTime();
      const secondsUntilEnd = Math.max(0, Math.floor((scheduleEndMs - Date.now()) / 1000));
      initialTimeRemaining = Math.min(initialTimeRemaining, secondsUntilEnd);
    }

    set({
      exam: examData,
      questions: finalQuestions,
      currentIndex: initialIndex,
      answers: initialAnswers,
      questionStatus: initialStatus,
      timeRemainingSeconds: initialTimeRemaining,
      isInitialized: true,
      activeExamId: examData._id
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_exam_id', examData._id);
    }

    // Immediately persist ordered question sequence into local storage
    get().syncToLocalStorage();
  },

  // Navigate directly to question index
  goToQuestion: (index) => {
    const { questions, currentIndex, answers, questionStatus, exam } = get();
    if (index < 0 || index >= questions.length || index === currentIndex) return;

    const currentQ = questions[currentIndex];
    const targetQ = questions[index];
    const updatedStatus = { ...questionStatus };

    // Update current question status before leaving if it hasn't been answered or marked
    const currentAns = answers[currentQ._id];
    const hasAnswer = currentAns !== undefined && currentAns !== null && currentAns.length > 0;
    const currentSt = updatedStatus[currentQ._id];

    if (!hasAnswer && currentSt !== 'MARKED_FOR_REVIEW') {
      updatedStatus[currentQ._id] = 'NOT_ANSWERED';
    }

    // Set target question to NOT_ANSWERED if it was NOT_VISITED
    if (updatedStatus[targetQ._id] === 'NOT_VISITED') {
      updatedStatus[targetQ._id] = 'NOT_ANSWERED';
    }

    set({
      currentIndex: index,
      questionStatus: updatedStatus
    });

    get().syncToLocalStorage();
  },

  // Save selection and go to next question
  saveAndNext: () => {
    const { questions, currentIndex, answers, questionStatus } = get();
    const currentQ = questions[currentIndex];
    const currentAns = answers[currentQ._id];
    const hasAnswer = currentAns !== undefined && currentAns !== null && currentAns.length > 0;
    const updatedStatus = { ...questionStatus };

    if (hasAnswer) {
      if (updatedStatus[currentQ._id] === 'MARKED_FOR_REVIEW' || updatedStatus[currentQ._id] === 'ANSWERED_AND_MARKED_FOR_REVIEW') {
        updatedStatus[currentQ._id] = 'ANSWERED_AND_MARKED_FOR_REVIEW';
      } else {
        updatedStatus[currentQ._id] = 'ANSWERED';
      }
    } else {
      if (updatedStatus[currentQ._id] !== 'MARKED_FOR_REVIEW') {
        updatedStatus[currentQ._id] = 'NOT_ANSWERED';
      }
    }

    const nextIndex = currentIndex + 1 < questions.length ? currentIndex + 1 : currentIndex;
    const nextQ = questions[nextIndex];
    if (updatedStatus[nextQ._id] === 'NOT_VISITED') {
      updatedStatus[nextQ._id] = 'NOT_ANSWERED';
    }

    set({
      currentIndex: nextIndex,
      questionStatus: updatedStatus
    });

    get().syncToLocalStorage();
  },

  // Mark for review & toggle next
  markForReviewAndNext: () => {
    const { questions, currentIndex, answers, questionStatus } = get();
    const currentQ = questions[currentIndex];
    const currentAns = answers[currentQ._id];
    const hasAnswer = currentAns !== undefined && currentAns !== null && currentAns.length > 0;
    const updatedStatus = { ...questionStatus };

    if (hasAnswer) {
      updatedStatus[currentQ._id] = 'ANSWERED_AND_MARKED_FOR_REVIEW';
    } else {
      updatedStatus[currentQ._id] = 'MARKED_FOR_REVIEW';
    }

    const nextIndex = currentIndex + 1 < questions.length ? currentIndex + 1 : currentIndex;
    const nextQ = questions[nextIndex];
    if (updatedStatus[nextQ._id] === 'NOT_VISITED') {
      updatedStatus[nextQ._id] = 'NOT_ANSWERED';
    }

    set({
      currentIndex: nextIndex,
      questionStatus: updatedStatus
    });

    get().syncToLocalStorage();
  },

  // Set answer for active question
  setAnswer: (questionId, value, questionType) => {
    const { answers, questionStatus } = get();
    const updatedAnswers = { ...answers };
    const updatedStatus = { ...questionStatus };

    if (questionType === 'MSQ') {
      const currentList = updatedAnswers[questionId] || [];
      const numVal = Number(value);
      if (currentList.includes(numVal)) {
        updatedAnswers[questionId] = currentList.filter((v) => v !== numVal);
      } else {
        updatedAnswers[questionId] = [...currentList, numVal].sort((a, b) => a - b);
      }
    } else if (questionType === 'MCQ') {
      updatedAnswers[questionId] = [Number(value)];
    } else if (questionType === 'NAT') {
      const parsed = parseFloat(value);
      updatedAnswers[questionId] = isNaN(parsed) ? [] : [parsed];
    }

    // Dynamic status update
    const hasAnswer = updatedAnswers[questionId] && updatedAnswers[questionId].length > 0;
    const currentSt = updatedStatus[questionId];

    if (hasAnswer) {
      if (currentSt === 'MARKED_FOR_REVIEW' || currentSt === 'ANSWERED_AND_MARKED_FOR_REVIEW') {
        updatedStatus[questionId] = 'ANSWERED_AND_MARKED_FOR_REVIEW';
      } else {
        updatedStatus[questionId] = 'ANSWERED';
      }
    } else {
      if (currentSt === 'ANSWERED_AND_MARKED_FOR_REVIEW') {
        updatedStatus[questionId] = 'MARKED_FOR_REVIEW';
      } else {
        updatedStatus[questionId] = 'NOT_ANSWERED';
      }
    }

    set({
      answers: updatedAnswers,
      questionStatus: updatedStatus
    });

    get().syncToLocalStorage();
  },

  // Clear current question response
  clearCurrentResponse: () => {
    const { questions, currentIndex, answers, questionStatus } = get();
    const currentQ = questions[currentIndex];
    const updatedAnswers = { ...answers };
    const updatedStatus = { ...questionStatus };

    delete updatedAnswers[currentQ._id];

    if (updatedStatus[currentQ._id] === 'ANSWERED_AND_MARKED_FOR_REVIEW') {
      updatedStatus[currentQ._id] = 'MARKED_FOR_REVIEW';
    } else {
      updatedStatus[currentQ._id] = 'NOT_ANSWERED';
    }

    set({
      answers: updatedAnswers,
      questionStatus: updatedStatus
    });

    get().syncToLocalStorage();
  },

  // Tick remaining timer down (legacy – kept for compatibility)
  decrementTimer: () => {
    const { timeRemainingSeconds } = get();
    if (timeRemainingSeconds <= 0) return;
    const updated = timeRemainingSeconds - 1;
    set({ timeRemainingSeconds: updated });
    // Periodic local sync every 10 seconds
    if (updated % 10 === 0) {
      get().syncToLocalStorage();
    }
  },

  // Direct setter used by the Web Worker timer hook
  setTimeRemaining: (seconds) => {
    set({ timeRemainingSeconds: seconds });
    // Sync to localStorage every 10 seconds
    if (seconds % 10 === 0) {
      get().syncToLocalStorage();
    }
  },

  // Save current test progress into browser localStorage
  syncToLocalStorage: () => {
    const { exam, answers, questionStatus, currentIndex, timeRemainingSeconds, questions } = get();
    if (!exam?._id) return;
    try {
      const payload = {
        answers,
        questionStatus,
        currentIndex,
        timeRemainingSeconds,
        questionOrder: (questions || []).map((q) => q._id?.toString() || q.id?.toString()).filter(Boolean),
        updatedAt: Date.now()
      };
      localStorage.setItem(getStorageKey(exam._id), JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to sync exam state to localStorage:', err);
    }
  },

  // Clear local storage session on exam submission
  clearStoredSession: () => {
    const { exam, activeExamId } = get();
    const idToClear = exam?._id || activeExamId;
    if (idToClear) {
      localStorage.removeItem(getStorageKey(idToClear));
    }
    localStorage.removeItem('active_exam_id');
    set({
      exam: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      questionStatus: {},
      timeRemainingSeconds: 0,
      isInitialized: false,
      activeExamId: null
    });
  }
}));

export default useExamStore;
