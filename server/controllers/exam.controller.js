import { Exam } from '../models/Exam.model.js';
import { Question } from '../models/Question.model.js';
import { User } from '../models/User.model.js';

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
      markingScheme: {
        correct: correctMark,
        incorrect: incorrectMark
      },
      questions: questionIds,
      proctorSettings: {
        faceCheck: proctorSettings?.faceCheck ?? true,
        audioCheck: proctorSettings?.audioCheck ?? true,
        fullScreenLock: proctorSettings?.fullScreenLock ?? true,
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
      .select('title description category durationMinutes totalMarks markingScheme proctorSettings questions createdAt')
      .populate('creatorId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const formattedExams = exams.map((exam) => ({
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      category: exam.category,
      creatorName: exam.creatorId?.name || 'Academic Administrator',
      durationMinutes: exam.durationMinutes,
      totalMarks: exam.totalMarks,
      markingScheme: exam.markingScheme,
      proctorSettings: exam.proctorSettings,
      questionCount: exam.questions.length,
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
