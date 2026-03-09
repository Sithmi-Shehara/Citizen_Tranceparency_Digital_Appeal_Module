const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  appealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appeal',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['status-change', 'review-started', 'decision-made', 'evidence-requested'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread',
  },
  readAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false,
});

// Index for efficient queries
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.status = 'read';
  this.readAt = Date.now();
};

module.exports = mongoose.model('Notification', notificationSchema);











