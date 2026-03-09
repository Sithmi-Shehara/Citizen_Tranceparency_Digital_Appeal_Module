const Notification = require('../models/Notification');

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
// @purpose Get user's notifications with pagination
const getMyNotifications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { userId: req.user.id };
    if (status && ['unread', 'read'].includes(status)) {
      query.status = status;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get notifications
    const notifications = await Notification.find(query)
      .populate('appealId', 'violationId status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, status: 'unread' });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: {
        notifications,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications',
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
// @purpose Mark a specific notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Check ownership
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this notification',
      });
    }

    notification.markAsRead();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification',
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
// @purpose Mark all user's notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, status: 'unread' },
      { 
        $set: { 
          status: 'read',
          readAt: Date.now(),
        } 
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        updatedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating notifications',
    });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};











