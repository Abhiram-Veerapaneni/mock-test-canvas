import { Exam } from '../models/Exam.model.js';
import { Attempt } from '../models/Attempt.model.js';
import { User } from '../models/User.model.js';
import { gradeAttempt } from '../services/grading.service.js';

/**
 * @desc   Submit an exam attempt and return graded result
 * @route  POST /api/submissions/submit
 * @access Private
 */
export const submitExam = async (req, res) => {
  try {
    const { examId, answers = {} } = req.body;
    const userId = req.user._id;

    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required' });
    }

    // Fetch exam with FULL question data including correctAnswers
    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check attempt limit (null = unlimited)
    if (exam.maxAttempts !== null) {
      const existingCount = await Attempt.countDocuments({
        examId,
        userId,
        status: 'SUBMITTED'
      });
      if (existingCount >= exam.maxAttempts) {
        return res.status(403).json({
          success: false,
          message: `Maximum attempts (${exam.maxAttempts}) reached for this exam.`
        });
      }
    }

    // Grade the attempt
    const result = gradeAttempt(answers, exam.questions, exam.markingScheme);

    // Build response items for the Attempt document
    const responses = exam.questions.map((q) => {
      const qId = q._id.toString();
      const selected = answers[qId] || [];
      return {
        questionId: q._id,
        selectedAnswers: selected,
        status: selected.length > 0 ? 'ANSWERED' : 'NOT_ANSWERED'
      };
    });

    // Create Attempt record
    const attempt = await Attempt.create({
      examId,
      userId,
      responses,
      score: result.score,
      accuracy: result.accuracy,
      correct: result.correct,
      incorrect: result.incorrect,
      unanswered: result.unanswered,
      status: 'SUBMITTED',
      submittedAt: new Date()
    });

    // Register in user's attemptedTests
    await User.findByIdAndUpdate(userId, {
      $push: {
        attemptedTests: {
          examId,
          attemptId: attempt._id,
          completedAt: new Date()
        }
      }
    });

    return res.status(200).json({
      success: true,
      result: {
        attemptId: attempt._id,
        score: result.score,
        accuracy: result.accuracy,
        correct: result.correct,
        incorrect: result.incorrect,
        unanswered: result.unanswered,
        totalQuestions: exam.questions.length,
        totalMarks: exam.totalMarks,
        markingScheme: exam.markingScheme
      }
    });
  } catch (error) {
    console.error('[submitExam] Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * @desc   Get all attempts by the logged-in user for a specific exam
 * @route  GET /api/submissions/my/:examId
 * @access Private
 */
export const getUserAttempts = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user._id;

    const attempts = await Attempt.find({ examId, userId, status: 'SUBMITTED' })
      .select('score accuracy correct incorrect unanswered responses submittedAt createdAt violations')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, attempts });
  } catch (error) {
    console.error('[getUserAttempts] Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
