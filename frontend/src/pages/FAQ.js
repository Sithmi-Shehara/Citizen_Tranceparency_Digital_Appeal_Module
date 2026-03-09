import React, { useState } from 'react';
import Footer from '../components/Footer';
import './FAQ.css';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'What is a traffic violation appeal?',
      answer: 'A traffic violation appeal is a formal request to contest a traffic ticket or violation notice. If you believe you received a violation in error or have valid reasons to dispute it, you can submit an appeal through our system.'
    },
    {
      question: 'How long do I have to submit an appeal?',
      answer: 'You have 30 days from the date the violation was issued to submit an appeal. Appeals submitted after this deadline may not be considered unless there are exceptional circumstances.'
    },
    {
      question: 'What information do I need to submit an appeal?',
      answer: 'To submit an appeal, you will need: the violation ID, your reason for appealing, a detailed description of the circumstances, and any supporting evidence such as photos, videos, or documents that support your case.'
    },
    {
      question: 'How long does the appeal review process take?',
      answer: 'Most appeals are reviewed within 3-5 business days. Complex cases may take up to 10 business days. You will receive email and SMS notifications at each stage of the process.'
    },
    {
      question: 'What happens if my appeal is approved?',
      answer: 'If your appeal is approved, the violation will be removed from your record and you will not be required to pay the fine. You will receive a confirmation notification via email and SMS.'
    },
    {
      question: 'What happens if my appeal is rejected?',
      answer: 'If your appeal is rejected, you will receive a detailed explanation of the decision. You may have the option to provide additional information or submit a second appeal within 15 days of the rejection notice.'
    },
    {
      question: 'Can I track the status of my appeal?',
      answer: 'Yes, you can track your appeal status in real-time through your dashboard. You will see updates at each stage: Submitted, Under Review, Decision Made, and Appeal Resolved.'
    },
    {
      question: 'What types of violations can I appeal?',
      answer: 'You can appeal various types of violations including speeding tickets, red light violations, parking violations, and other traffic infractions. See our Violation Types page for a complete list.'
    },
    {
      question: 'Do I need to pay the fine while my appeal is being reviewed?',
      answer: 'No, you do not need to pay the fine while your appeal is under review. However, if your appeal is rejected, you will be required to pay the fine within the original due date or an extended deadline provided.'
    },
    {
      question: 'Can I submit multiple appeals?',
      answer: 'Yes, you can submit appeals for multiple violations. Each appeal is reviewed independently. You can manage all your appeals through your dashboard.'
    },
    {
      question: 'What evidence should I provide with my appeal?',
      answer: 'Strong evidence includes: photos or videos of the incident, witness statements, medical records (if applicable), vehicle registration documents, or any other documentation that supports your case. Clear, timestamped evidence is most effective.'
    },
    {
      question: 'How do I contact support if I have questions?',
      answer: 'You can contact our support team via email at appeals@trafficdept.gov, call us at (555) 123-4567, or visit our office at 123 Government Street during business hours (Monday-Friday, 8:00 AM - 5:00 PM).'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <div className="page-content">
        <div className="content-container">
          <div className="page-header">
            <h1 className="page-title">Frequently Asked Questions</h1>
            <p className="page-subtitle">
              Find answers to common questions about the appeal process, requirements, and timelines.
            </p>
          </div>

          <div className="faq-section">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${openIndex === index ? 'open' : ''}`}>
                <button className="faq-question" onClick={() => toggleFAQ(index)}>
                  <span className="faq-question-text">{faq.question}</span>
                  <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
                </button>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="contact-section">
            <h2 className="contact-title">Still Have Questions?</h2>
            <p className="contact-text">
              If you couldn't find the answer you're looking for, please don't hesitate to contact our support team.
            </p>
            <div className="contact-info">
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

export default FAQ;













