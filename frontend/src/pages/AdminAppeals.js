import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/api';
import { getToken } from '../utils/auth';
import './AdminDashboard.css';

const AdminAppeals = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appeals, setAppeals] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAppeals();
  }, [filter, page]);

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
        `${API_BASE_URL}/appeals/admin/all?page=${page}&limit=20${statusParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setAppeals(data.data.appeals || []);
        setTotalPages(data.pages || 1);
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

  return (
    <div className="admin-dashboard">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">All Appeals</h1>
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

        <div className="filter-buttons" style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => { setFilter('all'); setPage(1); }}
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
            onClick={() => { setFilter('pending'); setPage(1); }}
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
            onClick={() => { setFilter('under-review'); setPage(1); }}
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
            onClick={() => { setFilter('approved'); setPage(1); }}
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
            onClick={() => { setFilter('rejected'); setPage(1); }}
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

        {loading ? (
          <div className="loading-container">
            <p>Loading appeals...</p>
          </div>
        ) : appeals.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#757575' }}>
            No appeals found for the selected filter.
          </div>
        ) : (
          <>
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

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: page === 1 ? '#e0e0e0' : '#2196F3',
                    color: page === 1 ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: page === totalPages ? '#e0e0e0' : '#2196F3',
                    color: page === totalPages ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminAppeals;

