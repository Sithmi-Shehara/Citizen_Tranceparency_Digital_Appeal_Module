import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/api';
import { getToken } from '../utils/auth';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [statistics, setStatistics] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, under-review, approved, rejected
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch statistics
  useEffect(() => {
    fetchStatistics();
    fetchNotifications();
  }, []);

  // Refresh notifications when returning to dashboard (e.g., after reviewing appeal)
  useEffect(() => {
    if (location.pathname === '/admin/dashboard') {
      fetchNotifications();
    }
  }, [location.pathname]);

  // Fetch appeals based on filter
  useEffect(() => {
    fetchAppeals();
  }, [filter]);

  const fetchStatistics = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/appeals/admin/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setStatistics(data.data);
        setStats({
          total: data.data.overview.total,
          pending: data.data.overview.pending,
          underReview: data.data.overview.underReview,
          approved: data.data.overview.approved,
          rejected: data.data.overview.rejected,
        });
      } else {
        setError(data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Statistics fetch error:', error);
      setError('Network error. Please check if backend is running.');
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/notifications?status=unread&limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Notifications fetch error:', error);
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
      const response = await fetch(
        `${API_BASE_URL}/appeals/admin/all?page=1&limit=10${statusParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setAppeals(data.data.appeals || []);
      } else {
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else {
          setError(data.message || 'Failed to fetch appeals');
        }
      }
    } catch (error) {
      console.error('Appeals fetch error:', error);
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppealClick = (appealId) => {
    navigate(`/admin/appeal-review/${appealId}`);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'under-review':
        return '#2196F3';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  if (loading && appeals.length === 0) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-content">
          <div className="loading-container">
            <p>Loading dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {unreadCount > 0 && (
              <div style={{
                position: 'relative',
                padding: '8px 16px',
                backgroundColor: '#F44336',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}>
                🔔 {unreadCount} New Appeal{unreadCount > 1 ? 's' : ''}
              </div>
            )}
            <button className="menu-button">☰</button>
          </div>
        </div>

        {notifications.length > 0 && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '1px solid #2196F3',
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
              Recent Notifications
            </h3>
                {notifications.slice(0, 3).map((notif) => (
              <div key={notif._id} style={{
                padding: '8px',
                marginBottom: '8px',
                backgroundColor: 'white',
                borderRadius: '4px',
                fontSize: '14px',
              }}>
                <strong>{notif.title}:</strong> {notif.message}
                {notif.appealId && (
                  <button
                    onClick={async () => {
                      // Mark notification as read
                      try {
                        const token = getToken();
                        if (token && notif._id) {
                          await fetch(`${API_BASE_URL}/notifications/${notif._id}/read`, {
                            method: 'PUT',
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          });
                          // Refresh notifications to remove the read one
                          fetchNotifications();
                        }
                      } catch (error) {
                        console.error('Error marking notification as read:', error);
                      }
                      // Navigate to review page
                      navigate(`/admin/appeal-review/${notif.appealId._id || notif.appealId}`);
                    }}
                    style={{
                      marginLeft: '10px',
                      padding: '4px 8px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Review
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

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

        <div className="stats-container">
          <div 
            className="stat-card admin-stat" 
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
            className="stat-card admin-stat" 
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
            className="stat-card admin-stat" 
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
            className="stat-card admin-stat" 
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
            className="stat-card admin-stat" 
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

        {statistics && statistics.overview.approvalRate && (
          <div className="section-header">
            <h2 className="section-title">Approval Rate: {statistics.overview.approvalRate}</h2>
          </div>
        )}


        <div className="filter-buttons" style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === 'all' ? '#2196F3' : '#e0e0e0',
              color: filter === 'all' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === 'pending' ? '#FFA500' : '#e0e0e0',
              color: filter === 'pending' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('under-review')}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === 'under-review' ? '#2196F3' : '#e0e0e0',
              color: filter === 'under-review' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Under Review
          </button>
          <button
            onClick={() => setFilter('approved')}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === 'approved' ? '#4CAF50' : '#e0e0e0',
              color: filter === 'approved' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === 'rejected' ? '#F44336' : '#e0e0e0',
              color: filter === 'rejected' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Rejected
          </button>
        </div>

        <div className="section-header">
          <h2 className="section-title">Recent Appeals</h2>
        </div>

        {loading ? (
          <div className="loading-container">
            <p>Loading appeals...</p>
          </div>
        ) : appeals.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#757575' }}>
            No appeals found for the selected filter.
          </div>
        ) : (
          <div className="appeals-list" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
          }}>
            {appeals.map((appeal) => (
              <div
                key={appeal._id}
                onClick={() => handleAppealClick(appeal._id)}
                style={{
                  padding: '20px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backgroundColor: '#fff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>
                        Appeal ID: {appeal._id.substring(0, 8).toUpperCase()}
                      </h3>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: getStatusColor(appeal.status) + '20',
                          color: getStatusColor(appeal.status),
                          textTransform: 'uppercase',
                        }}
                      >
                        {appeal.status.replace('-', ' ')}
                      </span>
                    </div>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Violation ID:</strong> {appeal.violationId}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Appeal Context:</strong> {appeal.appealReason?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Citizen:</strong> {appeal.userId?.fullName || 'N/A'} ({appeal.userId?.email || 'N/A'})
                    </p>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                      <strong>Submitted:</strong> {formatDate(appeal.submittedAt || appeal.createdAt)}
                    </p>
                    {appeal.appealDeadline && (
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                        <strong>Deadline:</strong> {formatDate(appeal.appealDeadline)}
                      </p>
                    )}
                    {appeal.reviewedBy && (
                      <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                        <strong>Reviewed by:</strong> {appeal.reviewedBy?.fullName || 'N/A'} on {formatDate(appeal.reviewedAt)}
                      </p>
                    )}
                  </div>
                  <div style={{ marginLeft: '20px' }}>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppealClick(appeal._id);
                      }}
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {statistics && statistics.byReason && statistics.byReason.length > 0 && (
          <>
            <div className="section-header" style={{ marginTop: '40px' }}>
              <h2 className="section-title">Appeals by Reason</h2>
            </div>
            <div className="appeal-types-section">
              <div className="appeal-types-list">
                {statistics.byReason.map((item) => (
                  <div key={item._id} className="appeal-type-item">
                    <span className="type-name">
                      {item._id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <div className="type-bar-wrapper">
                      <div
                        className="type-bar"
                        style={{
                          width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%`,
                        }}
                      ></div>
                      <span style={{ marginLeft: '10px', fontSize: '14px' }}>{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

