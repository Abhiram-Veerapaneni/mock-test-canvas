import express from 'express';
import {
  getPersonalAnalytics,
  getExamInsights,
  getLeaderboard,
  aiExplain
} from '../controllers/analytics.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/analytics/me
 * @desc    Personal candidate score trend, stream accuracy, streak
 * @access  Private
 */
router.get('/me', protect, getPersonalAnalytics);

/**
 * @route   GET /api/analytics/exam/:examId
 * @desc    Per-exam insights: score histogram buckets, average, median, topic breakdowns
 * @access  Private
 */
router.get('/exam/:examId', protect, getExamInsights);

/**
 * @route   GET /api/analytics/leaderboard
 * @desc    Global official leaderboard (top 50 + current user rank)
 * @access  Public / OptionalAuth
 */
router.get('/leaderboard', optionalAuth, getLeaderboard);

/**
 * @route   POST /api/analytics/ai-explain
 * @desc    BYOK AI solution explanation proxy
 * @access  Private
 */
router.post('/ai-explain', protect, aiExplain);

export default router;
