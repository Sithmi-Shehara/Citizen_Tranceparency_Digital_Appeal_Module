import React from 'react';
import Footer from '../components/Footer';
import './HowItWorks.css';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: 'Submit Your Appeal',
      description: 'Complete the online form with all necessary details including violation ID, appeal reason, description, and supporting evidence. Make sure to provide accurate information to help expedite the review process.',
      icon: '📝'
    },
    {
      number: 2,
      title: 'Review Process',
      description: 'Our team reviews your submission, considering all provided information and evidence. The review typically takes 3-5 business days. You can track your appeal status in real-time through your dashboard.',
      icon: '🔍'
    },
    {
      number: 3,
      title: 'Decision & Notification',
      description: 'Once the review is complete, you will receive a notification via email and SMS with the final decision on your appeal. If approved, the violation will be removed from your record. If additional information is needed, you will be contacted.',
      icon: '📧'
    },
    {
      number: 4,
      title: 'Follow Up',
      description: 'If your appeal is approved, no further action is required. If additional documentation is needed or if you wish to appeal the decision, you can do so through your dashboard within 30 days.',
      icon: '✅'
    }
  ];

  return (
    <div className="how-it-works-page">
      <div className="page-content">
        <div className="content-container">
          <div className="page-header">
            <h1 className="page-title">How It Works</h1>
            <p className="page-subtitle">
              Learn how to submit and track your traffic violation appeals through our simple, transparent process.
            </p>
          </div>

          <div className="steps-section">
            {steps.map((step) => (
              <div key={step.number} className="step-card">
                <div className="step-number-badge">
                  <span className="step-icon">{step.icon}</span>
                  <span className="step-number">{step.number}</span>
                </div>
                <div className="step-content">
                  <h2 className="step-title">{step.title}</h2>
                  <p className="step-description">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="info-section">
            <h2 className="info-title">Important Information</h2>
            <div className="info-grid">
              <div className="info-card">
                <h3>⏱️ Processing Time</h3>
                <p>Appeals are typically reviewed within 3-5 business days. Complex cases may take up to 10 business days.</p>
              </div>
              <div className="info-card">
                <h3>📄 Required Documents</h3>
                <p>Supporting evidence such as photos, videos, or documents can strengthen your appeal case.</p>
              </div>
              <div className="info-card">
                <h3>📞 Contact Support</h3>
                <p>Need help? Contact our support team at appeals@trafficdept.gov or call (555) 123-4567.</p>
              </div>
              <div className="info-card">
                <h3>⏰ Appeal Deadline</h3>
                <p>You have 30 days from the violation date to submit an appeal. Late submissions may not be considered.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HowItWorks;

