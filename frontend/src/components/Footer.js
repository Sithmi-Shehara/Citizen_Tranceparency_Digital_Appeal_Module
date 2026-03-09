import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <div className="footer-logo-icon">🚦</div>
              <div className="footer-logo-text">
                <h3>Citizen Appeal</h3>
                <p>Management System</p>
              </div>
            </div>
            <p className="footer-description">
              A comprehensive digital platform for managing traffic violation appeals 
              and ensuring transparent communication between citizens and traffic authorities.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/submit-appeal">Submit Appeal</Link></li>
              <li><Link to="/dashboard">My Appeals</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Resources</h4>
            <ul className="footer-links">
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/appeal-process">Appeal Process</Link></li>
              <li><Link to="/violation-types">Violation Types</Link></li>
              <li><Link to="/guidelines">Guidelines</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Contact Us</h4>
            <div className="footer-contact">
              <p>
                <strong>City Traffic Department</strong><br />
                123 Government Street<br />
                City, State 12345
              </p>
              <p>
                <strong>Phone:</strong> (555) 123-4567<br />
                <strong>Email:</strong> appeals@trafficdept.gov
              </p>
              <p>
                <strong>Office Hours:</strong><br />
                Monday - Friday: 8:00 AM - 5:00 PM
              </p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>© 2024 City Traffic Department. All rights reserved.</p>
          </div>
          <div className="footer-legal">
            <a href="#privacy">Privacy Policy</a>
            <span>|</span>
            <a href="#terms">Terms of Service</a>
            <span>|</span>
            <a href="#accessibility">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
