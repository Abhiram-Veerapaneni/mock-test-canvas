import { Exam } from '../models/Exam.model.js';
import { Question } from '../models/Question.model.js';
import { User } from '../models/User.model.js';
import { Attempt } from '../models/Attempt.model.js';

/**
 * @desc    Create a new exam with bulk questions
 * @route   POST /api/exams
 * @access  Private
 */
export const createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      durationMinutes,
      maxAttempts,
      markingScheme,
      proctorSettings,
      questions
    } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Exam title and at least one question are required'
      });
    }

    // Validate and format questions for insertion
    const questionDocs = questions.map((q) => ({
      questionText: q.questionText,
      questionType: q.questionType || 'MCQ',
      imageAttachment: q.imageAttachment || '',
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswers: Array.isArray(q.correctAnswers) ? q.correctAnswers : [],
      explanation: q.explanation || '',
      subject: q.subject || 'General',
      topic: q.topic || 'General'
    }));

    // Bulk insert questions to obtain IDs
    const insertedQuestions = await Question.insertMany(questionDocs);
    const questionIds = insertedQuestions.map((doc) => doc._id);

    // Calculate total marks based on markingScheme and question count
    const correctMark = markingScheme?.correct ?? 4;
    const incorrectMark = markingScheme?.incorrect ?? -1;
    const totalMarks = questionIds.length * correctMark;

    // Create the exam
    const exam = await Exam.create({
      title: title.trim(),
      description: description || '',
      category: category || 'JEE',
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
      message: 'Exam created successfully',
      exam: {
        _id: exam._id,
        title: exam.title,
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
    const { category, search, page = 1, limit = 12 } = req.query;

    const query = {};

    if (category && category !== 'ALL') {
      query.category = category.toUpperCase();
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const total = await Exam.countDocuments(query);
    const exams = await Exam.find(query)
      .select('title description category durationMinutes totalMarks maxAttempts markingScheme proctorSettings questions createdAt')
      .populate('creatorId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Build a map of examId -> attempt count for the logged-in user
    let userAttemptMap = {};
    if (req.user?._id) {
      const { User } = await import('../models/User.model.js');
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
      creatorName: exam.creatorId?.name || 'Academic Administrator',
      durationMinutes: exam.durationMinutes,
      totalMarks: exam.totalMarks,
      maxAttempts: exam.maxAttempts ?? null, // null = unlimited
      markingScheme: exam.markingScheme,
      proctorSettings: exam.proctorSettings,
      questionCount: exam.questions.length,
      userAttemptCount: userAttemptMap[exam._id.toString()] || 0,
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
 * @desc    Get exam by ID and populated questions (excluding correctAnswers and explanation for test-takers)
 * @route   GET /api/exams/:id
 * @access  Public / Protected
 */
export const getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findById(id).populate({
      path: 'questions',
      // Explicitly exclude correctAnswers and explanation to prevent client-side answer inspection
      select: '-correctAnswers -explanation'
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    return res.status(200).json({
      success: true,
      exam
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
      .select('userId score accuracy correct incorrect unanswered responses violations trustScore status startedAt submittedAt')
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    // Flatten all violations for the violation logs table
    const allViolations = [];
    attempts.forEach((att) => {
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

