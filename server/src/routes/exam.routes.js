import express from 'express';
import { createExam, getAllExams, getExamById, getExamViolations } from '../controllers/exam.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getAllExams)
  .post(protect, createExam);

router.get('/:id/live-violations', protect, getExamViolations);
router.get('/:id', getExamById);

export default router;
