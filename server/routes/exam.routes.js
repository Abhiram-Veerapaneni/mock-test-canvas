import express from 'express';
import { createExam, getAllExams, getExamById } from '../controllers/exam.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(getAllExams)
  .post(protect, createExam);

router.get('/:id', getExamById);

export default router;
