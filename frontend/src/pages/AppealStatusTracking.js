import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/api';
import { getToken, isAuthenticated } from '../utils/auth';
import './AppealStatusTracking.css';

const AppealStatusTracking = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appeals, setAppeals] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
  });
  const [allAppeals, setAllAppeals] = useState([]); // Store all appeals for stats

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchAppeals();
  }, [navigate, filter]);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Always fetch ALL appeals first to calculate accurate stats
      const allResponse = await fetch(`${API_BASE_URL}/appeals?page=1&limit=1000`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const allData = await allResponse.json();

      if (allData.success) {
        const allAppealsList = allData.data.appeals || [];
        setAllAppeals(allAppealsList);
        
        // Calculate stats from ALL appeals
        const total = allData.total || allAppealsList.length;
        
        const allStatuses = {
          pending: 0,
          'under-review': 0,
          approved: 0,
          rejected: 0
        };
        
        allAppealsList.forEach(appeal => {
          if (appeal.status && allStatuses.hasOwnProperty(appeal.status)) {
            allStatuses[appeal.status]++;
          }
        });
        
        setStats({
          total,
          pending: allStatuses.pending,
          underReview: allStatuses['under-review'],
          approved: allStatuses.approved,
          rejected: allStatuses.rejected,
        });

        // Filter appeals for display based on current filter
        const filteredList = filter === 'all'
          ? allAppealsList
          : allAppealsList.filter(appeal => appeal.status === filter);
        
        setAppeals(filteredList);
      } else {
        setError(allData.message || 'Failed to fetch appeals');
      }
    } catch (error) {
      console.error('Appeals fetch error:', error);
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

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'info', progress: 1 };
      case 'under-review':
        return { label: 'Under Review', color: 'warning', progress: 2 };
      case 'approved':
        return { label: 'Approved', color: 'success', progress: 4, result: 'Approved' };
      case 'rejected':
        return { label: 'Rejected', color: 'rejected', progress: 4, result: 'Rejected' };
      default:
        return { label: status, color: 'info', progress: 1 };
    }
  };

 /* const filteredAppeals = filter === 'all' 
    ? appeals 
    : appeals.filter(appeal => {
        if (filter === 'pending') return appeal.status === 'pending';
        if (filter === 'under-review') return appeal.status === 'under-review';
        if (filter === 'approved') return appeal.status === 'approved';
        if (filter === 'rejected') return appeal.status === 'rejected';
        return true;
      });
    {
      id: '20240715-001',
      violationId: 'VIOL-2025-001234',
      violationType: 'Speeding',
      submittedDate: 'December 15, 2025',
      status: 'Under Review',
      statusColor: 'warning',
      progress: 2,
      fine: 'Rs. 2,500'
    },
    {
      id: '20240710-002',
      violationId: 'VIOL-2025-001189',
      violationType: 'Red Light Violation',
      submittedDate: 'December 10, 2025',
      status: 'Decision Made',
      statusColor: 'success',
      progress: 3,
      fine: 'Rs. 3,000'
    },
    {
      id: '20240705-003',
      violationId: 'VIOL-2025-001156',
      violationType: 'Parking Violation',
      submittedDate: 'December 5, 2025',
      status: 'Appeal Resolved',
      statusColor: 'success',
      progress: 4,
      fine: 'Rs. 800',
      result: 'Approved'
    },
    {
      id: '20240628-004',
      violationId: 'VIOL-2025-001098',
      violationType: 'Speeding',
      submittedDate: 'November 28, 2025',
      status: 'Appeal Resolved',
      statusColor: 'rejected',
      progress: 4,
      fine: 'Rs. 2,500',
      result: 'Rejected'
    },
    {
      id: '20240620-005',
      violationId: 'VIOL-2025-001045',
      violationType: 'Wrong Lane Usage',
      submittedDate: 'November 20, 2025',
      status: 'Appeal Submitted',
      statusColor: 'info',
      progress: 1,
      fine: 'Rs. 1,500'
    }
  ];*/
  // Appeals are already filtered in fetchAppeals, so use them directly
  const filteredAppeals = appeals;


  /*const filteredAppeals = filter === 'all' 
    ? appeals 
    : appeals.filter(appeal => {
        if (filter === 'pending') return appeal.progress < 4;
        if (filter === 'resolved') return appeal.progress === 4;
        return true;
      });
      */

  const getStatusBadgeClass = (statusColor) => {
    const classes = {
      'warning': 'status-warning',
      'success': 'status-success',
      'rejected': 'status-rejected',
      'info': 'status-info'
    };
    return classes[statusColor] || 'status-info';
  };

  return (
    <div className="appeal-tracking-page">
      <div className="page-content">
        <div className="content-container">
          <div className="page-header">
            <h1 className="page-title">Appeal Status & Tracking</h1>
            <p className="page-subtitle">
              Track all your submitted appeals and their current status. Click on any appeal to view detailed information.
            </p>
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

          <div className="filter-section">
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Appeals ({stats.total})
              </button>
              <button 
                className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Pending ({stats.pending})
              </button>
              <button 
                className={`filter-btn ${filter === 'under-review' ? 'active' : ''}`}
                onClick={() => setFilter('under-review')}
              >
                Under Review ({stats.underReview})
              </button>
              <button 
                className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
                onClick={() => setFilter('approved')}
              >
                Approved ({stats.approved})
              </button>
              <button 
                className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
                onClick={() => setFilter('rejected')}
              >
                Rejected ({stats.rejected})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <p>Loading appeals...</p>
            </div>
          ) : (
            <div className="appeals-list">
              {filteredAppeals.length === 0 ? (
                <div className="empty-state">
                  <p>No appeals found matching your filter.</p>
                </div>
              ) : (
                filteredAppeals.map((appeal) => {
                  const statusInfo = getStatusInfo(appeal.status);
                  return (
                    <Link 
                      key={appeal._id} 
                      to={`/appeal-status/${appeal._id}`}
                      className="appeal-card-link"
                    >
                      <div className="appeal-card">
                        <div className="appeal-card-header">
                          <div className="appeal-id-section">
                            <span className="appeal-id-label">Appeal ID</span>
                            <h3 className="appeal-id">{appeal._id.substring(0, 8).toUpperCase()}</h3>
                          </div>
                          <div className={`status-badge ${getStatusBadgeClass(statusInfo.color)}`}>
                            <span className="status-dot"></span>
                            <span className="status-text">{statusInfo.label}</span>
                          </div>
                        </div>

                        <div className="appeal-card-body">
                          <div className="appeal-info-grid">
                            <div className="info-item">
                              <span className="info-label">Appeal Context</span>
                              <span className="info-value">
                                {appeal.appealReason?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                              </span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Violation ID</span>
                              <span className="info-value">{appeal.violationId}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Submitted Date</span>
                              <span className="info-value">{formatDate(appeal.submittedAt || appeal.createdAt)}</span>
                            </div>
                            {appeal.appealDeadline && (
                              <div className="info-item">
                                <span className="info-label">Deadline</span>
                                <span className="info-value">{formatDate(appeal.appealDeadline)}</span>
                              </div>
                            )}
                          </div>

                          <div className="progress-section-mini">
                            <div className="progress-bar-mini">
                              <div 
                                className="progress-fill-mini" 
                                style={{ width: `${(statusInfo.progress / 4) * 100}%` }}
                              ></div>
                            </div>
                            <span className="progress-text-mini">Step {statusInfo.progress} of 4</span>
                          </div>

                          {statusInfo.result && (
                            <div className={`result-badge ${statusInfo.result.toLowerCase()}`}>
                              {statusInfo.result === 'Approved' ? '✓ Approved' : '✗ Rejected'}
                            </div>
                          )}
                        </div>

                        <div className="appeal-card-footer">
                          <span className="view-details">View Details →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}

          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Appeals</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.pending + stats.underReview}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.approved}</span>
              <span className="stat-label">Approved</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.rejected}</span>
              <span className="stat-label">Rejected</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AppealStatusTracking;




