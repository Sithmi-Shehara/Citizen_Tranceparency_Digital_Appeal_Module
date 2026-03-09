const Appeal = require('../models/Appeal');
const User = require('../models/User');
const { validateViolationId, validateDescription } = require('../utils/validators');
const { logAppealAction } = require('../utils/auditLogger');
const { notifyStatusChange, notifyNewAppeal } = require('../utils/notifications');
const path = require('path');

// All appeals now require mandatory evidence (real-world requirement)
const EVIDENCE_REQUIRED = true;

// @desc    Create a new appeal
// @route   POST /api/appeals
// @access  Private
// @purpose Real-world appeal submission with validation, duplicate prevention, and evidence requirements
const createAppeal = async (req, res) => {
  try {
    const { violationId, appealReason, description, violationDate } = req.body;

    // Step 1: Validate all required fields
    if (!violationId || !appealReason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide violation ID, appeal reason, and description',
        errors: {
          violationId: !violationId ? 'Violation ID is required' : undefined,
          appealReason: !appealReason ? 'Appeal reason is required' : undefined,
          description: !description ? 'Description is required' : undefined,
        },
      });
    }

    // Step 2: Validate violation ID format
    const violationIdValidation = validateViolationId(violationId);
    if (!violationIdValidation.valid) {
      return res.status(400).json({
        success: false,
        message: violationIdValidation.error,
      });
    }

    // Step 3: Validate appeal context (new real-world options)
    const validReasons = [
      'road-obstruction',
      'medical-emergency',
      'traffic-diversion',
      'environmental-weather',
      'incorrect-detection',
      'other',
    ];
    if (!validReasons.includes(appealReason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appeal context',
      });
    }

    // Step 4: Validate description
    const descriptionValidation = validateDescription(description);
    if (!descriptionValidation.valid) {
      return res.status(400).json({
        success: false,
        message: descriptionValidation.error,
      });
    }

    // Step 5: Check for duplicate appeal (real-world: same violation cannot be appealed twice by same user)
    const duplicateAppeal = await Appeal.checkDuplicateAppeal(
      violationIdValidation.value,
      req.user.id
    );

    if (duplicateAppeal) {
      return res.status(409).json({
        success: false,
        message: `You have already submitted an appeal for violation ${violationIdValidation.value}. Please wait for the current appeal to be processed.`,
        existingAppeal: {
          id: duplicateAppeal._id,
          status: duplicateAppeal.status,
          submittedAt: duplicateAppeal.submittedAt,
        },
      });
    }

    // Step 6: Validate evidence requirement (real-world: evidence is mandatory for all appeals)
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Evidence upload is mandatory for all appeals. Please provide supporting documents.',
      });
    }

    // Step 7: Determine evidence type if file is uploaded
    let evidenceType = req.body.evidenceType || null;
    if (!evidenceType && req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        evidenceType = 'image';
      } else if (ext === '.pdf') {
        evidenceType = 'pdf';
      } else if (['.mp4', '.avi', '.mov', '.wmv'].includes(ext)) {
        evidenceType = 'video-recording';
      } else {
        evidenceType = 'document';
      }
    }

    // Step 8: Parse violation date and calculate deadline
    let violationDateObj = new Date();
    if (violationDate) {
      violationDateObj = new Date(violationDate);
      if (isNaN(violationDateObj.getTime())) {
        violationDateObj = new Date();
      }
    }
    
    // Calculate deadline: 14 days from violation date
    const deadline = new Date(violationDateObj);
    deadline.setDate(deadline.getDate() + 14);

    // Step 9: Create appeal
    const appeal = await Appeal.create({
      violationId: violationIdValidation.value,
      userId: req.user.id,
      appealReason,
      description: descriptionValidation.value,
      evidence: req.file ? req.file.path : null,
      evidenceType: evidenceType,
      violationDate: violationDateObj,
      appealDeadline: deadline,
    });

    // Step 10: Log appeal creation
    await logAppealAction(
      'appeal-created',
      appeal._id,
      req.user.id,
      req.user.id,
      {
        violationId: appeal.violationId,
        appealReason: appeal.appealReason,
        hasEvidence: !!appeal.evidence,
      },
      req
    );

    // Step 11: Create notification for all admins about new appeal
    await notifyNewAppeal(appeal._id, appeal.violationId, req.user.fullName);

    res.status(201).json({
      success: true,
      message: 'Appeal submitted successfully. It will be reviewed by an administrator.',
      data: {
        appeal: {
          id: appeal._id,
          violationId: appeal.violationId,
          appealReason: appeal.appealReason,
          status: appeal.status,
          submittedAt: appeal.submittedAt,
        },
      },
    });
  } catch (error) {
    // Handle duplicate key error (compound index violation)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted an appeal for this violation',
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating appeal. Please try again.',
    });
  }
};

// @desc    Get all appeals for logged in user
// @route   GET /api/appeals
// @access  Private
// @purpose Get citizen's own appeals with filtering and pagination
const getMyAppeals = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    if (status && ['pending', 'under-review', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get appeals
    const appeals = await Appeal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'fullName email')
      .populate('reviewedBy', 'fullName email')
      .select('-evidence'); // Don't send file paths in list view

    // Get total count
    const total = await Appeal.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appeals.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: {
        appeals,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appeals',
    });
  }
};

