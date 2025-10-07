import React, { useState, useEffect, useRef } from 'react';
import { Send, History, X } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, Label } from 'recharts';
import api from '../services/api';
import './ComplexityAnalyzer.css';

function ComplexityAnalyzer() {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [matrixData, setMatrixData] = useState([]);
  const [showMatrix, setShowMatrix] = useState(false);
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
        content: 'Welcome to the Complexity Analyzer. I will help you assess the complexity of your AI initiative and provide guidance on next steps.',
        timestamp: new Date()
      },
      {
        role: 'assistant',
        content: 'What is the name of the AI initiative you want to analyze?',
        field: 'initiative_name',
        inputType: 'text',
        timestamp: new Date()
      }
    ]);
    loadConversationHistory();
    loadMatrixData();
  }, []);

  const loadConversationHistory = async () => {
    try {
      const response = await api.getComplexityConversations();
      setConversationHistory(response.data);
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const loadMatrixData = async () => {
    try {
      const response = await api.getComplexityMatrixData();
      setMatrixData(response.data);
    } catch (error) {
      console.error('Error loading matrix data:', error);
    }
  };

  const questions = [
    {
      field: 'initiative_name',
      question: 'What is the name of the AI initiative you want to analyze?',
      inputType: 'text'
    },
    {
      field: 'business_case_clarity',
      question: 'How clear is the business case and expected value?',
      options: ['Very clear with quantified benefits', 'Moderately clear', 'Somewhat unclear', 'Needs significant work']
    },
    {
      field: 'data_availability',
      question: 'What is the level of data availability for this initiative?',
      options: ['Readily available and accessible', 'Available but needs gathering', 'Partially available', 'Not available yet']
    },
    {
      field: 'data_quality',
      question: 'What is the current data quality status?',
      options: ['High quality and clean', 'Moderate quality', 'Poor quality, needs cleaning', 'Unknown or unassessed']
    },
    {
      field: 'infrastructure_readiness',
      question: 'How ready is your technical infrastructure (compute, storage, tools)?',
      options: ['Fully ready', 'Mostly ready, minor gaps', 'Significant gaps exist', 'Not ready, needs build-out']
    },
    {
      field: 'stakeholder_buyin',
      question: 'What is the level of stakeholder buy-in and executive support?',
      options: ['Strong support from all levels', 'Moderate support', 'Limited support', 'No support secured yet']
    },
    {
      field: 'budget_availability',
      question: 'What is the budget status for this initiative?',
      options: ['Approved and allocated', 'Budget requested pending approval', 'Budget uncertain', 'No budget identified']
    },
    {
      field: 'regulatory_compliance',
      question: 'What is the regulatory and compliance risk level?',
      options: ['Low risk, compliant', 'Moderate risk, manageable', 'High risk, needs review', 'Very high risk or unknown']
    },
    {
      field: 'integration_complexity',
      question: 'How complex is the integration with existing systems?',
      options: ['Simple, minimal integration', 'Moderate complexity', 'Complex, multiple systems', 'Very complex, enterprise-wide']
    },
    {
      field: 'technology_maturity',
      question: 'How mature is the AI technology you plan to use?',
      options: ['Proven and widely adopted', 'Established but evolving', 'Emerging technology', 'Experimental or cutting-edge']
    },
    {
      field: 'change_management',
      question: 'How prepared is the organization for the change this will bring?',
      options: ['Highly prepared with change plan', 'Moderately prepared', 'Limited preparation', 'Not prepared']
    },
    {
      field: 'data_governance',
      question: 'What is the state of data governance and privacy controls?',
      options: ['Strong governance in place', 'Adequate governance', 'Weak governance', 'No governance established']
    },
    {
      field: 'expected_timeline',
      question: 'What is your expected implementation timeline?',
      options: ['Under 3 months', '3-6 months', '6-12 months', 'Over 12 months']
    },
    {
      field: 'team_availability',
      question: 'What is the availability of required team resources?',
      options: ['Team fully allocated', 'Team mostly available', 'Limited availability', 'Team not identified']
    }
  ];

  const handleTextInput = (field, value) => {
    const newResponses = { ...userResponses, [field]: value };
    setUserResponses(newResponses);

    const userMessage = {
      role: 'user',
      content: value,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    if (currentStep < questions.length - 1) {
      const nextQuestion = questions[currentStep + 1];
      const assistantMessage = {
        role: 'assistant',
        content: nextQuestion.question,
        options: nextQuestion.options,
        field: nextQuestion.field,
        inputType: nextQuestion.inputType,
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentStep(currentStep + 1);
      }, 500);
    }
  };

  const handleOptionSelect = (field, value) => {
    const newResponses = { ...userResponses, [field]: value };
    setUserResponses(newResponses);

    const userMessage = {
      role: 'user',
      content: value,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    if (currentStep < questions.length - 1) {
      const nextQuestion = questions[currentStep + 1];
      const assistantMessage = {
        role: 'assistant',
        content: nextQuestion.question,
        options: nextQuestion.options,
        field: nextQuestion.field,
        inputType: nextQuestion.inputType,
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentStep(currentStep + 1);
      }, 500);
    } else {
      // All questions answered, send to LLM
      sendToLLM(newResponses);
    }
  };

  const sendToLLM = async (responses) => {
    setIsLoading(true);

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Thank you for providing all the information. Let me analyze the complexity and prepare recommendations...',
      timestamp: new Date()
    }]);

    try {
      const response = await api.analyzeComplexity(responses);

      // Add complexity assessment
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Analysis Complete:\n\nComplexity Score: ${response.data.complexity_score}/100\nValue Score: ${response.data.value_score}/100\nClassification: ${response.data.quadrant}`,
        isMetrics: true,
        timestamp: new Date()
      }]);

      // Add LLM response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.recommendation,
        isRecommendation: true,
        timestamp: new Date()
      }]);

      // Reload history and matrix data
      loadConversationHistory();
      loadMatrixData();
    } catch (error) {
      console.error('Error analyzing complexity:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error while analyzing complexity. Please try again.',
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
        content: 'Welcome to the Complexity Analyzer. I will help you assess the complexity of your AI initiative and provide guidance on next steps.',
        timestamp: new Date()
      },
      {
        role: 'assistant',
        content: 'What is the name of the AI initiative you want to analyze?',
        field: 'initiative_name',
        inputType: 'text',
        timestamp: new Date()
      }
    ]);
    setUserResponses({});
    setCurrentStep(0);
    setIsLoading(false);
  };

  const loadPreviousConversation = async (conversationId) => {
    try {
      const response = await api.getComplexityConversation(conversationId);
      const conversation = response.data;

      setMessages([
        {
          role: 'assistant',
          content: 'Loading previous conversation...',
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: `Analysis for: ${conversation.initiative_name}\n\nComplexity Score: ${conversation.complexity_score}/100\nValue Score: ${conversation.value_score}/100\nClassification: ${conversation.quadrant}`,
          isMetrics: true,
          timestamp: new Date(conversation.created_at)
        },
        {
          role: 'assistant',
          content: conversation.llm_recommendation,
          isRecommendation: true,
          timestamp: new Date(conversation.created_at)
        }
      ]);

      setShowHistory(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.initiative_name}</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Complexity: {data.complexity_score}</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Value: {data.value_score}</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>{data.quadrant}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="complexity-analyzer-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Complexity Analyzer</h1>
            <p>Assess initiative complexity and get actionable recommendations</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="btn btn-secondary"
            >
              {showMatrix ? 'Hide' : 'Show'} Matrix
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn btn-secondary"
            >
              <History size={18} />
              History
            </button>
          </div>
        </div>
      </div>

      {/* Complexity Matrix */}
      {showMatrix && matrixData.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h2>Complexity vs Value Matrix</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              All analyzed initiatives plotted by complexity and value scores
            </p>
          </div>
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="complexity_score"
                name="Complexity Score"
                domain={[0, 100]}
              >
                <Label value="Complexity Score (0-100)" offset={-10} position="insideBottom" />
              </XAxis>
              <YAxis
                type="number"
                dataKey="value_score"
                name="Value Score"
                domain={[0, 100]}
              >
                <Label value="Value Score (0-100)" angle={-90} position="insideLeft" />
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Quadrant lines */}
              <ReferenceLine x={33} stroke="#999" strokeDasharray="3 3" />
              <ReferenceLine x={66} stroke="#999" strokeDasharray="3 3" />
              <ReferenceLine y={40} stroke="#999" strokeDasharray="3 3" />
              <ReferenceLine y={70} stroke="#999" strokeDasharray="3 3" />

              <Scatter name="Initiatives" data={matrixData} fill="#3b82f6">
                {matrixData.map((entry, index) => {
                  let color = '#3b82f6';
                  if (entry.complexity_score < 33 && entry.value_score >= 70) {
                    color = '#10b981'; // Green - Low hanging fruit
                  } else if (entry.complexity_score >= 33 && entry.complexity_score < 66 && entry.value_score >= 70) {
                    color = '#f59e0b'; // Orange - Needs planning
                  } else if (entry.complexity_score >= 66 && entry.value_score >= 70) {
                    color = '#ef4444'; // Red - Needs AI COE
                  }
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="complexity-content">
        {/* History Sidebar */}
        {showHistory && (
          <div className="history-sidebar">
            <div className="history-header">
              <h3>Conversation History</h3>
              <button onClick={() => setShowHistory(false)} className="close-button">
                <X size={20} />
              </button>
            </div>
            <div className="history-list">
              {conversationHistory.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                  No previous conversations
                </p>
              ) : (
                conversationHistory.map(conv => (
                  <div
                    key={conv.id}
                    className="history-item"
                    onClick={() => loadPreviousConversation(conv.id)}
                  >
                    <div className="history-item-title">{conv.initiative_name}</div>
                    <div className="history-item-meta">
                      <span className={`complexity-badge complexity-${
                        conv.complexity_score < 33 ? 'low' :
                        conv.complexity_score < 66 ? 'medium' : 'high'
                      }`}>
                        C: {conv.complexity_score}
                      </span>
                      <span className={`value-badge value-${
                        conv.value_score < 40 ? 'low' :
                        conv.value_score < 70 ? 'medium' : 'high'
                      }`}>
                        V: {conv.value_score}
                      </span>
                    </div>
                    <div className="history-item-date">
                      {new Date(conv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className={`chat-container ${showHistory ? 'with-sidebar' : ''}`}>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role}`}
              >
                <div className={`message-content ${message.isRecommendation ? 'isRecommendation' : ''} ${message.isMetrics ? 'isMetrics' : ''} ${message.isError ? 'isError' : ''}`}>
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

                  {message.inputType === 'text' && !userResponses[message.field] && !isLoading && (
                    <div className="text-input-container">
                      <input
                        type="text"
                        placeholder="Type your answer..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            handleTextInput(message.field, e.target.value.trim());
                            e.target.value = '';
                          }
                        }}
                        autoFocus
                      />
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
              Start New Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplexityAnalyzer;
