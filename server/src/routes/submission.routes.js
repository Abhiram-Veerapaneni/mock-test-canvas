import express from 'express';
import { submitExam, getUserAttempts, logViolation, startAttempt, getAttemptReview, revokeAttempt } from '../controllers/submission.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadSnapshot } from '../middleware/upload.middleware.js';

const router = express.Router();

// Start or resume an exam attempt
router.post('/start', protect, startAttempt);

// Submit an exam attempt (graded server-side)
router.post('/submit', protect, submitExam);

// Get all attempts for the logged-in user for a specific exam
router.get('/my/:examId', protect, getUserAttempts);

// Get detailed responses and solutions review for a completed attempt
router.get('/attempt/:attemptId/review', protect, getAttemptReview);

// Revoke, disqualify, or restore a candidate's attempt (Examiner or Admin)
router.post('/attempt/:attemptId/revoke', protect, revokeAttempt);

// Log a proctoring violation with optional snapshot image
router.post('/:id/violation', protect, uploadSnapshot, logViolation);

export default router;