// @desc    Get single appeal by ID
// @route   GET /api/appeals/:id
// @access  Private
// @purpose Get detailed appeal information with proper authorization
const getAppeal = async (req, res) => {
  try {
    const appeal = await Appeal.findById(req.params.id)
      .populate('userId', 'fullName email nicNumber')
      .populate('reviewedBy', 'fullName email')
      .populate('statusHistory.changedBy', 'fullName email');

    if (!appeal) {
      return res.status(404).json({
        success: false,
        message: 'Appeal not found',
      });
    }

    // Real-world authorization: Citizens can only see their own appeals
    if (req.user.role === 'citizen' && appeal.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this appeal',
      });
    }

    // Format evidence URL if exists
    let evidenceUrl = null;
    if (appeal.evidence) {
      evidenceUrl = `/uploads/${path.basename(appeal.evidence)}`;
    }

    res.status(200).json({
      success: true,
      data: {
        appeal: {
          ...appeal.toObject(),
          evidenceUrl,
        },
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appeal ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appeal',
    });
  }
};

// @desc    Get all appeals (Admin only)
// @route   GET /api/appeals/admin/all
// @access  Private/Admin
// @purpose Admin dashboard: Get all appeals with filtering and pagination
const getAllAppeals = async (req, res) => {
  try {
    const { status, appealReason, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    const query = {};
    if (status && ['pending', 'under-review', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }
    if (appealReason) {
      query.appealReason = appealReason;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get appeals
    const appeals = await Appeal.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'fullName email nicNumber mobileNumber')
      .populate('reviewedBy', 'fullName email')
      .select('-evidence'); // Don't send file paths in list view

    // Get total count
    const total = await Appeal.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appeals.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: {
        appeals,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appeals',
    });
  }
};

// @desc    Update appeal status (Admin only)
// @route   PUT /api/appeals/:id/status
// @access  Private/Admin
// @purpose Real-world status update with workflow validation, audit logging, and notifications
const updateAppealStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    // Step 1: Validate status
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const validStatuses = ['pending', 'under-review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Step 2: Find appeal
    const appeal = await Appeal.findById(req.params.id).populate('userId', 'fullName email');

    if (!appeal) {
      return res.status(404).json({
        success: false,
        message: 'Appeal not found',
      });
    }

    // Step 3: Real-world rule: Admin cannot review their own appeals
    if (appeal.userId._id.toString() === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You cannot review your own appeal. Please assign it to another administrator.',
      });
    }

    // Step 4: Validate status transition (real-world workflow)
    const transitionCheck = appeal.canTransitionTo(status);
    if (!transitionCheck.valid) {
      return res.status(400).json({
        success: false,
        message: transitionCheck.reason,
        currentStatus: appeal.status,
      });
    }

    // Step 5: Real-world rule: Rejection requires admin notes
    if (status === 'rejected' && (!adminNotes || adminNotes.trim().length < 10)) {
      return res.status(400).json({
        success: false,
        message: 'Admin notes are required when rejecting an appeal (minimum 10 characters)',
      });
    }

    // Step 6: Store old status for logging
    const oldStatus = appeal.status;

    // Step 7: Update appeal
    appeal.status = status;
    if (adminNotes) {
      appeal.adminNotes = adminNotes.trim();
    }
    appeal.reviewedBy = req.user.id;
    appeal.reviewedAt = Date.now();

    // Step 8: Add to status history
    appeal.addStatusHistory(
      status,
      req.user.id,
      adminNotes || null,
      `Status changed from ${oldStatus} to ${status}`
    );

    await appeal.save();

    // Step 9: Log status change
    await logAppealAction(
      'appeal-status-changed',
      appeal._id,
      appeal.userId._id,
      req.user.id,
      {
        oldStatus,
        newStatus: status,
        violationId: appeal.violationId,
        adminNotes: adminNotes || null,
      },
      req
    );

    // Step 10: Send notification to citizen (if status changed)
    if (oldStatus !== status) {
      await notifyStatusChange(
        appeal.userId._id,
        appeal._id,
        oldStatus,
        status,
        appeal.violationId
      );
    }

    res.status(200).json({
      success: true,
      message: `Appeal status updated to ${status}`,
      data: {
        appeal: {
          id: appeal._id,
          violationId: appeal.violationId,
          status: appeal.status,
          reviewedBy: appeal.reviewedBy,
          reviewedAt: appeal.reviewedAt,
          adminNotes: appeal.adminNotes,
        },
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appeal ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating appeal status',
    });
  }
};

// @desc    Get appeal statistics (Admin only)
// @route   GET /api/appeals/admin/statistics
// @access  Private/Admin
// @purpose Real-world analytics for admin dashboard
const getAppealStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get statistics
    const [
      totalAppeals,
      pendingAppeals,
      underReviewAppeals,
      approvedAppeals,
      rejectedAppeals,
      appealsByReason,
      appealsByStatus,
      recentAppeals,
    ] = await Promise.all([
      Appeal.countDocuments(dateFilter),
      Appeal.countDocuments({ ...dateFilter, status: 'pending' }),
      Appeal.countDocuments({ ...dateFilter, status: 'under-review' }),
      Appeal.countDocuments({ ...dateFilter, status: 'approved' }),
      Appeal.countDocuments({ ...dateFilter, status: 'rejected' }),
      Appeal.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$appealReason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Appeal.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Appeal.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'fullName email')
        .select('violationId status appealReason createdAt'),
    ]);

    // Calculate approval rate
    const totalProcessed = approvedAppeals + rejectedAppeals;
    const approvalRate = totalProcessed > 0 
      ? ((approvedAppeals / totalProcessed) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total: totalAppeals,
          pending: pendingAppeals,
          underReview: underReviewAppeals,
          approved: approvedAppeals,
          rejected: rejectedAppeals,
          approvalRate: `${approvalRate}%`,
        },
        byReason: appealsByReason,
        byStatus: appealsByStatus,
        recentAppeals,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
    });
  }
};

module.exports = {
  createAppeal,
  getMyAppeals,
  getAppeal,
  getAllAppeals,
  updateAppealStatus,
  getAppealStatistics,
};
