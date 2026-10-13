import { Exam } from '../models/Exam.model.js';
import { Question } from '../models/Question.model.js';
import { User } from '../models/User.model.js';
import { Attempt } from '../models/Attempt.model.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const escapeRegex = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

/**
 * @desc   Upload a question or option image to Cloudinary
 * @route  POST /api/exams/upload-media
 * @access Private
 */
export const uploadExamMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary credentials are not configured on the server.'
      });
    }

    const { examId = 'draft', examTitle = 'exam', type = 'question' } = req.body;

    // Clean examTitle for folder and public_id slug
    const cleanTitle = (examTitle || 'exam')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'exam';

    const cleanExamId = (examId || 'draft')
      .toString()
      .trim()
      .replace(/[^a-z0-9_-]+/g, '_');

    // Folder format: mock-test-canvas/questions-and-options/{examtitle}_{examid}
    const folder = `mock-test-canvas/questions-and-options/${cleanTitle}_${cleanExamId}`;

    // Public ID format: {question|option}_timestamp_examtitle
    const mediaType = type === 'option' ? 'option' : 'question';
    const publicId = `${mediaType}_${Date.now()}_${cleanTitle}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          console.error('[uploadExamMedia] Cloudinary error:', error);
          return res.status(500).json({ success: false, message: error.message });
        }
        return res.status(200).json({
          success: true,
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error('[uploadExamMedia] Server error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error uploading media' });
  }
};

/**
 * @desc    Create a new exam with bulk questions (Draft or Published)
 * @route   POST /api/exams
 * @access  Private
 */
export const createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      status = 'published',
      durationMinutes,
      maxAttempts,
      markingScheme,
      proctorSettings,
      allowPracticeMode = true,
      allowReviewResponses = true,
      schedule,
      questions
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Exam title is required'
      });
    }

    const isDraft = status === 'draft';
    const questionsArray = Array.isArray(questions) ? questions : [];

    if (!isDraft && questionsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one question is required to publish an examination'
      });
    }

    let questionIds = [];
    if (questionsArray.length > 0) {
      // Validate and format questions for insertion
      const questionDocs = questionsArray.map((q) => {
        const contribute = Boolean(q.contributeToBank || q.isInBank);
        const streamVal = q.stream || q.subject || 'General';
        const tagsVal = Array.isArray(q.tags)
          ? q.tags
          : (q.topic && q.topic !== 'General' ? [q.topic] : []);

        return {
          questionText: q.questionText || '',
          questionType: q.questionType || 'MCQ',
          imageAttachment: q.imageAttachment || '',
          options: Array.isArray(q.options)
            ? q.options.map((opt) => {
                if (typeof opt === 'object' && opt !== null) {
                  return { text: opt.text || '', image: opt.image || '' };
                }
                return opt;
              })
            : [],
          correctAnswers: Array.isArray(q.correctAnswers) ? q.correctAnswers : [],
          explanation: q.explanation || '',
          subject: streamVal,
          topic: (tagsVal.length > 0 ? tagsVal[0] : q.topic) || 'General',
          stream: streamVal,
          tags: tagsVal,
          isInBank: contribute,
          bankAddedBy: contribute ? req.user?._id : undefined,
          isEdited: false
        };
      });

      // Bulk insert questions to obtain IDs
      const insertedQuestions = await Question.insertMany(questionDocs);
      questionIds = insertedQuestions.map((doc) => doc._id);
    }

    // Calculate total marks based on markingScheme and question count
    const correctMark = markingScheme?.correct ?? 4;
    const incorrectMark = markingScheme?.incorrect ?? -1;
    const totalMarks = questionIds.length * correctMark;

    // Create the exam
    const exam = await Exam.create({
      title: title.trim(),
      description: description || '',
      category: category || 'JEE',
      status: isDraft ? 'draft' : 'published',
      creatorId: req.user?._id,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 180,
      totalMarks,
      maxAttempts: (maxAttempts === null || maxAttempts === 0 || maxAttempts === 'unlimited')
        ? null
        : Math.max(1, Number(maxAttempts)) || 1,
      markingScheme: {
        correct: correctMark,
        incorrect: incorrectMark
      },
      allowPracticeMode: allowPracticeMode !== undefined ? Boolean(allowPracticeMode) : true,
      allowReviewResponses: allowReviewResponses !== undefined ? Boolean(allowReviewResponses) : true,
      schedule: {
        isScheduled: Boolean(schedule?.isScheduled),
        startTime: schedule?.startTime ? new Date(schedule.startTime) : null,
        endTime: schedule?.endTime ? new Date(schedule.endTime) : null
      },
      questions: questionIds,
      proctorSettings: {
        faceCheck: proctorSettings?.faceCheck ?? true,
        audioCheck: proctorSettings?.audioCheck ?? true,
        fullScreenLock: proctorSettings?.fullScreenLock ?? true,
        liveNotifications: proctorSettings?.liveNotifications ?? false,
        objectCheck: proctorSettings?.objectCheck ?? true,
        maxWarningsAllowed: proctorSettings?.maxWarningsAllowed ?? 3
      }
    });

    // Register exam ID under user's createdTests
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: { createdTests: exam._id }
      });
    }

    return res.status(201).json({
      success: true,
      message: isDraft ? 'Draft saved successfully' : 'Exam published successfully',
      exam: {
        _id: exam._id,
        title: exam.title,
        status: exam.status,
        category: exam.category,
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        questionCount: exam.questions.length,
        createdAt: exam.createdAt
      }
    });
  } catch (error) {
    console.error('Create exam error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating exam'
    });
  }
};

/**
 * @desc    Get all available exams with pagination & filters
 * @route   GET /api/exams
 * @access  Public
 */
export const getAllExams = async (req, res) => {
  try {
    const { category, search, status, page = 1, limit = 24 } = req.query;

    const andConditions = [];

    if (category && category !== 'ALL') {
      andConditions.push({ category: category.toUpperCase() });
    }

    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      andConditions.push({
        $or: [
          { title: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } }
        ]
      });
    }

    // Status and visibility filter:
    // Public catalog only includes published, public exams (not private generated tests).
    // Authenticated users also see their own exams (drafts and private generated practice tests).
    const publicCondition = {
      status: 'published',
      $or: [
        { isPublic: true },
        { isPublic: { $exists: false }, isGenerated: { $ne: true } }
      ]
    };

    if (status) {
      andConditions.push({ status });
    } else if (req.user?._id) {
      andConditions.push({
        $or: [
          publicCondition,
          { creatorId: req.user._id }
        ]
      });
    } else {
      andConditions.push(publicCondition);
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 24));
    const skip = (pageNumber - 1) * limitNumber;

    const total = await Exam.countDocuments(query);
    const exams = await Exam.find(query)
      .select('title description category status durationMinutes totalMarks maxAttempts markingScheme proctorSettings allowPracticeMode allowReviewResponses schedule questions createdAt creatorId isGenerated isPublic examType')
      .populate('creatorId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Build a map of examId -> attempt count for the logged-in user
    let userAttemptMap = {};
    if (req.user?._id) {
      const userDoc = await User.findById(req.user._id).select('attemptedTests').lean();
      if (userDoc?.attemptedTests) {
        userDoc.attemptedTests.forEach((a) => {
          const id = a.examId.toString();
          userAttemptMap[id] = (userAttemptMap[id] || 0) + 1;
        });
      }
    }

    const formattedExams = exams.map((exam) => ({
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      category: exam.category,
      status: exam.status || 'published',
      isCreator: req.user?._id ? (exam.creatorId?._id?.toString() === req.user._id.toString()) : false,
      creatorName: exam.creatorId?.name || 'Academic Administrator',
      durationMinutes: exam.durationMinutes,
      totalMarks: exam.totalMarks,
      maxAttempts: exam.maxAttempts ?? null, // null = unlimited
      markingScheme: exam.markingScheme,
      proctorSettings: exam.proctorSettings,
      allowPracticeMode: exam.allowPracticeMode ?? true,
      allowReviewResponses: exam.allowReviewResponses ?? true,
      schedule: exam.schedule || { isScheduled: false },
      questionCount: exam.questions?.length || 0,
      userAttemptCount: userAttemptMap[exam._id.toString()] || 0,
      isGenerated: Boolean(exam.isGenerated),
      isPublic: exam.isPublic !== false,
      examType: exam.examType || (exam.isGenerated ? 'practice' : 'official'),
      createdAt: exam.createdAt
    }));

    return res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      exams: formattedExams
    });
  } catch (error) {
    console.error('Get all exams error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching exams'
    });
  }
};

/**
 * @desc    Get exam by ID and populated questions
 *          (Includes correctAnswers and explanation ONLY for authoring creators; excludes them for candidates and all generated practice tests)
 * @route   GET /api/exams/:id
 * @access  Public / Protected
 */
export const getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    // First fetch metadata to check authorization
    const metaExam = await Exam.findById(id).select('creatorId isGenerated isPublic examType');
    if (!metaExam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const isOwner = Boolean(
      userId && metaExam.creatorId && metaExam.creatorId.toString() === userId.toString()
    );

    // Private assessment access control: if test is private, only owner can view
    if (metaExam.isPublic === false && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'This practice test is private to its creator and has not been made public.'
      });
    }

    // Authoring mode vs Player mode:
    // For standard exams, creator/owner gets authoring mode.
    // For generated practice tests (isGenerated === true), default to candidate mode so the user doesn't accidentally spoil answers if self-testing.
    // However, if the owner explicitly requests reveal=true (confirmed via modal to view/modify questions before conducting),
    // provide full authoring access with populated answers and explanations!
    const wantReveal = req.query.reveal === 'true' || req.query.authoring === 'true';
    const isAuthoringCreator = isOwner && (!metaExam.isGenerated || wantReveal);

    let exam;
    if (isAuthoringCreator) {
      // Authoring creator in studio gets all question details (including correct answers, explanation, isEdited)
      exam = await Exam.findById(id).populate('questions');
    } else {
      // Candidates and ALL generated test takers NEVER receive correctAnswers, explanation, tags, stream, or bankAddedBy
      exam = await Exam.findById(id).populate({
        path: 'questions',
        select: '-correctAnswers -explanation -tags -stream -bankAddedBy'
      });
    }

    const examObj = exam.toObject();
    examObj.questions = (examObj.questions || []).filter(Boolean);

    return res.status(200).json({
      success: true,
      isCreator: isAuthoringCreator,
      isOwner,
      exam: examObj
    });
  } catch (error) {
    console.error('Get exam by ID error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching exam'
    });
  }
};

/**
 * @desc    Update an existing exam and its questions (draft or published)
 *          Preserves question re-ordering and marks questions as isEdited: true if exam was already published
 * @route   PUT /api/exams/:id
 * @access  Private (Creator only)
 */
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const existingExam = await Exam.findById(id).populate('questions');
    if (!existingExam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (existingExam.creatorId && existingExam.creatorId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Only the creator of this exam can edit it.'
      });
    }

    const {
      title,
      description,
      category,
      status,
      durationMinutes,
      maxAttempts,
      markingScheme,
      proctorSettings,
      allowPracticeMode,
      allowReviewResponses,
      schedule,
      questions
    } = req.body;

    const wasPublished = existingExam.status === 'published';

    if (title && title.trim()) existingExam.title = title.trim();
    if (description !== undefined) existingExam.description = description.trim();
    if (category) existingExam.category = category;
    if (status) existingExam.status = status;
    if (durationMinutes) existingExam.durationMinutes = Number(durationMinutes);
    if (maxAttempts !== undefined) {
      existingExam.maxAttempts = (maxAttempts === null || maxAttempts === 0 || maxAttempts === 'unlimited')
        ? null
        : Math.max(1, Number(maxAttempts)) || 1;
    }
    if (markingScheme) {
      existingExam.markingScheme = {
        correct: markingScheme.correct ?? existingExam.markingScheme?.correct ?? 4,
        incorrect: markingScheme.incorrect ?? existingExam.markingScheme?.incorrect ?? -1
      };
    }
    if (proctorSettings) {
      existingExam.proctorSettings = {
        ...existingExam.proctorSettings?.toObject?.(),
        ...proctorSettings
      };
    }
    if (allowPracticeMode !== undefined) {
      existingExam.allowPracticeMode = Boolean(allowPracticeMode);
    }
    if (allowReviewResponses !== undefined) {
      existingExam.allowReviewResponses = Boolean(allowReviewResponses);
    }
    if (req.body.isPublic !== undefined) {
      existingExam.isPublic = Boolean(req.body.isPublic);
    }
    if (schedule !== undefined) {
      existingExam.schedule = {
        isScheduled: Boolean(schedule?.isScheduled),
        startTime: schedule?.startTime ? new Date(schedule.startTime) : null,
        endTime: schedule?.endTime ? new Date(schedule.endTime) : null
      };
    }

    // Process questions array and preserve order
    if (Array.isArray(questions)) {
      const existingQuestionsMap = new Map();
      existingExam.questions.forEach((q) => {
        existingQuestionsMap.set(q._id.toString(), q);
      });

      const updatedQuestionIds = [];

      for (const q of questions) {
        const qId = q._id ? q._id.toString() : null;
        const existingQ = qId ? existingQuestionsMap.get(qId) : null;

        const formattedOptions = Array.isArray(q.options)
          ? q.options.map((opt) => {
              if (typeof opt === 'object' && opt !== null) {
                return { text: opt.text || '', image: opt.image || '' };
              }
              return opt;
            })
          : [];

        if (existingQ) {
          // Detect changes in fields
          const textChanged = (q.questionText || '') !== (existingQ.questionText || '');
          const imageChanged = (q.imageAttachment || '') !== (existingQ.imageAttachment || '');
          const typeChanged = (q.questionType || 'MCQ') !== existingQ.questionType;
          const subjectChanged = (q.subject || 'General') !== existingQ.subject;
          const topicChanged = (q.topic || 'General') !== existingQ.topic;
          const explanationChanged = (q.explanation || '') !== (existingQ.explanation || '');
          const optionsChanged = JSON.stringify(formattedOptions) !== JSON.stringify(existingQ.options);
          const answersChanged = JSON.stringify(q.correctAnswers || []) !== JSON.stringify(existingQ.correctAnswers || []);

          const isModified = textChanged || imageChanged || typeChanged || subjectChanged || topicChanged || explanationChanged || optionsChanged || answersChanged;

          // If the exam was published and question was edited, tag it
          const shouldTagEdited = existingQ.isEdited || (wasPublished && isModified) || q.isEdited;

          existingQ.questionText = q.questionText || '';
          existingQ.questionType = q.questionType || 'MCQ';
          existingQ.imageAttachment = q.imageAttachment || '';
          existingQ.options = formattedOptions;
          existingQ.correctAnswers = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];
          existingQ.explanation = q.explanation || '';
          existingQ.subject = q.subject || 'General';
          if (q.stream) existingQ.stream = q.stream;
          if (Array.isArray(q.tags)) existingQ.tags = q.tags;
          if (q.contributeToBank || q.isInBank) {
            existingQ.isInBank = true;
            if (!existingQ.bankAddedBy) existingQ.bankAddedBy = userId;
          }

          if (shouldTagEdited) {
            existingQ.isEdited = true;
            existingQ.editedAt = new Date();
          }

          await existingQ.save();
          updatedQuestionIds.push(existingQ._id);
        } else {
          // Brand new question added during edit
          const isNewEdited = wasPublished || q.isEdited;
          const contribute = Boolean(q.contributeToBank || q.isInBank);
          const streamVal = q.stream || q.subject || 'General';
          const tagsVal = Array.isArray(q.tags)
            ? q.tags
            : (q.topic && q.topic !== 'General' ? [q.topic] : []);

          const newQ = await Question.create({
            questionText: q.questionText || '',
            questionType: q.questionType || 'MCQ',
            imageAttachment: q.imageAttachment || '',
            options: formattedOptions,
            correctAnswers: Array.isArray(q.correctAnswers) ? q.correctAnswers : [],
            explanation: q.explanation || '',
            subject: streamVal,
            topic: (tagsVal.length > 0 ? tagsVal[0] : q.topic) || 'General',
            stream: streamVal,
            tags: tagsVal,
            isInBank: contribute,
            bankAddedBy: contribute ? userId : undefined,
            isEdited: isNewEdited,
            editedAt: isNewEdited ? new Date() : undefined
          });
          updatedQuestionIds.push(newQ._id);
        }
      }

      existingExam.questions = updatedQuestionIds;
    }

    const correctMark = existingExam.markingScheme?.correct ?? 4;
    existingExam.totalMarks = existingExam.questions.length * correctMark;

    await existingExam.save();

    const populatedExam = await Exam.findById(existingExam._id).populate('questions');

    return res.status(200).json({
      success: true,
      message: 'Examination updated successfully',
      exam: populatedExam
    });
  } catch (error) {
    console.error('Update exam error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating exam'
    });
  }
};

/**
 * @desc    Get all violations & snapshot images for an exam (creator only)
 * @route   GET /api/exams/:id/live-violations
 * @access  Private (Creator only)
 */
export const getExamViolations = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const exam = await Exam.findById(id).select('title creatorId proctorSettings');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Ensure the requester is the creator of the exam (if creator is specified)
    if (exam.creatorId && exam.creatorId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Only the creator of this exam can view live violations.'
      });
    }

    // Find all attempts for this exam (for both violation logs and completion reports)
    const attempts = await Attempt.find({ examId: id })
      .select('userId score accuracy correct incorrect unanswered responses violations trustScore status startedAt submittedAt timeTakenSeconds isPractice')
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    // Flatten all violations for the violation logs table (filter out practice attempts)
    const allViolations = [];
    attempts.forEach((att) => {
      if (att.isPractice) return; // Do not display practice violations in examiner audit
      const userTotalViolations = att.violations?.length || 0;
      att.violations.forEach((v) => {
        allViolations.push({
          attemptId: att._id,
          userId: att.userId?._id,
          userName: att.userId?.name || 'Anonymous Candidate',
          userEmail: att.userId?.email || '',
          userAvatar: att.userId?.avatar || '',
          candidateTrustScore: att.trustScore,
          attemptStatus: att.status,
          type: v.type,
          timestamp: v.timestamp,
          imageUrl: v.imageUrl,
          noOfViolations: userTotalViolations,
        });
      });
    });

    // Sort violations by timestamp newest first
    allViolations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Build completion reports for users who submitted / attempted the test
    const completionReport = attempts.map((att) => {
      let answeredCount = 0;
      if (typeof att.correct === 'number' || typeof att.incorrect === 'number') {
        answeredCount = (att.correct || 0) + (att.incorrect || 0);
      } else if (Array.isArray(att.responses)) {
        answeredCount = att.responses.filter((r) => r.selectedAnswers?.length > 0).length;
      }

      const totalQ = exam.questions?.length || 0;
      const unansweredCount = typeof att.unanswered === 'number'
        ? att.unanswered
        : Math.max(0, totalQ - answeredCount);

      return {
        attemptId: att._id,
        user: att.userId ? {
          _id: att.userId._id,
          name: att.userId.name || 'Anonymous Candidate',
          email: att.userId.email || '',
          avatar: att.userId.avatar || '',
        } : { name: 'Deleted User', email: '' },
        score: att.score ?? 0,
        accuracy: att.accuracy ?? 0,
        correct: att.correct ?? 0,
        incorrect: att.incorrect ?? 0,
        answeredCount,
        unansweredCount,
        violationsCount: att.violations?.length || 0,
        trustScore: att.trustScore ?? 100,
        status: att.status,
        isPractice: Boolean(att.isPractice),
        timeTakenSeconds: att.timeTakenSeconds || 0,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt || att.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        questionCount: exam.questions?.length || 0,
        proctorSettings: exam.proctorSettings,
        schedule: exam.schedule,
        allowPracticeMode: exam.allowPracticeMode,
        allowReviewResponses: exam.allowReviewResponses
      },
      totalViolations: allViolations.length,
      violations: allViolations,
      completionReport,
    });
  } catch (error) {
    console.error('Get exam violations error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching exam violations'
    });
  }
};

/**
 * @desc    Delete an exam or draft assessment (creator or admin only)
 * @route   DELETE /api/exams/:id
 * @access  Private (Creator only)
 */
export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const isCreator = exam.creatorId && exam.creatorId.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Only the creator of this assessment can discard or delete it.'
      });
    }

    // Clean up questions that are NOT marked as part of the question bank
    if (Array.isArray(exam.questions) && exam.questions.length > 0) {
      await Question.deleteMany({
        _id: { $in: exam.questions },
        isInBank: { $ne: true }
      });
    }

    // Clean up any attempts recorded for this exam
    await Attempt.deleteMany({ examId: id });

    await Exam.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Assessment draft discarded and permanently removed.'
    });
  } catch (err) {
    console.error('Delete exam error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error deleting exam'
    });
  }
};
