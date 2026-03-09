const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Real-world validation functions
const validateNIC = function (nic) {
  // Sri Lankan NIC format: 9 digits + V or 12 digits (new format)
  const oldFormat = /^[0-9]{9}[VvXx]$/;
  const newFormat = /^[0-9]{12}$/;
  return oldFormat.test(nic) || newFormat.test(nic);
};

const validateDrivingLicense = function (dl) {
  // Sri Lankan driving license format:
  // New format: 1 capital letter + 7 digits (e.g. B1234567)
  // Old format: 9 digits
  const newFormat = /^[A-Z][0-9]{7}$/;
  const oldFormat = /^[0-9]{9}$/;
  return newFormat.test(dl) || oldFormat.test(dl);
};

const validateMobileNumber = function (mobile) {
  // Sri Lankan mobile numbers: 07X-XXXXXXX (10 digits starting with 0)
  // Also accept +94 format
  const localFormat = /^0[1-9][0-9]{8}$/;
  const intlFormat = /^\+94[1-9][0-9]{8}$/;
  return localFormat.test(mobile) || intlFormat.test(mobile);
};

const validateEmail = function (email) {
  // More strict email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
    minlength: [3, 'Full name must be at least 3 characters'],
    maxlength: [100, 'Full name cannot exceed 100 characters'],
    validate: {
      validator: function (v) {
        // Must contain at least first and last name (at least 2 words)
        const words = v.trim().split(/\s+/);
        return words.length >= 2 && words.every(word => word.length >= 2);
      },
      message: 'Full name must contain at least first and last name (minimum 2 words)',
    },
  },
  nicNumber: {
    type: String,
    required: [true, 'Please provide your NIC number'],
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: validateNIC,
      message: 'NIC number must be in valid format (9 digits + V/X or 12 digits)',
    },
    index: true,
  },
  drivingLicense: {
    type: String,
    required: [true, 'Please provide your driving license number'],
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: validateDrivingLicense,
      message: 'Driving license must be 1 letter + 7 digits (e.g. B1234567) or 9 digits',
    },
    index: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validateEmail,
      message: 'Please provide a valid email address',
    },
    index: true,
  },
  mobileNumber: {
    type: String,
    required: [true, 'Please provide your mobile number'],
    trim: true,
    validate: {
      validator: validateMobileNumber,
      message: 'Mobile number must be in valid format (0XX-XXXXXXX or +94XX-XXXXXXX)',
    },
  },
  profilePhoto: {
    type: String, // Path to uploaded file
    default: null,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Don't return password by default
    validate: {
      validator: function (v) {
        // Password must contain at least one letter and one number
        return /[A-Za-z]/.test(v) && /[0-9]/.test(v);
      },
      message: 'Password must contain at least one letter and one number',
    },
  },
  role: {
    type: String,
    enum: {
      values: ['citizen', 'admin'],
      message: 'Role must be either citizen or admin',
    },
    default: 'citizen',
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
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
});

// Update updatedAt before saving
userSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = async function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Method to update last login
userSchema.methods.updateLastLogin = async function () {
  return this.updateOne({
    $set: { lastLogin: Date.now() },
  });
};

// Static method to check for duplicate identity
userSchema.statics.checkDuplicateIdentity = async function (nicNumber, drivingLicense, email, excludeUserId = null) {
  const query = {
    $or: [
      { nicNumber: nicNumber.toUpperCase() },
      { drivingLicense: drivingLicense.toUpperCase() },
      { email: email.toLowerCase() },
    ],
  };
  
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  
  return await this.findOne(query);
};

module.exports = mongoose.model('User', userSchema);

