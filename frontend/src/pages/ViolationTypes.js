import React from 'react';
import Footer from '../components/Footer';
import './ViolationTypes.css';

const ViolationTypes = () => {
  const violationCategories = [
    {
      category: 'Speeding Violations',
      icon: '🚗',
      violations: [
        {
          type: 'Exceeding Speed Limit',
          description: 'Driving above the posted speed limit for the area.',
          commonReasons: ['Incorrect speed limit signage', 'Emergency situation', 'Speed camera malfunction'],
          fineRange: 'Rs. 1,500 - Rs. 5,000'
        },
        {
          type: 'Excessive Speed',
          description: 'Driving at speeds significantly above the limit (20+ km/h over).',
          commonReasons: ['Medical emergency', 'Vehicle malfunction', 'Incorrect speed limit posted'],
          fineRange: 'Rs. 3,000 - Rs. 7,500'
        }
      ]
    },
    {
      category: 'Traffic Signal Violations',
      icon: '🚦',
      violations: [
        {
          type: 'Red Light Violation',
          description: 'Passing through a red traffic signal or stop sign.',
          commonReasons: ['Signal timing issue', 'Emergency vehicle priority', 'Signal not visible'],
          fineRange: 'Rs. 2,000 - Rs. 4,000'
        },
        {
          type: 'Yellow Light Violation',
          description: 'Entering intersection during yellow light when unsafe.',
          commonReasons: ['Unable to stop safely', 'Signal timing too short', 'Following emergency vehicle'],
          fineRange: 'Rs. 1,000 - Rs. 2,500'
        }
      ]
    },
    {
      category: 'Parking Violations',
      icon: '🅿️',
      violations: [
        {
          type: 'No Parking Zone',
          description: 'Parking in a designated no-parking area.',
          commonReasons: ['Missing or unclear signage', 'Emergency situation', 'Authorized parking confusion'],
          fineRange: 'Rs. 500 - Rs. 1,500'
        },
        {
          type: 'Expired Parking Meter',
          description: 'Parking meter time expired or insufficient payment.',
          commonReasons: ['Meter malfunction', 'Payment system error', 'Time extension needed'],
          fineRange: 'Rs. 300 - Rs. 800'
        },
        {
          type: 'Handicap Parking Violation',
          description: 'Parking in handicap-designated space without permit.',
          commonReasons: ['Permit not displayed', 'Permit expired', 'Medical emergency'],
          fineRange: 'Rs. 2,500 - Rs. 5,000'
        }
      ]
    },
    {
      category: 'Vehicle Registration & Documentation',
      icon: '📄',
      violations: [
        {
          type: 'Expired Registration',
          description: 'Vehicle registration has expired.',
          commonReasons: ['Renewal in process', 'Documentation delay', 'System error'],
          fineRange: 'Rs. 1,000 - Rs. 3,000'
        },
        {
          type: 'Missing Documents',
          description: 'Required vehicle documents not present during inspection.',
          commonReasons: ['Documents in renewal', 'Lost documents', 'Documentation error'],
          fineRange: 'Rs. 500 - Rs. 2,000'
        }
      ]
    },
    {
      category: 'Lane & Traffic Flow Violations',
      icon: '🛣️',
      violations: [
        {
          type: 'Wrong Lane Usage',
          description: 'Driving in incorrect lane or improper lane changes.',
          commonReasons: ['Poor lane markings', 'Emergency avoidance', 'Construction detour'],
          fineRange: 'Rs. 800 - Rs. 2,000'
        },
        {
          type: 'Illegal U-Turn',
          description: 'Making U-turn where prohibited.',
          commonReasons: ['Missing signage', 'GPS navigation error', 'Emergency situation'],
          fineRange: 'Rs. 1,000 - Rs. 2,500'
        }
      ]
    },
    {
      category: 'Vehicle Equipment Violations',
      icon: '🔧',
      violations: [
        {
          type: 'Defective Equipment',
          description: 'Vehicle equipment not functioning properly (lights, brakes, etc.).',
          commonReasons: ['Recent repair', 'Equipment failure', 'Inspection error'],
          fineRange: 'Rs. 500 - Rs. 1,500'
        },
        {
          type: 'Window Tinting Violation',
          description: 'Excessive window tinting beyond legal limits.',
          commonReasons: ['Medical requirement', 'Previous approval', 'Measurement error'],
          fineRange: 'Rs. 1,000 - Rs. 2,000'
        }
      ]
    }
  ];

  return (
    <div className="violation-types-page">
      <div className="page-content">
        <div className="content-container">
          <div className="page-header">
            <h1 className="page-title">Violation Types</h1>
            <p className="page-subtitle">
              Comprehensive list of traffic violations that can be appealed through our system. Click on any violation to learn more about common appeal reasons.
            </p>
          </div>

          <div className="violations-section">
            {violationCategories.map((category, catIndex) => (
              <div key={catIndex} className="category-card">
                <div className="category-header">
                  <span className="category-icon">{category.icon}</span>
                  <h2 className="category-title">{category.category}</h2>
                </div>
                <div className="violations-list">
                  {category.violations.map((violation, violIndex) => (
                    <div key={violIndex} className="violation-item">
                      <h3 className="violation-type">{violation.type}</h3>
                      <p className="violation-description">{violation.description}</p>
                      <div className="violation-details">
                        <div className="detail-section">
                          <h4 className="detail-title">Common Appeal Reasons:</h4>
                          <ul className="detail-list">
                            {violation.commonReasons.map((reason, reasonIndex) => (
                              <li key={reasonIndex}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="detail-section">
                          <h4 className="detail-title">Fine Range:</h4>
                          <p className="fine-amount">{violation.fineRange}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="info-box">
            <h2 className="info-box-title">Need Help Determining Your Violation Type?</h2>
            <p className="info-box-text">
              If you're unsure about which category your violation falls into, you can find the violation type on your ticket or contact our support team for assistance.
            </p>
            <div className="info-box-contact">
              <p><strong>Email:</strong> appeals@trafficdept.gov</p>
              <p><strong>Phone:</strong> (555) 123-4567</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ViolationTypes;













