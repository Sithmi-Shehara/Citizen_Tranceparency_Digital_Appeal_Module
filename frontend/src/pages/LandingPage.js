import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-overlay">
            <div className="hero-content">
              <h1 className="hero-title">
                Citizen Appeal Management System
              </h1>
              <p className="hero-subtitle">
                A module of Digital Traffic Accident and Violation Detection System, 
                with a simple ML model for basic prediction support.
              </p>
              <Link to="/register" className="hero-button">
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="how-it-works">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-icon-wrapper">
                <div className="step-icon">1</div>
                <div className="step-line"></div>
              </div>
              <div className="step-content">
                <h3 className="step-title">Submit Your Appeal</h3>
                <p className="step-description">
                  Complete the online form with all necessary details and evidence.
                </p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-icon-wrapper">
                <div className="step-line-top"></div>
                <div className="step-icon">2</div>
                <div className="step-line"></div>
              </div>
              <div className="step-content">
                <h3 className="step-title">Review Process</h3>
                <p className="step-description">
                  Our team reviews your submission, considering all provided information.
                </p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-icon-wrapper">
                <div className="step-line-top"></div>
                <div className="step-icon">3</div>
              </div>
              <div className="step-content">
                <h3 className="step-title">Decision & Notification</h3>
                <p className="step-description">
                  Receive a notification with the final decision on your appeal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Register
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default LandingPage;

