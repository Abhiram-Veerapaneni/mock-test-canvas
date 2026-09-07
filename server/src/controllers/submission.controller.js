import { Exam } from '../models/Exam.model.js';
import { Attempt } from '../models/Attempt.model.js';
import { User } from '../models/User.model.js';
import { gradeAttempt } from '../services/grading.service.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

/**
 * @desc   Initialize or retrieve an active exam attempt
 * @route  POST /api/submissions/start
 * @access Private
 */
export const startAttempt = async (req, res) => {
  try {
    const { examId } = req.body;
    const userId = req.user._id;

    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check attempt limit (null = unlimited)
    if (exam.maxAttempts !== null) {
      const existingCount = await Attempt.countDocuments({
        examId,
        userId,
        status: 'SUBMITTED',
      });
      if (existingCount >= exam.maxAttempts) {
        return res.status(403).json({
          success: false,
          message: `Maximum attempts (${exam.maxAttempts}) reached for this exam.`,
        });
      }
    }

    // Find existing IN_PROGRESS attempt or create a new one
    let attempt = await Attempt.findOne({
      examId,
      userId,
      status: 'IN_PROGRESS',
    }).sort({ createdAt: -1 });

    if (!attempt) {
      attempt = await Attempt.create({
        examId,
        userId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        trustScore: 100,
        violations: [],
      });
    }

    return res.status(200).json({
      success: true,
      attemptId: attempt._id,
      trustScore: attempt.trustScore,
      violations: attempt.violations,
    });
  } catch (error) {
    console.error('[startAttempt] Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

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

    // Check if there is an existing IN_PROGRESS attempt to complete
    let attempt = await Attempt.findOne({ examId, userId, status: 'IN_PROGRESS' }).sort({ createdAt: -1 });

    if (attempt) {
      attempt.responses = responses;
      attempt.score = result.score;
      attempt.accuracy = result.accuracy;
      attempt.correct = result.correct;
      attempt.incorrect = result.incorrect;
      attempt.unanswered = result.unanswered;
      attempt.status = 'SUBMITTED';
      attempt.submittedAt = new Date();
      if (Array.isArray(req.body.violations) && req.body.violations.length > 0) {
        const existingTimestamps = new Set(attempt.violations.map((v) => new Date(v.timestamp).getTime()));
        req.body.violations.forEach((v) => {
          const t = new Date(v.timestamp || Date.now()).getTime();
          if (!existingTimestamps.has(t)) {
            attempt.violations.push({
              type: v.type,
              timestamp: v.timestamp || new Date(),
              imageUrl: v.imageUrl || '',
            });
          }
        });
      }
      await attempt.save();
    } else {
      // Create Attempt record
      attempt = await Attempt.create({
        examId,
        userId,
        responses,
        score: result.score,
        accuracy: result.accuracy,
        correct: result.correct,
        incorrect: result.incorrect,
        unanswered: result.unanswered,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        violations: Array.isArray(req.body.violations) ? req.body.violations : []
      });
    }

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

/**
 * @desc   Log a proctoring violation with optional snapshot upload to Cloudinary
 * @route  POST /api/submissions/:id/violation
 * @access Private
 *
 * Body (multipart/form-data):
 *   - type: string (violation type, e.g. 'NO_FACE', 'MULTI_FACE', 'NOISE_SPIKE')
 *   - snapshot: file (optional JPEG/PNG/WebP image buffer)
 *
 * Behavior:
 *   1. Validates the attempt exists and belongs to the authenticated user.
 *   2. If a snapshot file is provided and Cloudinary is configured, uploads it.
 *   3. Pushes a violation record (type, timestamp, imageUrl) onto the Attempt.
 *   4. Deducts 15 points from the Attempt's trustScore (min 0).
 *   5. Returns the updated violations array and trustScore.
 */
export const logViolation = async (req, res) => {
  try {
    const { id: attemptId } = req.params;
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, message: 'Violation type is required' });
    }

    // Find the attempt and verify ownership
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }
    if (attempt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Only allow violations on active attempts
    if (attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Cannot log violations on a submitted or disqualified attempt'
      });
    }

    // Fetch exam info
    const exam = await Exam.findById(attempt.examId).select('title creatorId proctorSettings');

    let imageUrl = '';

    // Upload snapshot to Cloudinary if a file was provided and Cloudinary is configured
    if (req.file && isCloudinaryConfigured()) {
      try {
        const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const sanitizedExamTitle = (exam?.title || 'exam')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .slice(0, 40);
        const sanitizedUsername = (req.user?.name || req.user?.email || 'candidate')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .slice(0, 30);

        const folder = `mock-test-canvas/violations/${attempt.examId}_${sanitizedExamTitle}/${dateStr}`;
        const timestamp = Date.now();
        // format: <examtitle>_<timestamp>_<userid>_<username>
        const public_id = `${sanitizedExamTitle}_${timestamp}_${req.user._id}_${sanitizedUsername}`;

        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              public_id,
              resource_type: 'image',
              format: 'jpg',
              transformation: [
                { width: 640, height: 480, crop: 'limit' },
                { quality: 'auto:good' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          uploadStream.end(req.file.buffer);
        });

        imageUrl = uploadResult.secure_url;
        console.log(`[logViolation] Snapshot uploaded to ${folder}/${public_id}: ${imageUrl}`);
      } catch (uploadErr) {
        // Don't fail the entire request if Cloudinary upload fails
        console.error('[logViolation] Cloudinary upload failed:', uploadErr.message);
      }
    } else if (req.file && !isCloudinaryConfigured()) {
      console.warn('[logViolation] Snapshot provided but Cloudinary is not configured — skipping upload');
    }

    // Build violation record
    const violation = {
      type,
      timestamp: new Date(),
      imageUrl,
    };

    // Deduct trust score (min 0)
    const DEDUCTION = 15;
    const newTrustScore = Math.max(0, attempt.trustScore - DEDUCTION);

    // Atomic update: push violation + update trustScore
    const updatedAttempt = await Attempt.findByIdAndUpdate(
      attemptId,
      {
        $push: { violations: violation },
        $set: { trustScore: newTrustScore },
      },
      { new: true, select: 'violations trustScore status' }
    );

    // Broadcast live violation to creator and exam rooms via Socket.IO
    try {
      const io = req.app.get('io');
      if (io && exam) {
        const alertPayload = {
          examId: exam._id,
          examTitle: exam.title,
          attemptId: attempt._id,
          userId: req.user._id,
          userName: req.user.name || 'Candidate',
          userEmail: req.user.email,
          type: violation.type,
          timestamp: violation.timestamp,
          imageUrl: violation.imageUrl,
          trustScore: updatedAttempt.trustScore,
          totalViolations: updatedAttempt.violations.length,
          liveNotificationsEnabled: !!exam.proctorSettings?.liveNotifications,
        };

        io.to(`exam_${exam._id}`).emit('violation:live', alertPayload);
        if (exam.creatorId) {
          io.to(`creator_${exam.creatorId}`).emit('violation:live', alertPayload);
        }
        console.log(`[Socket.IO] Broadcasted violation (${type}) to creator_${exam.creatorId} & exam_${exam._id}`);
      }
    } catch (socketErr) {
      console.warn('[logViolation] Socket broadcast warning:', socketErr?.message);
    }

    return res.status(200).json({
      success: true,
      violation,
      trustScore: updatedAttempt.trustScore,
      totalViolations: updatedAttempt.violations.length,
    });
  } catch (error) {
    console.error('[logViolation] Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

