const mongoose = require('mongoose');

// Status history schema for tracking all status changes
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['pending', 'under-review', 'approved', 'rejected'],
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: null,
  },
  reason: {
    type: String,
    default: null,
  },
}, { _id: false });

// Valid status transitions
const VALID_STATUS_TRANSITIONS = {
  'pending': ['under-review'],
  'under-review': ['approved', 'rejected'],
  'approved': [], // Final state - cannot transition
  'rejected': [], // Final state - cannot transition
};

// All appeals now require mandatory evidence (real-world requirement)
const EVIDENCE_REQUIRED = true;

const appealSchema = new mongoose.Schema({
  violationId: {
    type: String,
    required: [true, 'Please provide violation ID'],
    trim: true,
    uppercase: true,
    validate: {
      validator: function (v) {
        // Violation ID format: Typically alphanumeric, 8-20 characters
        return /^[A-Z0-9]{8,20}$/.test(v);
      },
      message: 'Violation ID must be 8-20 alphanumeric characters',
    },
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  appealReason: {
    type: String,
    required: [true, 'Please provide appeal context'],
    // New appeal context options for real-world government workflows
    enum: {
      values: [
        'road-obstruction',
        'medical-emergency',
        'traffic-diversion',
        'environmental-weather',
        'incorrect-detection',
        'other',
      ],
      message: 'Invalid appeal context',
    },
  },
  description: {
    type: String,
    required: [true, 'Please provide a detailed explanation'],
    trim: true,
    minlength: [50, 'Detailed explanation must be at least 50 characters'],
    maxlength: [2000, 'Detailed explanation cannot exceed 2000 characters'],
    validate: {
      validator: function (v) {
        // Description must be meaningful (not just repeated characters or numbers)
        const words = v.trim().split(/\s+/);
        return words.length >= 5; // At least 5 words
      },
      message: 'Detailed explanation must contain at least 5 words',
    },
  },
  evidence: {
    type: String, // Path to uploaded file
    required: [true, 'Evidence upload is mandatory for all appeals'],
    validate: {
      validator: function (v) {
        // Evidence is mandatory for all appeals (real-world requirement)
        return v !== null && v.trim() !== '';
      },
      message: 'Evidence upload is mandatory. Please provide supporting documents.',
    },
  },
  evidenceType: {
    type: String,
    enum: ['accident-photo', 'video-recording', 'medical-proof', 'witness-proof', 'other-document', 'image', 'pdf', 'document'],
    default: null,
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'under-review', 'approved', 'rejected'],
      message: 'Invalid status',
    },
    default: 'pending',
    index: true,
  },
  statusHistory: {
    type: [statusHistorySchema],
    default: [],
  },
  adminNotes: {
    type: String,
    default: null,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  violationDate: {
    type: Date,
    required: [true, 'Violation date is required'],
  },
  appealDeadline: {
    type: Date,
    required: [true, 'Appeal deadline is required'],
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false, // We handle timestamps manually
});

// Compound index to prevent duplicate appeals for same violation by same user
appealSchema.index({ violationId: 1, userId: 1 }, { unique: true });

// Index for status and date queries
appealSchema.index({ status: 1, createdAt: -1 });
appealSchema.index({ userId: 1, status: 1 });

// Method to check if status transition is valid
appealSchema.methods.canTransitionTo = function (newStatus) {
  const currentStatus = this.status;
  
  // Cannot transition to same status
  if (currentStatus === newStatus) {
    return { valid: false, reason: 'Appeal is already in this status' };
  }
  
  // Check if transition is allowed
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    return { 
      valid: false, 
      reason: `Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${allowedTransitions.join(', ')}` 
    };
  }
  
  // Cannot change status if already in final state
  if (currentStatus === 'approved' || currentStatus === 'rejected') {
    return { valid: false, reason: 'Cannot change status of a finalized appeal' };
  }
  
  return { valid: true };
};

// Method to add status history entry
appealSchema.methods.addStatusHistory = function (status, changedBy, notes = null, reason = null) {
  this.statusHistory.push({
    status,
    changedBy,
    changedAt: Date.now(),
    notes,
    reason,
  });
};

// Update the updatedAt field before saving
appealSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Initialize status history on creation and calculate deadline
appealSchema.pre('save', function (next) {
  if (this.isNew) {
    this.addStatusHistory('pending', this.userId, 'Appeal submitted', 'initial_submission');
    // Calculate appeal deadline: 14 days from violation date
    if (this.violationDate && !this.appealDeadline) {
      const deadline = new Date(this.violationDate);
      deadline.setDate(deadline.getDate() + 14);
      this.appealDeadline = deadline;
    }
  }
  next();
});

// Static method to check for duplicate appeal
appealSchema.statics.checkDuplicateAppeal = async function (violationId, userId) {
  return await this.findOne({
    violationId: violationId.toUpperCase(),
    userId: userId,
    status: { $in: ['pending', 'under-review'] }, // Only check active appeals
  });
};

module.exports = mongoose.model('Appeal', appealSchema);

