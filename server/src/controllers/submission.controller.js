import { Exam } from '../models/Exam.model.js';
import { Attempt } from '../models/Attempt.model.js';
import { User } from '../models/User.model.js';
import { Notification } from '../models/Notification.model.js';
import { gradeAttempt } from '../services/grading.service.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

/**
 * @desc   Initialize or retrieve an active exam attempt
 * @route  POST /api/submissions/start
 * @access Private
 */
export const startAttempt = async (req, res) => {
  try {
    const { examId, isPractice = false } = req.body;
    const userId = req.user._id;

    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const now = new Date();

    // 1. PRACTICE MODE VALIDATIONS
    if (isPractice) {
      // Check if examiner allows practice mode
      if (exam.allowPracticeMode === false) {
        return res.status(403).json({
          success: false,
          message: 'Practice mode is not allowed for this exam.'
        });
      }

      // If exam is scheduled, practice mode is only unlocked after the schedule ends
      if (exam.schedule?.isScheduled && exam.schedule?.endTime && now < new Date(exam.schedule.endTime)) {
        return res.status(403).json({
          success: false,
          message: `Practice mode for this scheduled exam will only be unlocked after the exam schedule concludes at ${new Date(exam.schedule.endTime).toLocaleString()}.`
        });
      }
      // Practice mode does NOT consume or check official maxAttempts limit
    } else {
      // 2. OFFICIAL ATTEMPT VALIDATIONS
      // Schedule Window enforcement
      if (exam.schedule?.isScheduled) {
        if (exam.schedule.startTime && now < new Date(exam.schedule.startTime)) {
          return res.status(403).json({
            success: false,
            message: `This examination has not started yet. Testing window opens at ${new Date(exam.schedule.startTime).toLocaleString()}.`
          });
        }
        if (exam.schedule.endTime && now > new Date(exam.schedule.endTime)) {
          return res.status(403).json({
            success: false,
            message: `The scheduled testing window for this exam concluded at ${new Date(exam.schedule.endTime).toLocaleString()}.`
          });
        }
      }

      // Check official attempt limit (null = unlimited)
      if (exam.maxAttempts !== null) {
        const existingCount = await Attempt.countDocuments({
          examId,
          userId,
          status: 'SUBMITTED',
          isPractice: { $ne: true }
        });
        if (existingCount >= exam.maxAttempts) {
          return res.status(403).json({
            success: false,
            message: `Maximum official attempts (${exam.maxAttempts}) reached for this exam.`
          });
        }
      }
    }

    // Find existing IN_PROGRESS attempt with matching mode or create a new one
    let attempt = await Attempt.findOne({
      examId,
      userId,
      status: 'IN_PROGRESS',
      isPractice: Boolean(isPractice)
    }).sort({ createdAt: -1 });

    if (!attempt) {
      attempt = await Attempt.create({
        examId,
        userId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        isPractice: Boolean(isPractice),
        trustScore: 100,
        violations: []
      });
    }

    return res.status(200).json({
      success: true,
      attemptId: attempt._id,
      isPractice: attempt.isPractice,
      trustScore: attempt.trustScore,
      violations: attempt.violations,
      startedAt: attempt.startedAt
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
    const { examId, answers = {}, isPractice = false, timeSpentSeconds } = req.body;
    const userId = req.user._id;

    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required' });
    }

    // Fetch exam with FULL question data including correctAnswers
    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check official attempt limit (practice attempts do not count against maxAttempts)
    if (!isPractice && exam.maxAttempts !== null) {
      const existingCount = await Attempt.countDocuments({
        examId,
        userId,
        status: 'SUBMITTED',
        isPractice: { $ne: true }
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

    const validQuestions = (exam.questions || []).filter(Boolean);

    // Build response items for the Attempt document
    const responses = validQuestions.map((q) => {
      const qId = q._id.toString();
      const selected = answers[qId] || [];
      return {
        questionId: q._id,
        selectedAnswers: selected,
        status: selected.length > 0 ? 'ANSWERED' : 'NOT_ANSWERED'
      };
    });

    // Check if there is an existing IN_PROGRESS attempt to complete
    let attempt = await Attempt.findOne({
      examId,
      userId,
      status: 'IN_PROGRESS',
      isPractice: Boolean(isPractice)
    }).sort({ createdAt: -1 });

    const submittedAt = new Date();
    let timeTakenSeconds = 0;

    if (attempt) {
      const startMs = attempt.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();
      const elapsedSec = Math.max(0, Math.round((submittedAt.getTime() - startMs) / 1000));
      timeTakenSeconds = Number(timeSpentSeconds) > 0 ? Number(timeSpentSeconds) : elapsedSec;

      attempt.responses = responses;
      attempt.score = result.score;
      attempt.accuracy = result.accuracy;
      attempt.correct = result.correct;
      attempt.incorrect = result.incorrect;
      attempt.unanswered = result.unanswered;
      attempt.status = 'SUBMITTED';
      attempt.submittedAt = submittedAt;
      attempt.isPractice = Boolean(isPractice);
      attempt.timeTakenSeconds = timeTakenSeconds;

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
      timeTakenSeconds = Number(timeSpentSeconds) || 0;
      const startedAt = new Date(submittedAt.getTime() - timeTakenSeconds * 1000);
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
        startedAt,
        submittedAt,
        isPractice: Boolean(isPractice),
        timeTakenSeconds,
        violations: Array.isArray(req.body.violations) ? req.body.violations : []
      });
    }

    // Register in user's attemptedTests
    await User.findByIdAndUpdate(userId, {
      $push: {
        attemptedTests: {
          examId,
          attemptId: attempt._id,
          completedAt: submittedAt
        }
      }
    });

    // Create notifications
    try {
      const io = req.app.get('io');

      // 1. Notify examiner ONLY for official attempts (DO NOT notify examiner for practice mode!)
      if (!isPractice && exam.creatorId && String(exam.creatorId) !== String(userId)) {
        const examinerNotif = await Notification.create({
          recipient: exam.creatorId,
          sender: userId,
          type: 'EXAM_SUBMISSION',
          title: 'New Exam Submission',
          message: `${req.user.name || 'Candidate'} completed "${exam.title}" with score ${result.score}/${exam.totalMarks}`,
          data: {
            examId: exam._id,
            examTitle: exam.title,
            attemptId: attempt._id,
            candidateName: req.user.name || 'Candidate',
            candidateEmail: req.user.email,
            score: result.score,
            totalMarks: exam.totalMarks,
            accuracy: Math.round(result.accuracy || 0),
            timestamp: submittedAt,
            isPractice: false
          },
          link: `/test/${exam._id}/audit`,
        });

        if (io) {
          io.to(`creator_${exam.creatorId}`).emit('notification:new', examinerNotif);
          io.to(`user_${exam.creatorId}`).emit('notification:new', examinerNotif);
        }
      }

      // 2. Notify candidate of their completion
      const candidateNotif = await Notification.create({
        recipient: userId,
        type: 'EXAM_SUBMISSION',
        title: isPractice ? 'Practice Session Completed' : 'Exam Submitted Successfully',
        message: isPractice
          ? `You completed practice for "${exam.title}". Score: ${result.score}/${exam.totalMarks} (${Math.round(result.accuracy || 0)}% accuracy).`
          : `You completed "${exam.title}". Score: ${result.score}/${exam.totalMarks} (${Math.round(result.accuracy || 0)}% accuracy).`,
        data: {
          examId: exam._id,
          examTitle: exam.title,
          attemptId: attempt._id,
          score: result.score,
          totalMarks: exam.totalMarks,
          accuracy: Math.round(result.accuracy || 0),
          timestamp: submittedAt,
          isPractice: Boolean(isPractice)
        },
        link: `/test/${exam._id}`,
      });

      if (io) {
        io.to(`user_${userId}`).emit('notification:new', candidateNotif);
      }
    } catch (notifErr) {
      console.warn('[submitExam] Failed to create submission notifications:', notifErr?.message);
    }

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
        markingScheme: exam.markingScheme,
        isPractice: attempt.isPractice,
        timeTakenSeconds: attempt.timeTakenSeconds,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt
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
      .select('score accuracy correct incorrect unanswered responses submittedAt startedAt timeTakenSeconds isPractice createdAt violations')
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

    // Create persistent Notification for examiner (creator) - ONLY FOR OFFICIAL ATTEMPTS
    let persistentNotification = null;
    if (!attempt.isPractice && exam && exam.creatorId) {
      try {
        const readableType = violation.type ? violation.type.replace(/_/g, ' ') : 'Proctoring Anomaly';
        persistentNotification = await Notification.create({
          recipient: exam.creatorId,
          sender: req.user._id,
          type: 'VIOLATION',
          title: `Violation Alert: ${readableType}`,
          message: `${req.user.name || 'Candidate'} triggered "${readableType}" in "${exam.title}"`,
          data: {
            examId: exam._id,
            examTitle: exam.title,
            attemptId: attempt._id,
            candidateName: req.user.name || 'Candidate',
            candidateEmail: req.user.email,
            violationType: violation.type,
            imageUrl: violation.imageUrl || null,
            trustScore: updatedAttempt.trustScore,
            totalViolations: updatedAttempt.violations.length,
            timestamp: violation.timestamp,
          },
          link: `/test/${exam._id}/audit`,
          read: false,
        });
      } catch (notifErr) {
        console.warn('[logViolation] Failed to create persistent violation notification:', notifErr?.message);
      }
    }

    // Broadcast live violation to creator and exam rooms via Socket.IO - ONLY FOR OFFICIAL ATTEMPTS
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
        if (!attempt.isPractice && exam.creatorId) {
          io.to(`creator_${exam.creatorId}`).emit('violation:live', alertPayload);
          if (persistentNotification) {
            io.to(`creator_${exam.creatorId}`).emit('notification:new', persistentNotification);
            io.to(`user_${exam.creatorId}`).emit('notification:new', persistentNotification);
          }
        }
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

/**
 * @desc   Get question responses and solutions review for a completed attempt
 * @route  GET /api/submissions/attempt/:attemptId/review
 * @access Private
 */
export const getAttemptReview = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user._id;

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    // Check authorization: must be attempt owner, creator of the exam, or admin
    const isOwner = attempt.userId.toString() === userId.toString();
    const exam = await Exam.findById(attempt.examId).populate('questions');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const isCreator = Boolean(
      exam.creatorId && exam.creatorId.toString() === userId.toString()
    );

    if (!isOwner && !isCreator && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: You can only view your own attempt responses.'
      });
    }

    // If candidate (not creator/admin), enforce response sheet security rules:
    if (!isCreator && req.user.role !== 'admin') {
      // 1. Examiner disabled viewing responses entirely
      if (exam.allowReviewResponses === false) {
        return res.status(403).json({
          success: false,
          message: 'The examiner has disabled response sheet and solution viewing for this assessment.'
        });
      }

      // 2. Scheduled exam: only enable review after schedule concludes
      if (exam.schedule?.isScheduled && exam.schedule?.endTime) {
        const now = new Date();
        const scheduledEnd = new Date(exam.schedule.endTime);
        if (now < scheduledEnd) {
          return res.status(403).json({
            success: false,
            message: `Solutions and response sheet will be released after the scheduled exam concludes at ${scheduledEnd.toLocaleString()}.`,
            scheduledEndTime: exam.schedule.endTime
          });
        }
      }
    }

    // Map responses by questionId
    const responseMap = new Map();
    (attempt.responses || []).forEach((r) => {
      responseMap.set(r.questionId?.toString(), r);
    });

    const correctMark = exam.markingScheme?.correct ?? 4;
    const incorrectMark = exam.markingScheme?.incorrect ?? -1;

    // Build question reviews with candidate selection and verified solutions
    const reviewedQuestions = (exam.questions || []).filter(Boolean).map((q, idx) => {
      const qId = q._id.toString();
      const resp = responseMap.get(qId);
      const selectedAnswers = resp?.selectedAnswers || [];
      const correctAnswers = q.correctAnswers || [];

      let isCorrect = false;
      let isAnswered = selectedAnswers.length > 0;
      let marksAwarded = 0;

      if (isAnswered) {
        const sortedSelected = [...selectedAnswers].sort();
        const sortedCorrect = [...correctAnswers].sort();
        isCorrect =
          sortedSelected.length === sortedCorrect.length &&
          sortedSelected.every((val, i) => val === sortedCorrect[i]);

        marksAwarded = isCorrect ? correctMark : incorrectMark;
      }

      return {
        questionIndex: idx + 1,
        questionId: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        imageAttachment: q.imageAttachment || '',
        options: q.options || [],
        subject: q.subject || 'General',
        topic: q.topic || 'General',
        explanation: q.explanation || '',
        correctAnswers,
        selectedAnswers,
        status: resp?.status || (isAnswered ? 'ANSWERED' : 'NOT_ANSWERED'),
        timeSpentSeconds: resp?.timeSpentSeconds || 0,
        isCorrect,
        isAnswered,
        marksAwarded
      };
    });

    return res.status(200).json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        category: exam.category,
        totalMarks: exam.totalMarks,
        durationMinutes: exam.durationMinutes,
        markingScheme: exam.markingScheme,
        schedule: exam.schedule,
        allowReviewResponses: exam.allowReviewResponses
      },
      attempt: {
        _id: attempt._id,
        score: attempt.score,
        accuracy: attempt.accuracy,
        correct: attempt.correct,
        incorrect: attempt.incorrect,
        unanswered: attempt.unanswered,
        trustScore: attempt.trustScore,
        violations: attempt.violations || [],
        isPractice: Boolean(attempt.isPractice),
        timeTakenSeconds: attempt.timeTakenSeconds || 0,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt || attempt.updatedAt,
        questions: reviewedQuestions
      }
    });
  } catch (error) {
    console.error('[getAttemptReview] Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching attempt review' });
  }
};

