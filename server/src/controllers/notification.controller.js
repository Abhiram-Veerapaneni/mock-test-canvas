import Notification from '../models/Notification.model.js';

/**
 * @desc   Get user's notifications with unread count and optional filters
 * @route  GET /api/notifications
 * @access Private
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { unreadOnly, type, page = 1, limit = 30 } = req.query;

    const query = { recipient: userId };

    if (unreadOnly === 'true' || unreadOnly === true) {
      query.read = false;
    }

    if (type && type !== 'ALL') {
      query.type = type;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, read: false }),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      total,
      unreadCount,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error('[getNotifications] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notifications',
    });
  }
};

/**
 * @desc   Mark a specific notification as read
 * @route  PATCH /api/notifications/:id/read
 * @access Private
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    return res.status(200).json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (error) {
    console.error('[markAsRead] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read',
    });
  }
};

/**
 * @desc   Mark all user's notifications as read
 * @route  PATCH /api/notifications/mark-all-read
 * @access Private
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    console.error('[markAllAsRead] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all as read',
    });
  }
};

/**
 * @desc   Delete a specific notification
 * @route  DELETE /api/notifications/:id
 * @access Private
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const deleted = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification removed',
      unreadCount,
    });
  } catch (error) {
    console.error('[deleteNotification] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification',
    });
  }
};

/**
 * @desc   Clear all notifications for the user
 * @route  DELETE /api/notifications
 * @access Private
 */
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ recipient: userId });

    return res.status(200).json({
      success: true,
      message: 'All notifications cleared',
      unreadCount: 0,
    });
  } catch (error) {
    console.error('[clearAllNotifications] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear notifications',
    });
  }
};
