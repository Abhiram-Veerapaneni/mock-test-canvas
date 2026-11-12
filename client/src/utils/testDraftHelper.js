/**
 * Utility helpers to manage Test Creator local drafts seamlessly across the app.
 */

// Helper to determine the draft key matching useTestCreationDraft
export const getDraftStorageKey = (userId, examId = null) => {
  const uId = userId || 'guest';
  return examId ? `pmt_draft_exam_${uId}_${examId}` : `pmt_draft_exam_${uId}_new`;
};

// Locate any active draft for a new exam in localStorage
export const findLocalDraftForNew = (userId) => {
  const uId = userId || 'guest';
  if (uId && uId !== 'guest') {
    const scopedKey = `pmt_draft_exam_${uId}_new`;
    const raw = localStorage.getItem(scopedKey);
    if (raw) return { key: scopedKey, raw };
  }
  const generalKey = 'pmt_draft_exam_new';
  const rawGen = localStorage.getItem(generalKey);
  if (rawGen) return { key: generalKey, raw: rawGen };

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('pmt_draft_exam_') && k.endsWith('_new')) {
      const raw = localStorage.getItem(k);
      if (raw) return { key: k, raw };
    }
  }
  return null;
};

// Normalizes a QuestionBank question object into the shape expected by TestCreationPage
export const normalizeBankQuestionForDraft = (bankQ) => {
  if (!bankQ) return null;

  // Normalize options array
  const normalizedOptions = Array.isArray(bankQ.options)
    ? bankQ.options.map((opt) => {
        if (typeof opt === 'object' && opt !== null) {
          return {
            text: opt.text || '',
            image: opt.image || ''
          };
        }
        return {
          text: String(opt || ''),
          image: ''
        };
      })
    : [];

  const subjectVal = bankQ.subject || bankQ.stream || 'General';
  const streamVal = bankQ.stream || bankQ.subject || 'General';
  const topicVal = bankQ.topic || 'General';

  return {
    _id: bankQ._id || undefined,
    questionText: bankQ.questionText || '',
    questionType: bankQ.questionType || 'MCQ',
    subject: subjectVal,
    topic: topicVal,
    stream: streamVal,
    tags: Array.isArray(bankQ.tags) ? [...bankQ.tags] : [],
    imageAttachment: bankQ.imageAttachment || '',
    options: bankQ.questionType === 'NAT' ? [] : normalizedOptions,
    correctAnswers: Array.isArray(bankQ.correctAnswers) ? [...bankQ.correctAnswers] : [],
    explanation: bankQ.explanation || '',
    contributeToBank: false,
    isInBank: true
  };
};

/**
 * Appends an array of questions from the Question Bank into the user's active Test Creator draft.
 * If no draft exists, a new draft initialized with sensible defaults is created.
 *
 * @param {string|null} userId - Active user's _id or null for guest
 * @param {Array} rawQuestions - Array of question bank objects to add
 * @returns {{ success: boolean, addedCount: number, skippedCount: number, totalInDraft: number, error?: string }}
 */
export const addQuestionsToTestDraft = (userId, rawQuestions) => {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return { success: false, addedCount: 0, skippedCount: 0, totalInDraft: 0, error: 'No questions provided' };
  }

  try {
    const existingMatch = findLocalDraftForNew(userId);
    let draft = null;
    let targetKey = existingMatch?.key || getDraftStorageKey(userId, null);

    if (existingMatch?.raw) {
      try {
        draft = JSON.parse(existingMatch.raw);
      } catch (parseErr) {
        console.warn('Failed to parse existing draft JSON, initializing fresh draft', parseErr);
        draft = null;
      }
    }

    // Default structure matching TestCreationPage state
    if (!draft || typeof draft !== 'object') {
      draft = {
        existingExamId: null,
        title: 'Custom Assessment Draft',
        description: '',
        category: 'CUSTOM',
        durationMinutes: 60,
        correctMark: 4,
        incorrectMark: -1,
        isUnlimitedAttempts: true,
        maxAttemptsValue: 3,
        allowPracticeMode: true,
        allowReviewResponses: true,
        isScheduled: false,
        startTime: '',
        endTime: '',
        faceCheck: true,
        audioCheck: true,
        fullScreenLock: true,
        objectCheck: true,
        liveNotifications: false,
        questions: [],
        contributeAllToBank: false,
        examStatus: 'draft',
        activeStudioTab: 'questions'
      };
    }

    const currentQuestions = Array.isArray(draft.questions) ? draft.questions : [];

    let addedCount = 0;
    let skippedCount = 0;
    const newQuestionsToAdd = [];

    for (const rawQ of rawQuestions) {
      const normalized = normalizeBankQuestionForDraft(rawQ);
      if (!normalized) continue;

      // Duplicate check by _id or trimmed questionText
      const isDuplicate = currentQuestions.some((existing) => {
        if (normalized._id && existing._id && String(existing._id) === String(normalized._id)) {
          return true;
        }
        if (
          normalized.questionText &&
          existing.questionText &&
          normalized.questionText.trim() === existing.questionText.trim() &&
          normalized.questionType === existing.questionType
        ) {
          return true;
        }
        return false;
      });

      if (isDuplicate) {
        skippedCount++;
      } else {
        newQuestionsToAdd.push(normalized);
        currentQuestions.push(normalized);
        addedCount++;
      }
    }

    draft.questions = currentQuestions;
    draft.hasUnsavedChanges = true;
    draft.isSyncedWithServer = false;
    draft.savedAt = new Date().toISOString();

    // Auto-adjust duration if the count now warrants a longer test
    if (draft.durationMinutes < currentQuestions.length * 2) {
      draft.durationMinutes = currentQuestions.length * 2;
    }

    localStorage.setItem(targetKey, JSON.stringify(draft));

    return {
      success: true,
      addedCount,
      skippedCount,
      totalInDraft: currentQuestions.length
    };
  } catch (err) {
    console.error('Error saving questions to test draft:', err);
    return {
      success: false,
      addedCount: 0,
      skippedCount: 0,
      totalInDraft: 0,
      error: err.message || 'Failed to update test draft.'
    };
  }
};

