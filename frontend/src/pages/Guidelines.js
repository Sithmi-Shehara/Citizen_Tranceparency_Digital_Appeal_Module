import React from 'react';
import Footer from '../components/Footer';
import './Guidelines.css';

const Guidelines = () => {
  const guidelines = [
    {
      section: 'Eligibility Requirements',
      icon: '✅',
      items: [
        'You must be the registered owner of the vehicle or have authorization to appeal on behalf of the owner.',
        'Appeals must be submitted within 30 days of the violation date.',
        'You must have a valid violation ID from your ticket or notice.',
        'All required information and documentation must be provided at the time of submission.'
      ]
    },
    {
      section: 'Required Information',
      icon: '📋',
      items: [
        'Violation ID (found on your ticket or notice)',
        'Clear reason for appeal (select from predefined categories)',
        'Detailed description of the circumstances surrounding the violation',
        'Supporting evidence such as photos, videos, or documents',
        'Your contact information (email and phone number)'
      ]
    },
    {
      section: 'Evidence Guidelines',
      icon: '📸',
      items: [
        'Photos should be clear, high-resolution, and timestamped if possible.',
        'Videos should show the complete incident and be unedited.',
        'Documents should be legible and relevant to your appeal.',
        'Multiple pieces of evidence strengthen your case.',
        'Ensure evidence clearly supports your stated reason for appeal.'
      ]
    },
    {
      section: 'Appeal Reasons',
      icon: '💭',
      items: [
        'Incorrect Speed Limit: Speed limit signage was missing, unclear, or incorrect.',
        'Wrong Vehicle: The violation was issued to the wrong vehicle.',
        'Emergency Situation: Medical emergency or other urgent circumstances.',
        'Technical Error: Camera malfunction, system error, or data mistake.',
        'Other: Valid reasons not covered by the above categories.'
      ]
    },
    {
      section: 'What NOT to Include',
      icon: '❌',
      items: [
        'Do not submit false or misleading information.',
        'Do not include personal attacks or inappropriate language.',
        'Do not submit duplicate appeals for the same violation.',
        'Do not include irrelevant evidence or documentation.',
        'Do not attempt to appeal violations that are clearly valid.'
      ]
    },
    {
      section: 'Timeline & Deadlines',
      icon: '⏰',
      items: [
        'Submit appeal within 30 days of violation date.',
        'Initial review: 1-2 business days.',
        'Detailed review: 3-5 business days.',
        'Decision notification: Within 1 business day of review completion.',
        'If rejected, you have 15 days to submit additional information or a second appeal.'
      ]
    },
    {
      section: 'Best Practices',
      icon: '⭐',
      items: [
        'Be honest and accurate in your description.',
        'Provide as much detail as possible about the circumstances.',
        'Submit clear, relevant evidence that supports your case.',
        'Review all information before submitting.',
        'Keep copies of all submitted documents.',
        'Check your email regularly for updates on your appeal status.'
      ]
    },
    {
      section: 'After Submission',
      icon: '📬',
      items: [
        'You will receive a confirmation email with your appeal reference number.',
        'Track your appeal status through your dashboard.',
        'Respond promptly if additional information is requested.',
        'Check your email and SMS for notifications.',
        'Do not submit multiple appeals for the same violation.'
      ]
    }
  ];

  return (
    <div className="guidelines-page">
      <div className="page-content">
        <div className="content-container">
          <div className="page-header">
            <h1 className="page-title">Appeal Guidelines</h1>
            <p className="page-subtitle">
              Follow these guidelines to ensure your appeal is processed efficiently and has the best chance of success.
            </p>
          </div>

          <div className="guidelines-section">
            {guidelines.map((guideline, index) => (
              <div key={index} className="guideline-card">
                <div className="guideline-header">
                  <span className="guideline-icon">{guideline.icon}</span>
                  <h2 className="guideline-title">{guideline.section}</h2>
                </div>
                <ul className="guideline-list">
                  {guideline.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="guideline-item">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="important-notice">
            <h2 className="notice-title">⚠️ Important Notice</h2>
            <p className="notice-text">
              Providing false information or submitting fraudulent appeals may result in legal consequences. 
              All appeals are reviewed by qualified traffic officers, and decisions are based on evidence and applicable traffic laws.
            </p>
          </div>

          <div className="help-section">
            <h2 className="help-title">Need Help?</h2>
            <p className="help-text">
              If you have questions about these guidelines or need assistance with your appeal, please contact our support team.
            </p>
            <div className="help-contact">
              <p><strong>Email:</strong> appeals@trafficdept.gov</p>
              <p><strong>Phone:</strong> (555) 123-4567</p>
              <p><strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Guidelines;













