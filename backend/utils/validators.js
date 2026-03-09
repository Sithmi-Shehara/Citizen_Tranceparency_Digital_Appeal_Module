/**
 * Real-world validation utilities for the Traffic and Accident Detection System
 */

// Sanitize string input
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, ''); // Remove potential HTML tags
};

// Validate and sanitize email
const validateAndSanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true, value: sanitized };
};

// Validate and sanitize NIC
const validateAndSanitizeNIC = (nic) => {
  if (!nic || typeof nic !== 'string') {
    return { valid: false, error: 'NIC number is required' };
  }
  
  const sanitized = nic.trim().toUpperCase();
  const oldFormat = /^[0-9]{9}[VvXx]$/;
  const newFormat = /^[0-9]{12}$/;
  
  if (!oldFormat.test(sanitized) && !newFormat.test(sanitized)) {
    return { valid: false, error: 'NIC must be in format: 9 digits + V/X or 12 digits' };
  }
  
  return { valid: true, value: sanitized };
};

// Validate and sanitize driving license
const validateAndSanitizeDrivingLicense = (dl) => {
  if (!dl || typeof dl !== 'string') {
    return { valid: false, error: 'Driving license number is required' };
  }
  
  const sanitized = dl.trim().toUpperCase();
  // New format: 1 capital letter + 7 digits (e.g. B1234567)
  // Old format: 9 digits
  const newFormat = /^[A-Z][0-9]{7}$/;
  const oldFormat = /^[0-9]{9}$/;
  
  if (!newFormat.test(sanitized) && !oldFormat.test(sanitized)) {
    return { valid: false, error: 'Driving license must be 1 letter + 7 digits (e.g. B1234567) or 9 digits' };
  }
  
  return { valid: true, value: sanitized };
};

// Validate and sanitize mobile number
const validateAndSanitizeMobile = (mobile) => {
  if (!mobile || typeof mobile !== 'string') {
    return { valid: false, error: 'Mobile number is required' };
  }
  
  const sanitized = mobile.trim();
  // Sri Lankan formats: 07XXXXXXXX or +947XXXXXXXX
  const localFormat = /^07[0-9]{8}$/;
  const intlFormat = /^\+947[0-9]{8}$/;
  
  if (!localFormat.test(sanitized) && !intlFormat.test(sanitized)) {
    return { valid: false, error: 'Mobile number must be 07XXXXXXXX or +947XXXXXXXX' };
  }
  
  return { valid: true, value: sanitized };
};

// Validate password strength
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
};

// Validate full name
const validateFullName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Full name is required' };
  }
  
  const sanitized = sanitizeString(name);
  
  if (sanitized.length < 3) {
    return { valid: false, error: 'Full name must be at least 3 characters' };
  }
  
  if (sanitized.length > 100) {
    return { valid: false, error: 'Full name cannot exceed 100 characters' };
  }
  
  // Letters and spaces only
  if (!/^[a-zA-Z\s]+$/.test(sanitized)) {
    return { valid: false, error: 'Full name can only contain letters and spaces' };
  }
  
  return { valid: true, value: sanitized };
};

// Validate violation ID
const validateViolationId = (violationId) => {
  if (!violationId || typeof violationId !== 'string') {
    return { valid: false, error: 'Violation ID is required' };
  }
  
  const sanitized = violationId.trim().toUpperCase();
  
  if (!/^[A-Z0-9]{8,20}$/.test(sanitized)) {
    return { valid: false, error: 'Violation ID must be 8-20 alphanumeric characters' };
  }
  
  return { valid: true, value: sanitized };
};

// Validate description
const validateDescription = (description) => {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Description is required' };
  }
  
  const sanitized = sanitizeString(description);
  
  if (sanitized.length < 50) {
    return { valid: false, error: 'Description must be at least 50 characters' };
  }
  
  if (sanitized.length > 2000) {
    return { valid: false, error: 'Description cannot exceed 2000 characters' };
  }
  
  const words = sanitized.split(/\s+/);
  if (words.length < 5) {
    return { valid: false, error: 'Description must contain at least 5 words' };
  }
  
  return { valid: true, value: sanitized };
};

// Get client IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
};

// Get user agent
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

module.exports = {
  sanitizeString,
  validateAndSanitizeEmail,
  validateAndSanitizeNIC,
  validateAndSanitizeDrivingLicense,
  validateAndSanitizeMobile,
  validatePassword,
  validateFullName,
  validateViolationId,
  validateDescription,
  getClientIP,
  getUserAgent,
};


