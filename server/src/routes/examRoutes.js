import express from 'express';
import { getAllExams, getExamById, submitExamAttempt } from '../controllers/examController.js';

const router = express.Router();

router.get('/', getAllExams);
router.get('/:id', getExamById);
router.post('/submit', submitExamAttempt);

export default router;
