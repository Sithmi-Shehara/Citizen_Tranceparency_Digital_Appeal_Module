import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ isAdmin = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  // Simple route-based auth state: treat citizen as "logged in" on these pages
  const citizenAuthedPaths = [
    '/dashboard',
    '/submit-appeal',
    '/appeal-status',
    '/violation-details',
  ];
  const isCitizenAuthed =
    !isAdmin &&
    citizenAuthedPaths.some((p) => location.pathname.startsWith(p));

  const navItems = isAdmin
    ? [
        { path: '/admin/dashboard', label: 'Dashboard' },
        { path: '/admin/appeals', label: 'Appeals' },
        { path: '/admin/profile', label: 'Admin Profile' },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/submit-appeal', label: 'Submit Appeal' },
        { path: '/appeal-tracking', label: 'My Appeals' },
        { path: '/profile', label: 'Profile' },
      ];

  return (
    <header className={`header ${isAdmin ? 'header-admin' : ''}`}>
      <div className="header-container">
        <div className="header-logo" onClick={() => navigate('/')}>
          <div className="logo-icon">🚦</div>
          <div className="logo-text">
            <span className="logo-title">Citizen Appeal</span>
            <span className="logo-subtitle">Management System</span>
          </div>
        </div>

        <nav className="header-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {location.pathname !== '/login' && location.pathname !== '/register' && (
            <>
              {isAdmin || isCitizenAuthed ? (
                <button
                  className="btn-logout"
                  onClick={() => navigate('/login')}
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" className="btn-login">
                    Login
                  </Link>
                  <Link to="/register" className="btn-register">
                    Register
                  </Link>
                </>
              )}
            </>
          )}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="mobile-nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;

