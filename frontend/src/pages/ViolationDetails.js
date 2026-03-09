import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/api';
import { getToken, isAuthenticated } from '../utils/auth';
import './ViolationDetails.css';

const ViolationDetails = () => {
  const { id } = useParams(); // This is the violation ID
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appealData, setAppealData] = useState(null);
  
  // Get appeal ID from location state if available
  const appealId = location.state?.appealId;

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchAppealData();
  }, [id, navigate]);

  const fetchAppealData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      let appealToFetch = null;

      // If appeal ID is provided in state, use it directly
      if (appealId) {
        appealToFetch = appealId;
      } else {
        // Otherwise, fetch user's appeals and find the one matching this violation ID
        const response = await fetch(`${API_BASE_URL}/appeals?page=1&limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          // Find appeal with matching violation ID
          const appeal = data.data.appeals.find(a => 
            a.violationId && a.violationId.toUpperCase() === (id || '').toUpperCase()
          );

          if (appeal) {
            appealToFetch = appeal._id;
          } else {
            setError('No appeal found for this violation');
            setLoading(false);
            return;
          }
        } else {
          setError(data.message || 'Failed to fetch appeals');
          setLoading(false);
          return;
        }
      }

      // Fetch full appeal details
      const appealResponse = await fetch(`${API_BASE_URL}/appeals/${appealToFetch}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const appealDataResponse = await appealResponse.json();
      
      if (appealDataResponse.success) {
        setAppealData(appealDataResponse.data.appeal);
      } else {
        setError('Failed to fetch appeal details');
      }
    } catch (error) {
      console.error('Appeal fetch error:', error);
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAppealReason = (reason) => {
    if (!reason) return 'N/A';
    return reason.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculateDueDate = (violationDate) => {
    if (!violationDate) return 'N/A';
    const date = new Date(violationDate);
    date.setDate(date.getDate() + 14); // 2 weeks
    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="violation-details-page">
        <div className="page-content">
          <div className="details-container">
            <p>Loading violation details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !appealData) {
    return (
      <div className="violation-details-page">
        <div className="page-content">
          <div className="details-container">
            <div className="error-message" style={{ 
              padding: '15px', 
              margin: '20px 0', 
              backgroundColor: '#ffebee', 
              color: '#c62828', 
              borderRadius: '4px' 
            }}>
              {error || 'No appeal data found'}
            </div>
            <button onClick={() => navigate('/dashboard')} className="action-button secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="violation-details-page">
      <div className="page-content">
        <div className="details-container">
          <div className="form-header">
            <h1 className="form-title">Violation Details</h1>
          </div>

          <div className="violation-info-card">
            <div className="info-card-header">
              <h2 className="section-title">Violation Information</h2>
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Violation ID</span>
                <span className="info-value">{appealData.violationId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Type</span>
                <span className="info-value">{formatAppealReason(appealData.appealReason)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date</span>
                <span className="info-value">{formatDate(appealData.violationDate)}</span>
              </div>
            </div>
          </div>

          {appealData.evidenceUrl && (
            <div className="violation-image-section">
              <h3 className="image-section-title">Violation Evidence</h3>
              <div className="evidence-preview" style={{ 
                marginTop: '20px',
                padding: '20px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                {appealData.evidenceType === 'video-recording' || appealData.evidenceType === 'video' ? (
                  <video 
                    controls
                    src={`${API_BASE_URL.replace('/api', '')}${appealData.evidenceUrl}`}
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : appealData.evidenceType === 'image' || appealData.evidence?.match(/\.(jpg|jpeg|png|gif)$/i) || appealData.evidenceUrl?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img 
                    src={`${API_BASE_URL.replace('/api', '')}${appealData.evidenceUrl}`} 
                    alt="Appeal evidence" 
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x400?text=Evidence+Not+Available';
                    }}
                  />
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <a 
                      href={`${API_BASE_URL.replace('/api', '')}${appealData.evidenceUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#1280ED', 
                        textDecoration: 'none',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}
                    >
                      📄 View Evidence Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="fine-info-card">
            <div className="info-card-header">
              <h2 className="section-title">Appeal Details</h2>
            </div>
            
            <div className="fine-details">
              <div className="fine-item">
                <span className="fine-label">Due Date</span>
                <span className="fine-date">{calculateDueDate(appealData.violationDate)}</span>
              </div>
              <div className="fine-item">
                <span className="fine-label">Appeal Status</span>
                <span className="fine-days" style={{ 
                  color: appealData.status === 'approved' ? '#4CAF50' : 
                         appealData.status === 'rejected' ? '#F44336' : 
                         appealData.status === 'under-review' ? '#FF9800' : '#2196F3'
                }}>
                  {appealData.status?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="action-section">
            <button 
              onClick={() => navigate(`/appeal-status/${appealData._id}`)} 
              className="action-button secondary"
            >
              Back to Appeal Status
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ViolationDetails;

