import express from 'express';
import { submitExam, getUserAttempts } from '../controllers/submission.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Submit an exam attempt (graded server-side)
router.post('/submit', protect, submitExam);

// Get all attempts for the logged-in user for a specific exam
router.get('/my/:examId', protect, getUserAttempts);

export default router;
