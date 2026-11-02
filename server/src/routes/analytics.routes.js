import express from 'express';
import { aiExplain } from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/analytics/ai-explain
 * @desc    BYOK AI solution explanation proxy
 * @access  Private
 */
router.post('/ai-explain', protect, aiExplain);

export default router;

