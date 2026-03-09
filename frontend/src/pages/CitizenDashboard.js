import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/api';
import { getToken, isAuthenticated } from '../utils/auth';
import './CitizenDashboard.css';

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
  });
  const [appeals, setAppeals] = useState([]);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');

  // AI prediction state
  const [aiForm, setAiForm] = useState({
    violation_type: 'speeding',
    violation_date: new Date().toISOString().substring(0, 10),
    evidence_uploaded: 1,
    previous_violations: 0,
    days_after_violation: 3,
    appeal_reason_length: 0,
    appeal_reason: '',
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

  // AI reason-category prediction state
  const [reasonText, setReasonText] = useState('');
  const [reasonLoading, setReasonLoading] = useState(false);
  const [reasonResult, setReasonResult] = useState(null);
  const [reasonError, setReasonError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    fetchUserData();
    fetchAppeals();
  }, [navigate, filter]);

  const fetchUserData = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Always fetch fresh user data, no caching
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store', // Prevent caching
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data && data.data.user) {
        setUser(data.data.user);
      } else {
        console.error('Invalid user data received:', data);
        setError('Failed to load user profile');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user profile. Please refresh the page.');
    }
  };

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const response = await fetch(`${API_BASE_URL}/appeals?page=1&limit=10${statusParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const appealsList = data.data.appeals || [];
        setAppeals(appealsList);
        
        // Calculate stats
        const total = appealsList.length;
        const pending = appealsList.filter(a => a.status === 'pending').length;
        const underReview = appealsList.filter(a => a.status === 'under-review').length;
        const approved = appealsList.filter(a => a.status === 'approved').length;
        const rejected = appealsList.filter(a => a.status === 'rejected').length;
        
        setStats({
          total: data.total || total,
          pending: pending,
          underReview: underReview,
          approved: approved,
          rejected: rejected,
        });
      } else {
        setError(data.message || 'Failed to fetch appeals');
      }
    } catch (error) {
      console.error('Appeals fetch error:', error);
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Keep previous violations in AI form in sync with the user's appeal count
  useEffect(() => {
    setAiForm((prev) => ({
      ...prev,
      previous_violations: appeals.length || 0,
    }));
  }, [appeals]);

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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'under-review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'under-review':
        return 'under-review';
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      default:
        return '';
    }
  };

  // AI form change handler
  const handleAiChange = (field, value) => {
    setAiForm((prev) => {
      // When appeal_reason changes, automatically update its length field too
      if (field === 'appeal_reason') {
        const text = value || '';
        return {
          ...prev,
          appeal_reason: text,
          appeal_reason_length: text.length,
        };
      }

      // When violation_date changes, automatically compute days_after_violation
      if (field === 'violation_date') {
        const dateVal = value;
        let daysAfter = 0;
        if (dateVal) {
          const violationDate = new Date(dateVal);
          const today = new Date();
          const diffMs = today.getTime() - violationDate.getTime();
          daysAfter = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        }
        return {
          ...prev,
          violation_date: dateVal,
          days_after_violation: daysAfter,
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // Call AI prediction API
  const handleAiPredict = async () => {
    try {
      setAiError('');
      setAiResult(null);

      // Validation: appeal reason must be present
      if (!aiForm.appeal_reason || !aiForm.appeal_reason.trim()) {
        setAiError('Please enter an appeal reason before predicting.');
        return;
      }

      setAiLoading(true);

      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/ai/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(aiForm),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAiError(data.message || 'Could not get prediction');
      } else {
        setAiResult({
          prediction: data.prediction,
          probability: data.probability,
          reasoning: data.reasoning || data.formatted_output || '',
        });
      }
    } catch (err) {
      console.error('AI prediction error:', err);
      setAiError('Network error while contacting AI service');
    } finally {
      setAiLoading(false);
    }
  };

  // Call AI reason-category prediction API
  const handleReasonPredict = async () => {
    try {
      setReasonError('');
      setReasonResult(null);

      if (!reasonText || !reasonText.trim()) {
        setReasonError('Please enter an appeal reason to categorize.');
        return;
      }

      setReasonLoading(true);

      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/ai/predict-reason`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appeal_reason: reasonText }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setReasonError(data.message || 'Could not get reason category prediction');
      } else {
        setReasonResult({
          category: data.category,
          confidence: data.confidence,
          probabilities: data.probabilities || null,
        });
      }
    } catch (err) {
      console.error('AI reason prediction error:', err);
      setReasonError('Network error while contacting AI reason service');
    } finally {
      setReasonLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="citizen-dashboard">
        <div className="dashboard-content">
          <div className="loading-container">
            <p>Loading dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const userName = user?.fullName || 'Citizen';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const probabilityPercent = aiResult ? Math.round(aiResult.probability * 100) : 0;
  const previousViolationsCount = appeals.length || 0;

  return (
    <div className="citizen-dashboard">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">My Appeals Dashboard</h1>
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

        <div className="user-profile">
          <div className="profile-avatar">
            {user?.profilePhoto ? (
              <img 
                src={`${API_BASE_URL.replace('/api', '')}${user.profilePhoto.startsWith('/uploads') ? user.profilePhoto : `/uploads/${user.profilePhoto}`}`}
                alt={userName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%',
                }}
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div style="width: 100%; height: 100%; border-radius: 50%; background-color: #1280ED; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;">${userInitials}</div>`;
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: '#1280ED',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
              }}>
                {userInitials}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{userName}</h2>
            <p className="profile-role">Citizen</p>
          </div>
        </div>

        <div className="stats-container">
          <div 
            className="stat-card" 
            style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => setFilter('all')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <h3 className="stat-label">Total Appeals</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
          <div 
            className="stat-card" 
            style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => setFilter('pending')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <h3 className="stat-label">Pending</h3>
            <p className="stat-value">{stats.pending}</p>
          </div>
          <div 
            className="stat-card" 
            style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => setFilter('under-review')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <h3 className="stat-label">Under Review</h3>
            <p className="stat-value">{stats.underReview}</p>
          </div>
          <div 
            className="stat-card" 
            style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => setFilter('approved')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <h3 className="stat-label">Approved</h3>
            <p className="stat-value">{stats.approved}</p>
          </div>
          <div 
            className="stat-card" 
            style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => setFilter('rejected')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <h3 className="stat-label">Rejected</h3>
            <p className="stat-value">{stats.rejected}</p>
          </div>
        </div>

        <div className="section-header">
          <h2 className="section-title">My Appeals</h2>
        </div>

        {appeals.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#757575' }}>
            <p>No appeals submitted yet.</p>
            <Link to="/submit-appeal" style={{ color: '#1280ED', textDecoration: 'none' }}>
              Submit your first appeal →
            </Link>
          </div>
        ) : (
          <div className="appeals-list">
            {appeals.map((appeal) => (
              <Link key={appeal._id} to={`/appeal-status/${appeal._id}`} className="appeal-card-link">
                <div className="appeal-card">
                  <div className="appeal-info">
                    <h3 className="appeal-id">Appeal ID: {appeal._id.substring(0, 8).toUpperCase()}</h3>
                    <p className="appeal-violation">
                      Violation ID: {appeal.violationId}
                    </p>
                    <p className="appeal-violation" style={{ fontSize: '14px', marginTop: '4px' }}>
                      Appeal Context: {appeal.appealReason?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Submitted: {formatDate(appeal.submittedAt || appeal.createdAt)}
                    </p>
                    {appeal.adminNotes && (
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
                        {appeal.status === 'approved' ? '✓ Approved' : appeal.status === 'rejected' ? '✗ Rejected: ' + appeal.adminNotes.substring(0, 50) + '...' : ''}
                      </p>
                    )}
                  </div>
                  <div className="appeal-status">
                    <span className={`status-badge ${getStatusClass(appeal.status)}`}>
                      {getStatusLabel(appeal.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {appeals.length > 0 && (
          <div className="view-all-section">
            <Link to="/appeal-tracking" className="view-all-link">
              View All Appeals →
            </Link>
          </div>
        )}

        {/* AI Prediction Card */}
        <div className="ai-prediction-card">
          <div className="ai-prediction-header">
            <div>
              <div className="ai-prediction-title">AI Appeal Outcome Predictor</div>
              <div className="ai-prediction-subtitle">
                Estimate the likelihood that a new appeal will be approved before you submit.
              </div>
            </div>
          </div>

          {aiError && (
            <div style={{ marginBottom: 10, color: '#b91c1c', fontSize: 12 }}>
              {aiError}
            </div>
          )}

          <div className="ai-form-grid">
            <div className="ai-form-field" style={{ gridColumn: '1 / -1' }}>
              <label className="ai-form-label">Appeal Reason (full text)</label>
              <textarea
                className="ai-form-input"
                rows={3}
                value={aiForm.appeal_reason}
                onChange={(e) => handleAiChange('appeal_reason', e.target.value)}
                placeholder="Describe what happened, any evidence, and why you believe the fine should be reconsidered."
              />
              <div className="ai-form-helper">
                The explanation below will be based only on what you write here, not on length alone.
              </div>
              <div className="ai-form-helper">
                Appeal Reason Length: {aiForm.appeal_reason_length} characters
              </div>
            </div>

            <div className="ai-form-field">
              <label className="ai-form-label">Violation Type</label>
              <select
                className="ai-form-select"
                value={aiForm.violation_type}
                onChange={(e) => handleAiChange('violation_type', e.target.value)}
              >
                <option value="speeding">Speeding</option>
                <option value="red_light">Red Light</option>
                <option value="parking">Parking</option>
                <option value="no_seatbelt">No Seatbelt</option>
                <option value="illegal_turn">Illegal Turn</option>
                <option value="mobile_use">Mobile Phone Use</option>
              </select>
            </div>

            <div className="ai-form-field">
              <label className="ai-form-label">Violation Date</label>
              <input
                type="date"
                className="ai-form-input"
                value={aiForm.violation_date}
                onChange={(e) => handleAiChange('violation_date', e.target.value)}
              />
              <div className="ai-form-helper">Used to derive weekday &amp; month</div>
            </div>

            <div className="ai-form-field">
              <label className="ai-form-label">Evidence Uploaded</label>
              <select
                className="ai-form-select"
                value={String(aiForm.evidence_uploaded)}
                onChange={(e) => handleAiChange('evidence_uploaded', Number(e.target.value))}
              >
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </div>

            <div className="ai-form-field">
              <label className="ai-form-label">Previous Violations</label>
              <div className="ai-form-input" style={{ backgroundColor: '#f3f4f6' }}>
                {previousViolationsCount}
              </div>
              <div className="ai-form-helper">
                Automatically calculated from your past appeals.
              </div>
            </div>

            <div className="ai-form-field">
              <label className="ai-form-label">Days After Violation</label>
              <div className="ai-form-input" style={{ backgroundColor: '#f3f4f6' }}>
                {aiForm.days_after_violation}
              </div>
              <div className="ai-form-helper">Automatically calculated from violation date.</div>
            </div>
          </div>

          <div className="ai-submit-row">
            <button
              className="ai-submit-button"
              onClick={handleAiPredict}
              disabled={aiLoading}
            >
              {aiLoading ? 'Predicting...' : 'Predict Approval Probability'}
            </button>

            {aiResult && (
              <div
                className={
                  'ai-result-badge ' +
                  (aiResult.prediction === 'approved'
                    ? 'ai-result-approved'
                    : 'ai-result-rejected')
                }
              >
                <span>
                  {aiResult.prediction === 'approved' ? 'Likely Approved' : 'Likely Rejected'}
                </span>
                <span>({probabilityPercent}% chance)</span>
              </div>
            )}
          </div>

          {aiResult && (
            <div className="ai-probability-bar">
              <div className="ai-probability-track">
                <div
                  className="ai-probability-fill"
                  style={{ width: `${probabilityPercent}%` }}
                />
              </div>
              <div className="ai-probability-label-row">
                <span>0%</span>
                <span>Approval Probability</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {aiResult && aiResult.reasoning && (
            <div className="ai-reasoning-text">
              {aiResult.reasoning.split('\n').map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          )}
        </div>

      {/* AI Reason Category Card */}
      <div className="ai-prediction-card">
        <div className="ai-prediction-header">
          <div>
            <div className="ai-prediction-title">AI Appeal Reason Categorizer</div>
            <div className="ai-prediction-subtitle">
              Automatically categorize your appeal reason (e.g. Incorrect Violation, Emergency Situation,
              Technical Error) before you submit.
            </div>
          </div>
        </div>

        {reasonError && (
          <div style={{ marginBottom: 10, color: '#b91c1c', fontSize: 12 }}>
            {reasonError}
          </div>
        )}

        <div className="ai-form-field" style={{ marginBottom: 12 }}>
          <label className="ai-form-label">Appeal Reason (full text)</label>
          <textarea
            className="ai-form-input"
            rows={3}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Paste or type your appeal reason here to see how the system categorizes it."
          />
        </div>

        <div className="ai-submit-row">
          <button
            className="ai-submit-button"
            onClick={handleReasonPredict}
            disabled={reasonLoading}
          >
            {reasonLoading ? 'Predicting...' : 'Predict Reason Category'}
          </button>

          {reasonResult && (
            <div className="ai-result-badge ai-result-approved">
              <span>Category: {reasonResult.category}</span>
              {typeof reasonResult.confidence === 'number' && (
                <span>({Math.round(reasonResult.confidence * 100)}% confidence)</span>
              )}
            </div>
          )}
        </div>

        {reasonResult && reasonResult.probabilities && (
          <div className="ai-reasoning-text">
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Category probabilities</div>
            {Object.entries(reasonResult.probabilities).map(([label, prob]) => (
              <div key={label}>
                {label}: {Math.round(prob * 100)}%
              </div>
            ))}
          </div>
        )}
      </div>

        <div className="floating-button-container">
          <Link to="/submit-appeal" className="floating-button">
            <span className="button-icon">+</span>
            <span className="button-text">Submit New Appeal</span>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CitizenDashboard;

