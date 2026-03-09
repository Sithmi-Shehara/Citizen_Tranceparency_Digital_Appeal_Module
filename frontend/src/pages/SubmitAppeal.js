import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/api';
import { getToken, isAuthenticated } from '../utils/auth';
import './SubmitAppeal.css';

const SubmitAppeal = () => {
  const { violationId: urlViolationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    violationId: urlViolationId || location.state?.violationId || '',
    appealContext: '',
    detailedExplanation: '',
    evidence: null,
    evidenceType: '',
    otherContext: '',
    declaration: false,
    violationDate: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [violationData, setViolationData] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch violation data if violation ID is provided
  useEffect(() => {
    if (formData.violationId) {
      fetchViolationData(formData.violationId);
    }
  }, [formData.violationId]);

  const fetchViolationData = async (violationId) => {
    try {
      const token = getToken();
      // In a real system, you'd have a violations API endpoint
      // For now, we'll simulate it or use the violation ID directly
      // The violation date should come from the violation system
      // For now, we'll set a default date (current date) but in production this should come from the violation record
      setViolationData({
        violationId: violationId,
        violationDate: new Date(), // This should come from violation API
      });
    } catch (error) {
      console.error('Error fetching violation data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted', formData);
    setError('');
    setErrors({});
    setLoading(true);

    // Validate all required fields
    const validationErrors = {};
    
    if (!formData.violationId || formData.violationId.trim().length === 0) {
      validationErrors.violationId = 'Violation ID is required';
    }
    
    if (!formData.appealContext) {
      validationErrors.appealContext = 'Appeal context is required';
    }
    
    if (formData.appealContext === 'other' && !formData.otherContext.trim()) {
      validationErrors.otherContext = 'Please specify the appeal context';
    }
    
    if (!formData.detailedExplanation || formData.detailedExplanation.trim().length < 50) {
      validationErrors.detailedExplanation = 'Detailed explanation is required (minimum 50 characters)';
    }
    
    if (!formData.evidence) {
      validationErrors.evidence = 'Evidence upload is mandatory. Please provide supporting documents.';
    }
    
    if (!formData.declaration) {
      validationErrors.declaration = 'Please confirm the legal declaration';
    }
    
    if (!formData.violationDate) {
      validationErrors.violationDate = 'Violation date is required';
    } else {
      // Check if violation date is within the last 2 weeks (appeal deadline)
      const violationDate = new Date(formData.violationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      if (violationDate > today) {
        validationErrors.violationDate = 'Violation date cannot be in the future';
      } else if (violationDate < twoWeeksAgo) {
        validationErrors.violationDate = 'Appeal submission deadline has passed. Violation date must be within the last 2 weeks.';
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError('Please fix the errors below before submitting.');
      setLoading(false);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('violationId', formData.violationId.trim().toUpperCase());
      
      // Use appealContext or otherContext
      const appealReason = formData.appealContext === 'other' 
        ? formData.otherContext.trim().toLowerCase().replace(/\s+/g, '-')
        : formData.appealContext;
      formDataToSend.append('appealReason', appealReason);
      
      formDataToSend.append('description', formData.detailedExplanation.trim());
      
      // Add violation date (required for deadline calculation)
      if (formData.violationDate) {
        formDataToSend.append('violationDate', new Date(formData.violationDate).toISOString());
      } else if (violationData?.violationDate) {
        formDataToSend.append('violationDate', violationData.violationDate.toISOString());
      } else {
        // Default to current date if not available
        formDataToSend.append('violationDate', new Date().toISOString());
      }
      
      if (formData.evidence) {
        formDataToSend.append('evidence', formData.evidence);
      }
      
      if (formData.evidenceType) {
        formDataToSend.append('evidenceType', formData.evidenceType);
      }

      const response = await fetch(`${API_BASE_URL}/appeals`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          // Handle validation errors
          if (errorData.errors) {
            const errorFields = Object.keys(errorData.errors);
            if (errorFields.length > 0) {
              setErrors(errorData.errors);
            }
          }
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();

      console.log('Response received:', data);
      
      if (data.success) {
        // Success - redirect to appeal status page with the appeal ID
        const appealId = data.data?.appeal?.id;
        console.log('Appeal submitted successfully, ID:', appealId);
        if (appealId) {
          navigate(`/appeal-status/${appealId}`);
        } else {
          // Fallback to dashboard if appeal ID is not available
          console.log('No appeal ID, navigating to dashboard');
          navigate('/dashboard');
        }
      } else {
        console.log('Appeal submission failed:', data.message);
        setError(data.message || 'Failed to submit appeal. Please try again.');
      }
    } catch (error) {
      console.error('Appeal submission error:', error);
      setError(`Network error: ${error.message}. Please check if backend is running and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setFormData({
        ...formData,
        evidence: files[0],
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="submit-appeal-page">
      <div className="page-content">
        <div className="form-container">
          <div className="form-header">
            <h1 className="form-title">Submit Appeal</h1>
          </div>

          <form onSubmit={handleSubmit} className="appeal-form">
            {error && (
              <div className="error-message" style={{ 
                color: '#c62828', 
                padding: '15px', 
                marginBottom: '20px',
                backgroundColor: '#ffebee',
                borderRadius: '8px',
                border: '1px solid #ef5350',
                fontSize: '16px',
                fontWeight: '500',
                width: '100%',
                textAlign: 'center'
              }}>
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="violationId" className="form-label">
                Violation ID <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                id="violationId"
                name="violationId"
                value={formData.violationId}
                onChange={handleChange}
                className={`form-input ${errors.violationId ? 'input-error' : ''}`}
                placeholder="Enter Violation ID (e.g., VIO-2024-001)"
                required
              />
              {errors.violationId && (
                <span className="error-message-field">{errors.violationId}</span>
              )}
              {!formData.violationId && !errors.violationId && (
                <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  Enter your Violation ID. If you came from a violation details page, this should be auto-filled.
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="violationDate" className="form-label">
                Violation Date <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                id="violationDate"
                name="violationDate"
                value={formData.violationDate}
                onChange={handleChange}
                className={`form-input ${errors.violationDate ? 'input-error' : ''}`}
                required
                max={new Date().toISOString().split('T')[0]}
                min={(() => {
                  const twoWeeksAgo = new Date();
                  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                  return twoWeeksAgo.toISOString().split('T')[0];
                })()}
              />
              {errors.violationDate && (
                <span className="error-message-field">{errors.violationDate}</span>
              )}
              {!formData.violationDate && !errors.violationDate && (
                <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  Select the date when the violation occurred.
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="appealContext" className="form-label">
                Appeal Context <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                id="appealContext"
                name="appealContext"
                value={formData.appealContext}
                onChange={handleChange}
                className={`form-select ${errors.appealContext ? 'input-error' : ''}`}
                required
              >
                <option value="">Select Appeal Context</option>
                <option value="road-obstruction">Road Obstruction / Accident Ahead</option>
                <option value="medical-emergency">Medical / Emergency Situation</option>
                <option value="traffic-diversion">Traffic Diversion / Police Instruction</option>
                <option value="environmental-weather">Environmental / Weather Condition</option>
                <option value="incorrect-detection">Incorrect Detection Context</option>
                <option value="other">Other (Specify)</option>
              </select>
              {errors.appealContext && (
                <span className="error-message-field">{errors.appealContext}</span>
              )}
            </div>

            {formData.appealContext === 'other' && (
              <div className="form-group">
                <label htmlFor="otherContext" className="form-label">
                  Specify Appeal Context <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  id="otherContext"
                  name="otherContext"
                  value={formData.otherContext}
                  onChange={handleChange}
                  className={`form-input ${errors.otherContext ? 'input-error' : ''}`}
                  placeholder="Please specify your appeal context"
                />
                {errors.otherContext && (
                  <span className="error-message-field">{errors.otherContext}</span>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="detailedExplanation" className="form-label">
                Detailed Explanation <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                id="detailedExplanation"
                name="detailedExplanation"
                value={formData.detailedExplanation}
                onChange={handleChange}
                className={`form-textarea ${errors.detailedExplanation ? 'input-error' : ''}`}
                rows="6"
                placeholder="Describe what happened and why the violation occurred (minimum 50 characters)..."
                required
              />
              <div style={{ marginTop: '4px', fontSize: '14px', color: '#666' }}>
                {formData.detailedExplanation.length}/50 characters minimum
              </div>
              {errors.detailedExplanation && (
                <span className="error-message-field">{errors.detailedExplanation}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Upload Evidence <span style={{ color: 'red' }}>*</span>
              </label>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                Evidence is required to support your appeal. Please upload images, videos, or documents.
              </p>
              <div
                className={`file-upload-area ${errors.evidence ? 'upload-error' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="upload-content">
                  <p className="upload-text-primary">Drag and drop files here</p>
                  <p className="upload-text-secondary">Or click to browse</p>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                    Accepted: Images, Videos, Documents (PDF, DOC, DOCX)
                  </p>
                </div>
                <input
                  type="file"
                  id="evidence"
                  name="evidence"
                  onChange={handleChange}
                  className="file-input"
                  accept="image/*,.pdf"
                  required
                />
              </div>
              {formData.evidence && (
                <p className="file-name" style={{ color: '#4CAF50', marginTop: '8px' }}>
                  ✓ {formData.evidence.name}
                </p>
              )}
              {errors.evidence && (
                <span className="error-message-field">{errors.evidence}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="evidenceType" className="form-label">
                Evidence Type (Optional)
              </label>
              <select
                id="evidenceType"
                name="evidenceType"
                value={formData.evidenceType}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Evidence Type</option>
                <option value="accident-photo">Accident Photo</option>
                <option value="video-recording">Video Recording</option>
                <option value="medical-proof">Medical Proof</option>
                <option value="witness-proof">Witness Proof</option>
                <option value="other-document">Other Document</option>
              </select>
            </div>

            <div className="form-group">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="declaration"
                  name="declaration"
                  checked={formData.declaration}
                  onChange={handleChange}
                  className={`checkbox-input ${errors.declaration ? 'input-error' : ''}`}
                  required
                />
                <label htmlFor="declaration" className="checkbox-label">
                  I declare that the information provided is true and accurate 
                  to the best of my knowledge. <span style={{ color: 'red' }}>*</span>
                </label>
              </div>
              {errors.declaration && (
                <span className="error-message-field" style={{ marginLeft: '32px' }}>
                  {errors.declaration}
                </span>
              )}
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
              onClick={(e) => {
                console.log('Submit button clicked, loading:', loading);
                // Form onSubmit will handle the actual submission
              }}
            >
              {loading ? (
                <>
                  <span style={{ marginRight: '8px' }}>⏳</span>
                  Submitting...
                </>
              ) : (
                'Submit Appeal'
              )}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SubmitAppeal;

