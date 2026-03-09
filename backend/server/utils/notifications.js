const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification for a user
 */
const createNotification = async (userId, appealId, type, title, message) => {
  try {
    const notification = await Notification.create({
      userId,
      appealId,
      type,
      title,
      message,
    });
    return notification;
  } catch (error) {
    console.error('Notification creation error:', error);
    return null;
  }
};

/**
 * Notify all admins about a new appeal
 */
const notifyNewAppeal = async (appealId, violationId, citizenName) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: 'admin', isActive: true });
    
    // Create notification for each admin
    const notifications = await Promise.all(
      admins.map(admin =>
        createNotification(
          admin._id,
          appealId,
          'review-started',
          'New Appeal Submitted',
          `A new appeal has been submitted by ${citizenName} for violation ${violationId}. Please review it.`
        )
      )
    );
    
    return notifications;
  } catch (error) {
    console.error('Error notifying admins about new appeal:', error);
    return null;
  }
};

/**
 * Create status change notification
 */
const notifyStatusChange = async (userId, appealId, oldStatus, newStatus, violationId) => {
  const statusMessages = {
    'under-review': {
      title: 'Appeal Under Review',
      message: `Your appeal for violation ${violationId} is now under review by an administrator.`,
    },
    'approved': {
      title: 'Appeal Approved',
      message: `Great news! Your appeal for violation ${violationId} has been approved.`,
    },
    'rejected': {
      title: 'Appeal Rejected',
      message: `Your appeal for violation ${violationId} has been rejected. Please check the admin notes for details.`,
    },
  };

  const notificationData = statusMessages[newStatus];
  if (notificationData) {
    return await createNotification(
      userId,
      appealId,
      'status-change',
      notificationData.title,
      notificationData.message
    );
  }
  
  return null;
};

module.exports = {
  createNotification,
  notifyStatusChange,
  notifyNewAppeal,
};


