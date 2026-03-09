import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/api';
import { getToken, isAuthenticated } from '../utils/auth';
import './AppealReview.css';

const AppealReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [appeal, setAppeal] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState(null);
  const [evidenceType, setEvidenceType] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchAppeal();
  }, [id, navigate]);

  const fetchAppeal = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/appeals/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setAppeal(data.data.appeal);
      } else {
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else {
          setError(data.message || 'Failed to fetch appeal');
        }
      }
    } catch (error) {
      console.error('Appeal fetch error:', error);
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    if (newStatus === 'rejected' && (!adminNotes || adminNotes.trim().length < 10)) {
      setRejectionError('Rejection reason is required (minimum 10 characters)');
      return;
    }

    setRejectionError('');
    setUpdating(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Determine the correct status transition
      let targetStatus = newStatus;
      if (appeal.status === 'pending' && newStatus === 'approved') {
        // Must go through under-review first
        targetStatus = 'under-review';
      }

      const response = await fetch(`${API_BASE_URL}/appeals/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: targetStatus,
          adminNotes: adminNotes.trim() || null,
        }),
      });

      // Check response status before parsing JSON
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        setError(errorMessage);
        setUpdating(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        // If we set to under-review and want to approve, make another call
        if (targetStatus === 'under-review' && newStatus === 'approved') {
          const approveResponse = await fetch(`${API_BASE_URL}/appeals/${id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: 'approved',
              adminNotes: adminNotes.trim() || null,
            }),
          });
          const approveData = await approveResponse.json();
          if (approveData.success) {
            navigate('/admin/dashboard');
            return;
          }
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        setError(data.message || 'Failed to update appeal status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      setError('Network error. Please check if backend is running.');
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = () => {
    updateStatus('approved');
  };

  const handleReject = () => {
    if (!adminNotes || adminNotes.trim().length < 10) {
      setRejectionError('Rejection reason is required (minimum 10 characters)');
      return;
    }
    updateStatus('rejected');
  };

  const handleMoveToReview = () => {
    updateStatus('under-review');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="appeal-review-page">
        <div className="page-content">
          <div className="loading-container">
            <p>Loading appeal details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !appeal) {
    return (
      <div className="appeal-review-page">
        <div className="page-content">
          <div className="error-message" style={{ 
            padding: '15px', 
            margin: '20px 0', 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            borderRadius: '4px' 
          }}>
            {error}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!appeal) {
    return null;
  }

  return (
    <div className="appeal-review-page">
      <div className="page-content">
        <div className="review-container">
          <div className="form-header">
            <h1 className="form-title">Appeal Review</h1>
          </div>

          <div className="section-header">
            <h2>Citizen Appeal Details</h2>
          </div>

          {error && (
            <div className="error-message" style={{ 
              padding: '15px', 
              margin: '20px 0', 
              backgroundColor: '#ffebee', 
              color: '#c62828', 
              borderRadius: '4px' 
            }}>
              {error}
            </div>
          )}

          <div className="details-grid">
            <div className="detail-cell">
              <div className="detail-label-small">Appeal ID</div>
              <div className="detail-value-small">{appeal._id ? appeal._id.substring(0, 8).toUpperCase() : 'N/A'}</div>
            </div>
            <div className="detail-cell">
              <div className="detail-label-small">Violation ID</div>
              <div className="detail-value-small">{appeal.violationId}</div>
            </div>
            <div className="detail-cell">
              <div className="detail-label-small">Status</div>
              <div className="detail-value-small" style={{
                textTransform: 'capitalize',
                fontWeight: 'bold',
                color: appeal.status === 'pending' ? '#FFA500' :
                       appeal.status === 'under-review' ? '#2196F3' :
                       appeal.status === 'approved' ? '#4CAF50' : '#F44336'
              }}>
                {appeal.status.replace('-', ' ')}
              </div>
            </div>
            <div className="detail-cell">
              <div className="detail-label-small">Submitted Date</div>
              <div className="detail-value-small">{formatDate(appeal.submittedAt || appeal.createdAt)}</div>
            </div>
            <div className="detail-cell">
              <div className="detail-label-small">Citizen Name</div>
              <div className="detail-value-small">{appeal.userId?.fullName || 'N/A'}</div>
            </div>
            <div className="detail-cell">
              <div className="detail-label-small">Citizen Email</div>
              <div className="detail-value-small">{appeal.userId?.email || 'N/A'}</div>
            </div>
            <div className="detail-cell full-width">
              <div className="detail-label-small">Appeal Context</div>
              <div className="detail-value-small">
                {appeal.appealReason?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
              </div>
            </div>
            <div className="detail-cell full-width">
              <div className="detail-label-small">Detailed Explanation</div>
              <div className="detail-value-small" style={{ whiteSpace: 'pre-wrap' }}>
                {appeal.description || 'N/A'}
              </div>
            </div>
          </div>

          {appeal.evidence && (
            <>
              <div className="section-header">
                <h2>Evidence</h2>
              </div>
              <div className="evidence-preview" style={{ cursor: 'pointer' }}>
                {appeal.evidenceType === 'video-recording' || appeal.evidenceType === 'video' ? (
                  <video 
                    controls
                    src={`${API_BASE_URL.replace('/api', '')}${appeal.evidenceUrl || appeal.evidence}`}
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                    onClick={() => {
                      setEvidenceUrl(`${API_BASE_URL.replace('/api', '')}${appeal.evidenceUrl || appeal.evidence}`);
                      setEvidenceType('video');
                      setShowEvidenceModal(true);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : appeal.evidenceType === 'image' || appeal.evidence?.match(/\.(jpg|jpeg|png|gif)$/i) || appeal.evidenceUrl?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img 
                    src={`${API_BASE_URL.replace('/api', '')}${appeal.evidenceUrl || appeal.evidence}`} 
                    alt="Evidence" 
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={() => {
                      setEvidenceUrl(`${API_BASE_URL.replace('/api', '')}${appeal.evidenceUrl || appeal.evidence}`);
                      setEvidenceType('image');
                      setShowEvidenceModal(true);
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x400?text=Evidence+Not+Available';
                    }}
                  />
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <a 
                      href={`${API_BASE_URL.replace('/api', '')}${appeal.evidenceUrl || appeal.evidence}`}
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
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
                  Click to view full screen
                </p>
              </div>
            </>
          )}

          {/* Fullscreen Evidence Modal */}
          {showEvidenceModal && (
            <div 
              className="evidence-modal-overlay"
              onClick={() => setShowEvidenceModal(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px',
              }}
            >
              <div 
                className="evidence-modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'relative',
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  backgroundColor: '#000',
                  borderRadius: '8px',
                  padding: '20px',
                }}
              >
                <button
                  onClick={() => setShowEvidenceModal(false)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10001,
                  }}
                >
                  ×
                </button>
                {evidenceType === 'video' ? (
                  <video 
                    controls
                    src={evidenceUrl}
                    style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '4px' }}
                    autoPlay
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img 
                    src={evidenceUrl} 
                    alt="Evidence Fullscreen" 
                    style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '4px', objectFit: 'contain' }}
                  />
                )}
              </div>
            </div>
          )}

          {appeal.status === 'pending' && (
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Admin Notes (Optional)
              </label>
              <textarea
                className="comments-textarea"
                placeholder="Add your notes when moving to review..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows="4"
              />
            </div>
          )}

          {appeal.status === 'under-review' && (
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Admin Notes <span style={{ color: 'red' }}>*</span>
                {appeal.status === 'under-review' && ' (Required for rejection)'}
              </label>
              <textarea
                className="comments-textarea"
                placeholder={appeal.status === 'under-review' ? 'Enter rejection reason (minimum 10 characters) or approval notes...' : 'Add your comments...'}
                value={adminNotes}
                onChange={(e) => {
                  setAdminNotes(e.target.value);
                  setRejectionError('');
                }}
                rows="4"
                required
              />
              {rejectionError && (
                <span style={{ color: '#F44336', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                  {rejectionError}
                </span>
              )}
            </div>
          )}

          <div className="action-buttons">
            {appeal.status === 'pending' && (
              <button 
                onClick={handleMoveToReview} 
                className="action-button"
                style={{ 
                  background: 'linear-gradient(135deg, #42A5F5 0%, #2196F3 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                }}
                disabled={updating}
              >
                {updating ? 'Processing...' : 'Move to Under Review'}
              </button>
            )}
            {appeal.status === 'under-review' && (
              <>
                <button 
                  onClick={handleApprove} 
                  className="action-button approve"
                  disabled={updating}
                >
                  {updating ? 'Processing...' : 'Approve Appeal'}
                </button>
                <button 
                  onClick={handleReject} 
                  className="action-button reject"
                  disabled={updating}
                >
                  {updating ? 'Processing...' : 'Reject Appeal'}
                </button>
              </>
            )}
            {appeal.status === 'approved' && (
              <div style={{ 
                padding: '30px', 
                textAlign: 'center', 
                backgroundColor: '#E8F5E9',
                borderRadius: '12px',
                border: '2px solid #4CAF50',
                margin: '20px 16px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>✓</div>
                <h3 style={{ 
                  color: '#2E7D32', 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  marginBottom: '10px'
                }}>
                  Appeal Approved
                </h3>
                <p style={{ color: '#1B5E20', fontSize: '16px', marginBottom: '20px' }}>
                  This appeal has been successfully approved. The violation has been dismissed.
                </p>
                {appeal.adminNotes && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '15px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    textAlign: 'left'
                  }}>
                    <strong style={{ color: '#2E7D32' }}>Approval Notes:</strong>
                    <p style={{ marginTop: '8px', color: '#333', fontStyle: 'italic' }}>
                      {appeal.adminNotes}
                    </p>
                  </div>
                )}
                {appeal.reviewedAt && (
                  <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                    Approved on: {formatDate(appeal.reviewedAt)}
                  </p>
                )}
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#F1F8E9', borderRadius: '8px' }}>
                  <p style={{ color: '#33691E', fontSize: '14px', margin: 0 }}>
                    <strong>Next Steps:</strong> The violation fine has been waived. No further action is required from your side.
                  </p>
                </div>
              </div>
            )}
            {appeal.status === 'rejected' && (
              <div style={{ 
                padding: '30px', 
                textAlign: 'center', 
                backgroundColor: '#FFEBEE',
                borderRadius: '12px',
                border: '2px solid #F44336',
                margin: '20px 16px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>✗</div>
                <h3 style={{ 
                  color: '#C62828', 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  marginBottom: '10px'
                }}>
                  Appeal Rejected
                </h3>
                <p style={{ color: '#B71C1C', fontSize: '16px', marginBottom: '20px' }}>
                  This appeal has been rejected. The violation fine remains applicable.
                </p>
                {appeal.adminNotes && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '15px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    textAlign: 'left'
                  }}>
                    <strong style={{ color: '#C62828' }}>Rejection Reason:</strong>
                    <p style={{ marginTop: '8px', color: '#333', fontStyle: 'italic' }}>
                      {appeal.adminNotes}
                    </p>
                  </div>
                )}
                {appeal.reviewedAt && (
                  <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                    Rejected on: {formatDate(appeal.reviewedAt)}
                  </p>
                )}
                
                {/* Next Steps for Rejected Appeal */}
                <div style={{ 
                  marginTop: '25px', 
                  padding: '20px',
                  backgroundColor: '#FFF3E0',
                  borderRadius: '8px',
                  border: '1px solid #FF9800',
                  textAlign: 'left'
                }}>
                  <h4 style={{ 
                    color: '#E65100', 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📋</span> Next Steps
                  </h4>
                  <ul style={{ 
                    color: '#E65100', 
                    fontSize: '14px',
                    lineHeight: '1.8',
                    margin: 0,
                    paddingLeft: '20px'
                  }}>
                    <li>Pay the violation fine within the specified deadline to avoid additional penalties</li>
                    <li>If you believe the rejection was incorrect, you may contact the traffic department for further review</li>
                    <li>Keep a copy of this rejection notice for your records</li>
                    <li>For payment options and deadlines, visit the traffic department office or check your violation notice</li>
                  </ul>
                  <div style={{ 
                    marginTop: '15px',
                    padding: '12px',
                    backgroundColor: '#FFE0B2',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#BF360C'
                  }}>
                    <strong>Important:</strong> Failure to pay the fine within the deadline may result in additional penalties, vehicle registration suspension, or legal action.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AppealReview;

