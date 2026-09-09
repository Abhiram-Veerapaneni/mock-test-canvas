import express from 'express';
import {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  uploadExamMedia,
  getExamViolations
} from '../controllers/exam.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';
import { uploadImage } from '../middleware/upload.middleware.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getAllExams)
  .post(protect, createExam);

router.post('/upload-media', protect, uploadImage, uploadExamMedia);

router.route('/:id')
  .get(optionalAuth, getExamById)
  .put(protect, updateExam);

router.get('/:id/live-violations', protect, getExamViolations);

export default router;
