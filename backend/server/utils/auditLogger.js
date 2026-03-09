const AuditLog = require('../models/AuditLog');
const { getClientIP, getUserAgent } = require('./validators');

/**
 * Create an audit log entry
 */
const logAction = async (action, userId, performedBy, details = {}, req = null) => {
  try {
    const auditLog = {
      action,
      userId,
      performedBy,
      details,
      ipAddress: req ? getClientIP(req) : null,
      userAgent: req ? getUserAgent(req) : null,
      timestamp: Date.now(),
    };
    
    await AuditLog.create(auditLog);
  } catch (error) {
    // Don't throw error - audit logging should not break the main flow
    console.error('Audit logging error:', error);
  }
};

/**
 * Log appeal-related actions
 */
const logAppealAction = async (action, appealId, userId, performedBy, details = {}, req = null) => {
  try {
    const auditLog = {
      action,
      userId,
      appealId,
      performedBy,
      details,
      ipAddress: req ? getClientIP(req) : null,
      userAgent: req ? getUserAgent(req) : null,
      timestamp: Date.now(),
    };
    
    await AuditLog.create(auditLog);
  } catch (error) {
    console.error('Appeal audit logging error:', error);
  }
};

module.exports = {
  logAction,
  logAppealAction,
};











