import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

router.route('/')
  .get(getNotifications)
  .delete(clearAllNotifications);

router.route('/mark-all-read')
  .patch(markAllAsRead)
  .put(markAllAsRead)
  .post(markAllAsRead);

router.route('/:id/read')
  .patch(markAsRead)
  .put(markAsRead)
  .post(markAsRead);

router.delete('/:id', deleteNotification);

export default router;
