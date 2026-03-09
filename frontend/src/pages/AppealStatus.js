import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/api';
import { getToken, isAuthenticated } from '../utils/auth';
import './AppealStatus.css';

const AppealStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appealData, setAppealData] = useState(null);

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

      const response = await fetch(`${API_BASE_URL}/appeals/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const appeal = data.data.appeal;
        
        // Build timeline from status history
        const timeline = [];
        
        // Initial submission
        timeline.push({
          name: 'Appeal Submitted',
          completed: true,
          date: formatDate(appeal.submittedAt || appeal.createdAt),
          description: 'Your appeal has been successfully submitted and received by our system.',
        });

        // Check status history for other events
        if (appeal.statusHistory && appeal.statusHistory.length > 0) {
          appeal.statusHistory.forEach((history, index) => {
            if (history.status === 'under-review') {
              timeline.push({
                name: 'Under Review',
                completed: appeal.status !== 'pending',
                current: appeal.status === 'under-review',
                date: formatDate(history.changedAt),
                description: 'A traffic officer is currently reviewing your appeal and evidence.',
              });
            } else if (history.status === 'approved') {
              timeline.push({
                name: 'Decision Made',
                completed: true,
                date: formatDate(history.changedAt),
                description: 'Your appeal has been approved.',
              });
              timeline.push({
                name: 'Appeal Resolved',
                completed: true,
                date: formatDate(history.changedAt),
                description: 'Appeal process completed successfully.',
              });
            } else if (history.status === 'rejected') {
              timeline.push({
                name: 'Decision Made',
                completed: true,
                date: formatDate(history.changedAt),
                description: 'A decision has been made on your appeal.',
              });
              timeline.push({
                name: 'Appeal Resolved',
                completed: true,
                date: formatDate(history.changedAt),
                description: appeal.adminNotes || 'Appeal process completed.',
              });
            }
          });
        } else {
          // Fallback if no status history
          if (appeal.status === 'under-review') {
            timeline.push({
              name: 'Under Review',
              completed: true,
              current: true,
              date: formatDate(appeal.reviewedAt || appeal.updatedAt),
              description: 'A traffic officer is currently reviewing your appeal and evidence.',
            });
            timeline.push({
              name: 'Decision Made',
              completed: false,
              date: 'Pending',
              description: 'A decision will be made based on the review of your appeal.',
            });
            timeline.push({
              name: 'Appeal Resolved',
              completed: false,
              date: 'Pending',
              description: 'You will be notified of the final decision and any required actions.',
            });
          } else if (appeal.status === 'approved' || appeal.status === 'rejected') {
            timeline.push({
              name: 'Under Review',
              completed: true,
              date: formatDate(appeal.reviewedAt || appeal.updatedAt),
              description: 'Your appeal was reviewed by a traffic officer.',
            });
            timeline.push({
              name: 'Decision Made',
              completed: true,
              date: formatDate(appeal.reviewedAt || appeal.updatedAt),
              description: appeal.status === 'approved' ? 'Your appeal has been approved.' : 'A decision has been made on your appeal.',
            });
            timeline.push({
              name: 'Appeal Resolved',
              completed: true,
              date: formatDate(appeal.reviewedAt || appeal.updatedAt),
              description: appeal.status === 'approved' 
                ? 'Appeal process completed successfully.' 
                : (appeal.adminNotes || 'Appeal process completed.'),
            });
          } else {
            timeline.push({
              name: 'Under Review',
              completed: false,
              date: 'Pending',
              description: 'A traffic officer will review your appeal and evidence.',
            });
            timeline.push({
              name: 'Decision Made',
              completed: false,
              date: 'Pending',
              description: 'A decision will be made based on the review of your appeal.',
            });
            timeline.push({
              name: 'Appeal Resolved',
              completed: false,
              date: 'Pending',
              description: 'You will be notified of the final decision and any required actions.',
            });
          }
        }

        setAppealData({
          appealId: appeal._id,
          violationId: appeal.violationId,
          status: appeal.status,
          statusColor: getStatusColor(appeal.status),
          progress: getProgress(appeal.status),
          submittedDate: formatDate(appeal.submittedAt || appeal.createdAt),
          steps: timeline,
          comments: appeal.statusHistory?.filter(h => h.notes).map(h => ({
            officer: h.changedBy?.fullName || 'Admin',
            officerId: h.changedBy?._id || 'N/A',
            date: formatDate(h.changedAt),
            time: formatTime(h.changedAt),
            comment: h.notes,
          })) || [],
          violationDetails: {
            violationId: appeal.violationId,
            appealContext: appeal.appealReason?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A',
            submittedDate: formatDate(appeal.submittedAt || appeal.createdAt),
            deadline: appeal.appealDeadline ? formatDate(appeal.appealDeadline) : 'N/A',
          },
          adminNotes: appeal.adminNotes,
          reviewedBy: appeal.reviewedBy,
          reviewedAt: appeal.reviewedAt,
        });
      } else {
        if (response.status === 403) {
          setError('Access denied. You can only view your own appeals.');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'info';
      case 'under-review':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'rejected';
      default:
        return 'info';
    }
  };

  const getProgress = (status) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'under-review':
        return 2;
      case 'approved':
      case 'rejected':
        return 4;
      default:
        return 1;
    }
  };

  if (loading) {
    return (
      <div className="appeal-status-page">
        <div className="page-content">
          <div className="loading-container">
            <p>Loading appeal status...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !appealData) {
    return (
      <div className="appeal-status-page">
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

  if (!appealData) {
    return null;
  }
   /* appealId: id || '#20240715-001',
    violationId: 'VIOL-2025-001234',
    status: 'Under Review',
    statusColor: 'warning',
    submittedDate: 'December 15, 2025',
    progress: 2, // Step 2 of 4
    steps: [
      { 
        name: 'Appeal Submitted', 
        completed: true,
        date: 'Dec 15, 2025',
        description: 'Your appeal has been successfully submitted and received by our system.'
      },
      { 
        name: 'Under Review', 
        completed: true, 
        current: true,
        date: 'Dec 16, 2025',
        description: 'A traffic officer is currently reviewing your appeal and evidence.'
      },
      { 
        name: 'Decision Made', 
        completed: false,
        date: 'Pending',
        description: 'A decision will be made based on the review of your appeal.'
      },
      { 
        name: 'Appeal Resolved', 
        completed: false,
        date: 'Pending',
        description: 'You will be notified of the final decision and any required actions.'
      },
    ],
    comments: [
      {
        officer: 'Officer Ramirez',
        officerId: 'OFF-12345',
        date: 'December 16, 2025',
        time: '2:30 PM',
        comment: 'Appeal received and is currently under review. All submitted evidence has been examined. Please allow 3-5 business days for a decision. We will notify you via email and SMS once the review is complete.',
      },
    ],
    violationDetails: {
      type: 'Speeding Violation',
      location: '123 Temple Road, Galle',
      date: 'December 15, 2025',
      fine: 'Rs. 2,500'
    }
  };
*/
  return (
    <div className="appeal-status-page">
      <div className="page-content">
        <div className="status-container">
          <div className="form-header">
            <h1 className="form-title">Appeal Status</h1>
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

          <div className="appeal-header-card">
            <div className="appeal-id-section">
              <span className="appeal-id-label">Appeal ID</span>
              <h2 className="appeal-id-value">{appealData.appealId.substring(0, 8).toUpperCase()}</h2>
            </div>
            <div className="status-badge-large">
              <span className={`status-indicator-dot ${appealData.statusColor}`}></span>
              <span className="status-text">{appealData.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </div>
          </div>

          <div className="violation-summary-card">
            <h3 className="summary-title">Appeal Information</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Violation ID</span>
                <span className="summary-value">{appealData.violationId}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Appeal Context</span>
                <span className="summary-value">{appealData.violationDetails.appealContext}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Submitted Date</span>
                <span className="summary-value">{appealData.violationDetails.submittedDate}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Appeal Deadline</span>
                <span className="summary-value">{appealData.violationDetails.deadline}</span>
              </div>
            </div>
            <Link 
              to={`/violation-details/${appealData.violationId}`}
              state={{ appealId: appealData.appealId }}
              className="view-violation-link"
            >
              View Full Violation Details →
            </Link>
          </div>

          <div className="progress-section">
            <div className="progress-header">
              <h3 className="progress-title">Appeal Progress</h3>
              <span className="progress-percentage">{Math.round((appealData.progress / 4) * 100)}%</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${(appealData.progress / 4) * 100}%` }}
              ></div>
            </div>
            <p className="progress-text">Step {appealData.progress} of 4 completed</p>
          </div>

          <div className="timeline-section">
            <h3 className="timeline-title">Appeal Timeline</h3>
            <div className="timeline-container">
              {appealData.steps.map((step, index) => (
                <div key={index} className={`timeline-item ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}>
                  <div className="timeline-marker">
                    <div className={`timeline-icon ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}>
                      {step.completed ? '✓' : index + 1}
                    </div>
                    {index < appealData.steps.length - 1 && (
                      <div className={`timeline-line ${step.completed ? 'completed' : ''}`}></div>
                    )}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h4 className="timeline-step-title">{step.name}</h4>
                      <span className="timeline-date">{step.date}</span>
                    </div>
                    <p className="timeline-description">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {appealData.comments.length > 0 && (
            <div className="comments-section">
              <h3 className="comments-title">Admin Updates & Comments</h3>
              {appealData.comments.map((comment, index) => (
                <div key={index} className="comment-card">
                  <div className="comment-header-section">
                    <div className="comment-avatar">
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: '#1280ED',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                      }}>
                        {comment.officer.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                    </div>
                    <div className="comment-meta">
                      <h4 className="comment-author">{comment.officer}</h4>
                      <p className="comment-date-time">{comment.date} at {comment.time}</p>
                    </div>
                  </div>
                  <div className="comment-text-wrapper">
                    <p className="comment-text">{comment.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {appealData.adminNotes && appealData.status !== 'pending' && (
            <div className="comments-section">
              <h3 className="comments-title">Admin Decision</h3>
              <div className="comment-card">
                <div className="comment-text-wrapper">
                  <p className="comment-text">
                    <strong>{appealData.status === 'approved' ? 'Approved: ' : 'Rejected: '}</strong>
                    {appealData.adminNotes}
                  </p>
                  {appealData.reviewedAt && (
                    <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                      Reviewed on: {formatDate(appealData.reviewedAt)} at {formatTime(appealData.reviewedAt)}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Next Steps for Rejected Appeals */}
              {appealData.status === 'rejected' && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '20px',
                  backgroundColor: '#FFF3E0',
                  borderRadius: '8px',
                  border: '1px solid #FF9800',
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
              )}
            </div>
          )}

          <div className="help-section">
            <h3 className="help-title">Need Assistance?</h3>
            <p className="help-text">
              If you have questions about your appeal status or need to provide additional information, 
              please contact our support team.
            </p>
            <div className="help-contacts">
              <a href="mailto:appeals@trafficdept.gov" className="help-link">📧 appeals@trafficdept.gov</a>
              <a href="tel:+5551234567" className="help-link">📞 (555) 123-4567</a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AppealStatus;

