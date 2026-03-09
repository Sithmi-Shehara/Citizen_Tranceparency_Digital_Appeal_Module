const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {
  validateAndSanitizeEmail,
  validateAndSanitizeNIC,
  validateAndSanitizeDrivingLicense,
  validateAndSanitizeMobile,
  validatePassword,
  validateFullName,
} = require('../utils/validators');
const { logAction } = require('../utils/auditLogger');

// Generate JWT Token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'change_this_in_production';

  // Fallback to a default so registration doesn't crash if JWT_SECRET
  // is missing in the deployment environment (e.g. Render).
  // In a real deployment, JWT_SECRET should always be set.
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET is not set. Using a default development secret.');
  }

  return jwt.sign({ id }, secret, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// @purpose Real-world user registration with identity validation
const registerUser = async (req, res) => {
  try {
    const { fullName, nicNumber, drivingLicense, email, mobileNumber, password } = req.body;

    // Step 1: Validate all required fields are present
    if (!fullName || !nicNumber || !drivingLicense || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        errors: {
          fullName: !fullName ? 'Full name is required' : undefined,
          nicNumber: !nicNumber ? 'NIC number is required' : undefined,
          drivingLicense: !drivingLicense ? 'Driving license is required' : undefined,
          email: !email ? 'Email is required' : undefined,
          mobileNumber: !mobileNumber ? 'Mobile number is required' : undefined,
          password: !password ? 'Password is required' : undefined,
        },
      });
    }

    // Step 2: Real-world validation of each field
    const nameValidation = validateFullName(fullName);
    if (!nameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: nameValidation.error,
      });
    }

    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error,
      });
    }

    const nicValidation = validateAndSanitizeNIC(nicNumber);
    if (!nicValidation.valid) {
      return res.status(400).json({
        success: false,
        message: nicValidation.error,
      });
    }

    const dlValidation = validateAndSanitizeDrivingLicense(drivingLicense);
    if (!dlValidation.valid) {
      return res.status(400).json({
        success: false,
        message: dlValidation.error,
      });
    }

    const mobileValidation = validateAndSanitizeMobile(mobileNumber);
    if (!mobileValidation.valid) {
      return res.status(400).json({
        success: false,
        message: mobileValidation.error,
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.error,
      });
    }

    // Step 3: Check for duplicate identity (real-world: same person cannot register twice)
    const duplicateCheck = await User.checkDuplicateIdentity(
      nicValidation.value,
      dlValidation.value,
      emailValidation.value
    );

    if (duplicateCheck) {
      let duplicateField = '';
      if (duplicateCheck.nicNumber === nicValidation.value) duplicateField = 'NIC number';
      else if (duplicateCheck.drivingLicense === dlValidation.value) duplicateField = 'Driving license';
      else if (duplicateCheck.email === emailValidation.value) duplicateField = 'Email';

      return res.status(409).json({
        success: false,
        message: `A user with this ${duplicateField} already exists. Each citizen can only have one account.`,
      });
    }

    // Step 4: Create user with validated and sanitized data
    const user = await User.create({
      fullName: nameValidation.value,
      nicNumber: nicValidation.value,
      drivingLicense: dlValidation.value,
      email: emailValidation.value,
      mobileNumber: mobileValidation.value,
      password, // Will be hashed by pre-save hook
    });

    // Step 5: Log registration for audit
    await logAction('user-registered', user._id, user._id, {
      email: user.email,
      nicNumber: user.nicNumber,
      role: user.role,
    }, req);

    // Step 6: Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please login to continue.',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `A user with this ${field} already exists`,
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
      message: 'Server error during registration. Please try again.',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// @purpose Real-world secure login with account lockout protection
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const emailValidation = validateAndSanitizeEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Step 2: Find user with password field
    let user = await User.findOne({ email: emailValidation.value }).select('+password');

    // If no user exists and this is the default admin email, bootstrap an admin account
    if (!user && emailValidation.value === 'admin@example.com') {
      try {
        user = await User.create({
          fullName: 'System Administrator',
          nicNumber: '999999999V',
          drivingLicense: 'B1234567',
          email: 'admin@example.com',
          mobileNumber: '0771234567',
          password, // use the password provided on first login
          role: 'admin',
        });

        // Re-select with password for consistency with the rest of the flow
        user = await User.findById(user._id).select('+password');
      } catch (createErr) {
        console.error('Error bootstrapping admin user:', createErr);
        return res.status(500).json({
          success: false,
          message: 'Server error while creating admin user. Please try again.',
        });
      }
    }

    if (!user) {
      // Log failed login attempt (even if user doesn't exist, for security)
      await logAction('user-login-failed', null, null, {
        email: emailValidation.value,
        reason: 'user_not_found',
      }, req);

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Step 3: Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
        lockUntil: user.lockUntil,
      });
    }

    // Step 4: Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Step 5: Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();

      // Log failed login attempt
      await logAction('user-login-failed', user._id, user._id, {
        email: user.email,
        reason: 'invalid_password',
        loginAttempts: user.loginAttempts + 1,
      }, req);

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Step 6: Successful login - reset attempts and update last login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }
    await user.updateLastLogin();

    // Step 7: Log successful login
    await logAction('user-login', user._id, user._id, {
      email: user.email,
      role: user.role,
    }, req);

    // Step 8: Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
// @purpose Get authenticated user's profile information
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          nicNumber: user.nicNumber,
          drivingLicense: user.drivingLicense,
          mobileNumber: user.mobileNumber,
          role: user.role,
          profilePhoto: user.profilePhoto,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update profile photo
// @route   PUT /api/auth/profile-photo
// @access  Private
// @purpose Update user's profile photo
const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a profile photo',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update profile photo path - store relative path for static file serving
    // req.file.path is absolute, we need relative path from uploads directory
    // Static files are served at /uploads, so store path like 'profile-photos/filename.jpg'
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../uploads');
    let relativePath = path.relative(uploadsDir, req.file.path);
    // Normalize path separators for cross-platform compatibility (Windows uses \, Unix uses /)
    relativePath = relativePath.split(path.sep).join('/');
    user.profilePhoto = relativePath;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully',
      data: {
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile photo',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfilePhoto,
};

