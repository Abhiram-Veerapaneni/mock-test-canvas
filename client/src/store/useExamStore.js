import { create } from 'zustand';

const getStorageKey = (examId) => `mock_test_session_${examId}`;

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

  // Initialize exam session with localStorage persistence
  initExam: (examData) => {
    if (!examData || !examData.questions || examData.questions.length === 0) return;

    const storageKey = getStorageKey(examData._id);
    const savedSessionRaw = localStorage.getItem(storageKey);

    let initialAnswers = {};
    let initialStatus = {};
    let initialTimeRemaining = (examData.durationMinutes || 180) * 60;
    let initialIndex = 0;

    // Default status for all questions is NOT_VISITED except the first one which becomes NOT_ANSWERED
    examData.questions.forEach((q, idx) => {
      initialStatus[q._id] = idx === 0 ? 'NOT_ANSWERED' : 'NOT_VISITED';
    });

    if (savedSessionRaw) {
      try {
        const parsed = JSON.parse(savedSessionRaw);
        if (parsed.answers) initialAnswers = parsed.answers;
        if (parsed.questionStatus) initialStatus = { ...initialStatus, ...parsed.questionStatus };
        if (typeof parsed.timeRemainingSeconds === 'number' && parsed.timeRemainingSeconds > 0) {
          initialTimeRemaining = parsed.timeRemainingSeconds;
        }
        if (typeof parsed.currentIndex === 'number') initialIndex = parsed.currentIndex;
      } catch (err) {
        console.warn('Could not parse cached session:', err);
      }
    }

    set({
      exam: examData,
      questions: examData.questions,
      currentIndex: initialIndex,
      answers: initialAnswers,
      questionStatus: initialStatus,
      timeRemainingSeconds: initialTimeRemaining,
      isInitialized: true
    });
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
    const { exam, answers, questionStatus, currentIndex, timeRemainingSeconds } = get();
    if (!exam?._id) return;
    try {
      const payload = {
        answers,
        questionStatus,
        currentIndex,
        timeRemainingSeconds,
        updatedAt: Date.now()
      };
      localStorage.setItem(getStorageKey(exam._id), JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to sync exam state to localStorage:', err);
    }
  },

  // Clear local storage session on exam submission
  clearStoredSession: () => {
    const { exam } = get();
    if (exam?._id) {
      localStorage.removeItem(getStorageKey(exam._id));
    }
    set({
      exam: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      questionStatus: {},
      timeRemainingSeconds: 0,
      isInitialized: false
    });
  }
}));

export default useExamStore;
