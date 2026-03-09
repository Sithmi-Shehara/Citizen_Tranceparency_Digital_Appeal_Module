import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/api';
import { saveToken } from '../utils/auth';
import './RegisterPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    nicNumber: '',
    drivingLicense: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Validation functions
  const validateFullName = (name) => {
    if (!name || name.trim().length === 0) {
      return 'Full name is required';
    }
    if (name.trim().length < 3) {
      return 'Full name must be at least 3 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return 'Full name can only contain letters and spaces';
    }
    return '';
  };

  const validateNIC = (nic) => {
    if (!nic || nic.trim().length === 0) {
      return 'NIC number is required';
    }
    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
    if (!nicRegex.test(nic.trim())) {
      return 'NIC must be 9 digits + V/X or 12 digits';
    }
    return '';
  };

  const validateDrivingLicense = (dl) => {
    if (!dl || dl.trim().length === 0) {
      return 'Driving license number is required';
    }
    const dlRegex = /^([A-Z][0-9]{7}|[0-9]{9})$/;
    if (!dlRegex.test(dl.trim().toUpperCase())) {
      return 'Driving license must be 1 letter + 7 digits (e.g. B1234567) or 9 digits';
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!email || email.trim().length === 0) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validateMobile = (mobile) => {
    if (!mobile || mobile.trim().length === 0) {
      return 'Mobile number is required';
    }
    const mobileRegex = /^(07[0-9]{8}|\+947[0-9]{8})$/;
    if (!mobileRegex.test(mobile.trim())) {
      return 'Mobile number must be 07XXXXXXXX or +947XXXXXXXX';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password || password.length === 0) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least 1 uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least 1 number';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Password must contain at least 1 special character';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
    setError(''); // Clear general error
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let fieldError = '';

    switch (name) {
      case 'fullName':
        fieldError = validateFullName(value);
        break;
      case 'nicNumber':
        fieldError = validateNIC(value);
        break;
      case 'drivingLicense':
        fieldError = validateDrivingLicense(value);
        break;
      case 'email':
        fieldError = validateEmail(value);
        break;
      case 'mobileNumber':
        fieldError = validateMobile(value);
        break;
      case 'password':
        fieldError = validatePassword(value);
        break;
      case 'confirmPassword':
        if (value !== formData.password) {
          fieldError = 'Passwords do not match';
        }
        break;
      default:
        break;
    }

    if (fieldError) {
      setErrors({
        ...errors,
        [name]: fieldError,
      });
    } else {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate all fields
    const validationErrors = {};
    validationErrors.fullName = validateFullName(formData.fullName);
    validationErrors.nicNumber = validateNIC(formData.nicNumber);
    validationErrors.drivingLicense = validateDrivingLicense(formData.drivingLicense);
    validationErrors.email = validateEmail(formData.email);
    validationErrors.mobileNumber = validateMobile(formData.mobileNumber);
    validationErrors.password = validatePassword(formData.password);
    
    if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }

    // Remove empty errors
    Object.keys(validationErrors).forEach(key => {
      if (!validationErrors[key]) {
        delete validationErrors[key];
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...dataToSend } = formData;

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (data.success) {
        // Save token to localStorage
        saveToken(data.data.token);
        // Redirect to login page
        navigate('/login');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="page-content">
        <div className="form-container">
          <div className="form-header">
            <h1 className="form-title">Citizen Registration</h1>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {error && (
              <div className="error-message" style={{ 
                color: 'red', 
                padding: '10px', 
                marginBottom: '15px',
                backgroundColor: '#ffe6e6',
                borderRadius: '5px'
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                Full Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                placeholder="Enter your full name"
                required
              />
              {errors.fullName && (
                <span className="error-message-field">{errors.fullName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="nicNumber" className="form-label">
                NIC Number <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                id="nicNumber"
                name="nicNumber"
                value={formData.nicNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.nicNumber ? 'input-error' : ''}`}
                placeholder="Enter your NIC number (9 digits + V/X or 12 digits)"
                required
              />
              {errors.nicNumber && (
                <span className="error-message-field">{errors.nicNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="drivingLicense" className="form-label">
                Driving License Number <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                id="drivingLicense"
                name="drivingLicense"
                value={formData.drivingLicense}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.drivingLicense ? 'input-error' : ''}`}
                placeholder="Enter your driving license (e.g. B1234567 or 123456789)"
                required
              />
              {errors.drivingLicense && (
                <span className="error-message-field">{errors.drivingLicense}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter your email"
                required
              />
              {errors.email && (
                <span className="error-message-field">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="mobileNumber" className="form-label">
                Mobile Number <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.mobileNumber ? 'input-error' : ''}`}
                placeholder="Enter your mobile number (07XXXXXXXX or +947XXXXXXXX)"
                required
              />
              {errors.mobileNumber && (
                <span className="error-message-field">{errors.mobileNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password (min 8 chars, 1 uppercase, 1 number, 1 special)"
                required
              />
              {errors.password && (
                <span className="error-message-field">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Confirm your password"
                required
              />
              {errors.confirmPassword && (
                <span className="error-message-field">{errors.confirmPassword}</span>
              )}
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterPage;

