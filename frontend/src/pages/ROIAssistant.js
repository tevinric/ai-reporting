import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import api from '../services/api';
import './ROIAssistant.css';

function ROIAssistant() {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start conversation
    setMessages([
      {
        role: 'assistant',
        content: 'Welcome to the ROI Assistant. I will help you determine the right metrics to measure the return on investment for your initiative.',
        timestamp: new Date()
      },
      {
        role: 'assistant',
        content: 'What type of initiative are you planning to implement?',
        options: ['AI Initiative', 'RPA Initiative'],
        field: 'initiative_type',
        timestamp: new Date()
      }
    ]);
  }, []);

  const questions = {
    initiative_type: {
      question: 'What type of initiative are you planning to implement?',
      options: ['AI Initiative', 'RPA Initiative'],
      next: 'value_type'
    },
    value_type: {
      question: 'What type of value will this initiative primarily add?',
      options: [
        'Time Saving',
        'Cost Reduction',
        'Revenue Generation',
        'Productivity Enhancement',
        'Customer Experience Improvement',
        'Risk Mitigation',
        'Compliance & Governance',
        'Multiple Value Types'
      ],
      next: 'scale'
    },
    scale: {
      question: 'What is the expected scale of implementation?',
      options: [
        'Pilot (Single department/process)',
        'Medium (Multiple departments)',
        'Enterprise-wide (Organization-wide)'
      ],
      next: 'units_processed'
    },
    units_processed: {
      question: 'Approximately how many units/transactions will be processed per month?',
      options: [
        'Less than 100',
        '100 - 1,000',
        '1,000 - 10,000',
        '10,000 - 100,000',
        'More than 100,000'
      ],
      next: 'current_process'
    },
    current_process: {
      question: 'How is this process currently being handled?',
      options: [
        'Fully Manual',
        'Partially Automated',
        'Legacy System',
        'No Current Process (New Capability)'
      ],
      next: 'success_metrics'
    },
    success_metrics: {
      question: 'How will you measure success for this initiative?',
      options: [
        'Quantitative Metrics Only',
        'Qualitative Metrics Only',
        'Both Quantitative and Qualitative'
      ],
      next: 'timeline'
    },
    timeline: {
      question: 'What is your expected timeline to see ROI results?',
      options: [
        'Immediate (Within 1 month)',
        'Short-term (1-3 months)',
        'Medium-term (3-6 months)',
        'Long-term (6-12 months)',
        'Extended (More than 12 months)'
      ],
      next: 'industry_specifics'
    },
    industry_specifics: {
      question: 'Are there specific insurance industry challenges this initiative addresses?',
      options: [
        'Claims Processing',
        'Underwriting & Risk Assessment',
        'Customer Onboarding',
        'Fraud Detection',
        'Policy Administration',
        'Customer Service & Support',
        'Regulatory Compliance',
        'Data Quality & Management',
        'Other/Multiple Areas'
      ],
      next: 'final'
    }
  };

  const handleOptionSelect = (field, value) => {
    const newResponses = { ...userResponses, [field]: value };
    setUserResponses(newResponses);

    // Add user message
    const userMessage = {
      role: 'user',
      content: value,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Determine next question
    const currentQuestion = questions[field];

    if (currentQuestion.next === 'final') {
      // All questions answered, send to LLM
      sendToLLM(newResponses);
    } else {
      // Ask next question
      const nextQuestion = questions[currentQuestion.next];
      const assistantMessage = {
        role: 'assistant',
        content: nextQuestion.question,
        options: nextQuestion.options,
        field: currentQuestion.next,
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage]);
      }, 500);
    }
  };

  const sendToLLM = async (responses) => {
    setIsLoading(true);

    // Add loading message
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Thank you for providing all the information. Let me analyze your responses and prepare recommendations...',
      timestamp: new Date()
    }]);

    try {
      const response = await api.roiAssistant(responses);

      // Add LLM response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.recommendation,
        isRecommendation: true,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error getting ROI recommendations:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error while generating recommendations. Please try again.',
        isError: true,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Welcome to the ROI Assistant. I will help you determine the right metrics to measure the return on investment for your initiative.',
        timestamp: new Date()
      },
      {
        role: 'assistant',
        content: 'What type of initiative are you planning to implement?',
        options: ['AI Initiative', 'RPA Initiative'],
        field: 'initiative_type',
        timestamp: new Date()
      }
    ]);
    setUserResponses({});
    setCurrentStep(0);
    setIsLoading(false);
  };

  return (
    <div className="roi-assistant-container">
      <div className="page-header">
        <h1>ROI Assistant</h1>
        <p>Get guidance on ROI metrics for your AI and RPA initiatives</p>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role}`}
            >
              <div className="message-content">
                {message.content}

                {message.options && !isLoading && (
                  <div className="message-options">
                    {message.options.map((option, optIndex) => (
                      <button
                        key={optIndex}
                        className="option-button"
                        onClick={() => handleOptionSelect(message.field, option)}
                        disabled={userResponses[message.field] !== undefined}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-footer">
          <button
            className="reset-button"
            onClick={handleReset}
            disabled={isLoading}
          >
            Start New Conversation
          </button>
        </div>
      </div>
    </div>
  );
}

export default ROIAssistant;
