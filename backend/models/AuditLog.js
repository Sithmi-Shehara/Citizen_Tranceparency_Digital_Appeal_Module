const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'user-registered',
      'user-login',
      'user-login-failed',
      'appeal-created',
      'appeal-status-changed',
      'appeal-reviewed',
      'appeal-updated',
      'admin-action',
    ],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  appealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appeal',
    default: null,
    index: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: false,
});

// Indexes for efficient queries
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ appealId: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);











