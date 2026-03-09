import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import API_BASE_URL from '../config/api';
import { getToken, removeToken, isAuthenticated } from '../utils/auth';
import './AdminDashboard.css';

const AdminProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
      } else {
        setError(data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-content">
          <div className="loading-container">
            <p>Loading profile...</p>
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
          <h1 className="dashboard-title">Admin Profile</h1>
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

        {user && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '20px',
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '30px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
              <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  margin: '0 auto 20px',
                }}>
                  {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
                <h2 style={{ margin: '10px 0', fontSize: '24px' }}>{user.fullName}</h2>
                <p style={{ color: '#666', fontSize: '16px' }}>Administrator</p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px',
              }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                    Email
                  </label>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>{user.email}</p>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                    NIC Number
                  </label>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>{user.nicNumber || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                    Mobile Number
                  </label>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>{user.mobileNumber || 'N/A'}</p>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                    Account Created
                  </label>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>{formatDate(user.createdAt)}</p>
                </div>
                {user.lastLogin && (
                  <div>
                    <label style={{ display: 'block', color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                      Last Login
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>{formatDate(user.lastLogin)}</p>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#F44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F44336'}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminProfile;

