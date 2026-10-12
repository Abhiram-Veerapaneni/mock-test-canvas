import express from 'express';
import {
  getBankQuestions,
  createBankQuestion,
  getQuestionById,
  updateBankQuestion,
  deleteBankQuestion,
  getDistinctStreams,
  getDistinctTags,
  generateExam,
  uploadQuestionBankImage
} from '../controllers/question.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';
import { uploadImage } from '../middleware/upload.middleware.js';

const router = express.Router();

// Metadata and Exam Generation (must come before /:id)
router.get('/meta/streams', getDistinctStreams);
router.get('/meta/tags', getDistinctTags);
router.post('/generate-exam', protect, generateExam);

// Media Upload for Question Bank diagrams and options
router.post('/upload-image', protect, uploadImage, uploadQuestionBankImage);

// Question Bank CRUD
router.route('/')
  .get(optionalAuth, getBankQuestions)
  .post(protect, createBankQuestion);

router.route('/:id')
  .get(optionalAuth, getQuestionById)
  .put(protect, updateBankQuestion)
  .delete(protect, deleteBankQuestion);

export default router;
