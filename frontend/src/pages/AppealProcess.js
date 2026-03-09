import React from 'react';
import Footer from '../components/Footer';
import './AppealProcess.css';

const AppealProcess = () => {
  const processSteps = [
    {
      stage: 'Stage 1',
      title: 'Submit Your Appeal',
      description: 'Fill out the appeal form with accurate information including violation ID, reason for appeal, detailed description, and upload supporting evidence.',
      duration: '5-10 minutes',
      requirements: [
        'Valid violation ID',
        'Clear reason for appeal',
        'Detailed description of circumstances',
        'Supporting evidence (photos, videos, documents)'
      ]
    },
    {
      stage: 'Stage 2',
      title: 'Initial Review',
      description: 'Our system automatically checks your submission for completeness and validity. Incomplete submissions will be returned for additional information.',
      duration: '1-2 business days',
      requirements: [
        'All required fields completed',
        'Evidence files uploaded successfully',
        'Valid violation ID format'
      ]
    },
    {
      stage: 'Stage 3',
      title: 'Detailed Review',
      description: 'A traffic officer reviews your appeal, examines the evidence, and considers all circumstances. This is the main evaluation phase.',
      duration: '3-5 business days',
      requirements: [
        'Officer examines all submitted evidence',
        'Cross-references with violation records',
        'Considers applicable traffic laws'
      ]
    },
    {
      stage: 'Stage 4',
      title: 'Decision Made',
      description: 'A decision is reached based on the review. You will be notified immediately via email and SMS with the outcome and any next steps.',
      duration: '1 business day',
      requirements: [
        'Appeal approved or rejected',
        'Detailed explanation provided',
        'Next steps communicated'
      ]
    },
    {
      stage: 'Stage 5',
      title: 'Resolution',
      description: 'If approved, the violation is removed from your record. If rejected, you may have options to provide additional information or submit a second appeal.',
      duration: 'Immediate',
      requirements: [
        'Violation removed (if approved)',
        'Fine waived (if approved)',
        'Appeal option available (if rejected)'
      ]
    }
  ];

  return (
    <div className="appeal-process-page">
      <div className="page-content">
        <div className="content-container">
          <div className="page-header">
            <h1 className="page-title">Appeal Process</h1>
            <p className="page-subtitle">
              Understand the complete appeal process from submission to resolution. Each stage is designed to ensure fair and thorough review of your case.
            </p>
          </div>

          <div className="process-timeline">
            {processSteps.map((step, index) => (
              <div key={index} className="process-step">
                <div className="step-marker">
                  <div className="marker-circle">
                    <span className="marker-number">{index + 1}</span>
                  </div>
                  {index < processSteps.length - 1 && <div className="marker-line"></div>}
                </div>
                <div className="step-content">
                  <div className="step-header">
                    <span className="step-stage">{step.stage}</span>
                    <span className="step-duration">⏱️ {step.duration}</span>
                  </div>
                  <h2 className="step-title">{step.title}</h2>
                  <p className="step-description">{step.description}</p>
                  <div className="step-requirements">
                    <h3 className="requirements-title">Requirements:</h3>
                    <ul className="requirements-list">
                      {step.requirements.map((req, reqIndex) => (
                        <li key={reqIndex}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="tips-section">
            <h2 className="tips-title">Tips for a Successful Appeal</h2>
            <div className="tips-grid">
              <div className="tip-card">
                <h3>📸 Provide Clear Evidence</h3>
                <p>High-quality photos or videos that clearly show the circumstances can significantly strengthen your case.</p>
              </div>
              <div className="tip-card">
                <h3>📝 Be Detailed and Accurate</h3>
                <p>Provide a comprehensive description with specific dates, times, and locations. Accuracy is crucial.</p>
              </div>
              <div className="tip-card">
                <h3>⏰ Submit on Time</h3>
                <p>Submit your appeal within 30 days of the violation date to ensure it's considered.</p>
              </div>
              <div className="tip-card">
                <h3>✅ Review Before Submitting</h3>
                <p>Double-check all information and ensure all required documents are attached before submitting.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AppealProcess;













