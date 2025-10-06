import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, TrendingUp, TrendingDown, Calendar, AlertTriangle, Edit2, Trash2, Save } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getInitiativeById, getInitiativeMetrics, saveInitiativeMetric } from '../services/api';
import RiskModal from '../components/RiskModal';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initiative, setInitiative] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [editingMetric, setEditingMetric] = useState(null);
  const [metricFormData, setMetricFormData] = useState({
    metric_period: '',
    customer_experience_score: '',
    customer_experience_comments: '',
    time_saved_hours: '',
    time_saved_comments: '',
    cost_saved_rands: '',
    cost_saved_comments: '',
    revenue_increase_rands: '',
    revenue_increase_comments: '',
    processed_units: '',
    processed_units_comments: '',
    model_accuracy: '',
    model_accuracy_comments: '',
    user_adoption_rate: '',
    user_adoption_comments: '',
    error_rate: '',
    error_rate_comments: '',
    response_time_ms: '',
    response_time_comments: '',
    data_quality_score: '',
    data_quality_comments: '',
    user_satisfaction_score: '',
    user_satisfaction_comments: '',
    business_impact_score: '',
    business_impact_comments: '',
    innovation_score: '',
    innovation_comments: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [initiativeRes, metricsRes] = await Promise.all([
        getInitiativeById(id),
        getInitiativeMetrics(id)
      ]);
      setInitiative(initiativeRes.data);
      setMetrics(metricsRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load project data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare trend data from metrics - flatten additional_metrics into trend chart data
  const prepareTrendData = () => {
    if (metrics.length === 0) return [];

    return [...metrics].reverse().map(metric => {
      const trendPoint = {
        metric_period: metric.metric_period
      };

      // Add all additional metrics to the trend point
      if (metric.additional_metrics && typeof metric.additional_metrics === 'object') {
        Object.entries(metric.additional_metrics).forEach(([metricName, metricData]) => {
          if (metricData && metricData.value !== null && metricData.value !== undefined && metricData.value !== '') {
            trendPoint[metricName] = parseFloat(metricData.value);
          }
        });
      }

      return trendPoint;
    });
  };

  // Get all unique metric names across all periods
  const getAllMetricNames = () => {
    const metricNames = new Set();

    metrics.forEach(metric => {
      if (metric.additional_metrics && typeof metric.additional_metrics === 'object') {
        Object.keys(metric.additional_metrics).forEach(name => metricNames.add(name));
      }
    });

    return Array.from(metricNames);
  };

  // Generate colors for trend lines
  const getColorForIndex = (index) => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];
    return colors[index % colors.length];
  };

  const handleEditMetric = (period, metricName, metricData) => {
    setEditingMetric({
      period,
      metricName,
      value: metricData.value || '',
      comments: metricData.comments || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(
        `${API_ENDPOINTS.INITIATIVE_METRICS(id)}/${editingMetric.period}/metric/${encodeURIComponent(editingMetric.metricName)}`,
        {
          value: editingMetric.value,
          comments: editingMetric.comments
        }
      );
      setEditingMetric(null);
      loadData();
    } catch (err) {
      alert('Failed to update metric');
      console.error(err);
    }
  };

  const handleDeleteMetric = async (period, metricName) => {
    if (!window.confirm(`Are you sure you want to delete "${metricName}" for ${period}?`)) {
      return;
    }

    try {
      await axios.delete(
        `${API_ENDPOINTS.INITIATIVE_METRICS(id)}/${period}/metric/${encodeURIComponent(metricName)}`
      );
      loadData();
    } catch (err) {
      alert('Failed to delete metric');
      console.error(err);
    }
  };

  const handleDeletePeriod = async (period) => {
    if (!window.confirm(`Are you sure you want to delete ALL metrics for ${period}?`)) {
      return;
    }

    try {
      await axios.delete(`${API_ENDPOINTS.INITIATIVE_METRICS(id)}/${period}`);
      loadData();
    } catch (err) {
      alert('Failed to delete period');
      console.error(err);
    }
  };

  const handleMetricFormChange = (e) => {
    const { name, value } = e.target;
    setMetricFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveMetric = async (e) => {
    e.preventDefault();
    try {
      await saveInitiativeMetric(id, metricFormData);
      setShowMetricForm(false);
      setMetricFormData({
        metric_period: '',
        customer_experience_score: '',
        customer_experience_comments: '',
        time_saved_hours: '',
        time_saved_comments: '',
        cost_saved_rands: '',
        cost_saved_comments: '',
        revenue_increase_rands: '',
        revenue_increase_comments: '',
        processed_units: '',
        processed_units_comments: '',
        model_accuracy: '',
        model_accuracy_comments: '',
        user_adoption_rate: '',
        user_adoption_comments: '',
        error_rate: '',
        error_rate_comments: '',
        response_time_ms: '',
        response_time_comments: '',
        data_quality_score: '',
        data_quality_comments: '',
        user_satisfaction_score: '',
        user_satisfaction_comments: '',
        business_impact_score: '',
        business_impact_comments: '',
        innovation_score: '',
        innovation_comments: ''
      });
      loadData();
    } catch (err) {
      alert('Failed to save metrics');
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      'Ideation': 'badge-info',
      'In Progress': 'badge-warning',
      'Live (Complete)': 'badge-success'
    };
    return <span className={`badge ${classes[status] || 'badge-info'}`}>{status}</span>;
  };

  const calculateTrend = (currentValue, previousValue) => {
    if (!previousValue || previousValue === 0) return null;
    const change = ((currentValue - previousValue) / previousValue) * 100;
    return change;
  };

  const getTrendIndicator = (current, previous) => {
    const trend = calculateTrend(current, previous);
    if (trend === null) return null;

    if (trend > 0) {
      return (
        <span className="stat-change positive">
          <TrendingUp size={16} />
          {trend.toFixed(1)}% from last month
        </span>
      );
    } else if (trend < 0) {
      return (
        <span className="stat-change negative">
          <TrendingDown size={16} />
          {Math.abs(trend).toFixed(1)}% from last month
        </span>
      );
    }
    return <span className="stat-change">No change from last month</span>;
  };

  if (loading) {
    return <div className="loading">Loading project data...</div>;
  }

  if (error || !initiative) {
    return <div className="error-message">{error || 'Initiative not found'}</div>;
  }

  const currentMetric = metrics[0];
  const previousMetric = metrics[1];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button onClick={() => navigate('/initiatives')} className="btn btn-secondary" style={{ marginBottom: '12px' }}>
            <ArrowLeft size={18} />
            Back to Initiatives
          </button>
          <h1>{initiative.use_case_name}</h1>
          <p>{initiative.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowRiskModal(true)} className="btn btn-secondary">
            <AlertTriangle size={18} />
            Manage Risks
          </button>
          <button onClick={() => navigate(`/initiatives/${id}/edit`)} className="btn btn-primary">
            <Edit size={18} />
            Edit Initiative
          </button>
        </div>
      </div>

      {/* Risk Modal */}
      {showRiskModal && (
        <RiskModal
          initiativeId={id}
          onClose={() => setShowRiskModal(false)}
        />
      )}

      {/* Initiative Overview */}
      <div className="card">
        <div className="card-header">
          <h2>Initiative Overview</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <span className="stat-label">Status</span>
            <div style={{ marginTop: '8px' }}>
              {getStatusBadge(initiative.status)}
            </div>
          </div>
          <div>
            <span className="stat-label">Progress</span>
            <div style={{ marginTop: '8px' }}>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${initiative.percentage_complete || 0}%` }}></div>
              </div>
              <span style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                {initiative.percentage_complete || 0}% Complete
              </span>
            </div>
          </div>
          <div>
            <span className="stat-label">Departments</span>
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#1e293b' }}>
              {initiative.departments?.join(', ') || 'N/A'}
            </div>
          </div>
          <div>
            <span className="stat-label">Benefit</span>
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#1e293b' }}>
              {initiative.benefit || 'N/A'}
            </div>
          </div>
          <div>
            <span className="stat-label">Strategic Objective</span>
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#1e293b' }}>
              {initiative.strategic_objective || 'N/A'}
            </div>
          </div>
          <div>
            <span className="stat-label">Priority</span>
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#1e293b' }}>
              {initiative.priority || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {currentMetric && (
        <>
          <div className="card-header" style={{ marginTop: '24px', marginBottom: '16px' }}>
            <h2>Current Month Metrics</h2>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Time Saved (Hours/Month)</span>
              <div className="stat-value">{currentMetric.time_saved_hours || 0}</div>
              {previousMetric && getTrendIndicator(currentMetric.time_saved_hours, previousMetric.time_saved_hours)}
            </div>

            <div className="stat-card success">
              <span className="stat-label">Cost Saved (Rands/Month)</span>
              <div className="stat-value">R{(currentMetric.cost_saved_rands || 0).toLocaleString()}</div>
              {previousMetric && getTrendIndicator(currentMetric.cost_saved_rands, previousMetric.cost_saved_rands)}
            </div>

            <div className="stat-card warning">
              <span className="stat-label">Revenue Increase (Rands/Month)</span>
              <div className="stat-value">R{(currentMetric.revenue_increase_rands || 0).toLocaleString()}</div>
              {previousMetric && getTrendIndicator(currentMetric.revenue_increase_rands, previousMetric.revenue_increase_rands)}
            </div>

            <div className="stat-card info">
              <span className="stat-label">Customer Experience Score</span>
              <div className="stat-value">{currentMetric.customer_experience_score || 0}/10</div>
              {previousMetric && getTrendIndicator(currentMetric.customer_experience_score, previousMetric.customer_experience_score)}
            </div>

            <div className="stat-card">
              <span className="stat-label">Model Accuracy</span>
              <div className="stat-value">{currentMetric.model_accuracy || 0}%</div>
              {previousMetric && getTrendIndicator(currentMetric.model_accuracy, previousMetric.model_accuracy)}
            </div>

            <div className="stat-card">
              <span className="stat-label">User Adoption Rate</span>
              <div className="stat-value">{currentMetric.user_adoption_rate || 0}%</div>
              {previousMetric && getTrendIndicator(currentMetric.user_adoption_rate, previousMetric.user_adoption_rate)}
            </div>
          </div>
        </>
      )}

      {/* Metrics Trends */}
      {metrics.length > 1 && getAllMetricNames().length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Performance Trends</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Historical trends for all tracked metrics
            </p>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={prepareTrendData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric_period" />
              <YAxis />
              <Tooltip />
              <Legend />
              {getAllMetricNames().map((metricName, index) => (
                <Line
                  key={metricName}
                  type="monotone"
                  dataKey={metricName}
                  stroke={getColorForIndex(index)}
                  name={metricName}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add Metrics Button */}
      <div className="card">
        <div className="card-header">
          <h2>Monthly Metrics</h2>
          <button onClick={() => setShowMetricForm(!showMetricForm)} className="btn btn-primary">
            <Calendar size={18} />
            {showMetricForm ? 'Cancel' : 'Add Monthly Metrics'}
          </button>
        </div>

        {showMetricForm && (
          <form onSubmit={handleSaveMetric} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label>Reporting Period (YYYY-MM) *</label>
              <input
                type="month"
                name="metric_period"
                value={metricFormData.metric_period}
                onChange={handleMetricFormChange}
                required
              />
            </div>

            <h3 style={{ margin: '24px 0 16px 0', fontSize: '16px', fontWeight: '600' }}>ROI Metrics</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div className="form-group">
                <label>Customer Experience Score (1-10)</label>
                <input
                  type="number"
                  name="customer_experience_score"
                  value={metricFormData.customer_experience_score}
                  onChange={handleMetricFormChange}
                  min="1"
                  max="10"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Comments</label>
                <textarea
                  name="customer_experience_comments"
                  value={metricFormData.customer_experience_comments}
                  onChange={handleMetricFormChange}
                  rows="2"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div className="form-group">
                <label>Time Saved (Hours/Month)</label>
                <input
                  type="number"
                  name="time_saved_hours"
                  value={metricFormData.time_saved_hours}
                  onChange={handleMetricFormChange}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Comments</label>
                <textarea
                  name="time_saved_comments"
                  value={metricFormData.time_saved_comments}
                  onChange={handleMetricFormChange}
                  rows="2"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div className="form-group">
                <label>Cost Saved (Rands/Month)</label>
                <input
                  type="number"
                  name="cost_saved_rands"
                  value={metricFormData.cost_saved_rands}
                  onChange={handleMetricFormChange}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Comments</label>
                <textarea
                  name="cost_saved_comments"
                  value={metricFormData.cost_saved_comments}
                  onChange={handleMetricFormChange}
                  rows="2"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div className="form-group">
                <label>Revenue Increase (Rands/Month)</label>
                <input
                  type="number"
                  name="revenue_increase_rands"
                  value={metricFormData.revenue_increase_rands}
                  onChange={handleMetricFormChange}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Comments</label>
                <textarea
                  name="revenue_increase_comments"
                  value={metricFormData.revenue_increase_comments}
                  onChange={handleMetricFormChange}
                  rows="2"
                />
              </div>
            </div>

            <h3 style={{ margin: '24px 0 16px 0', fontSize: '16px', fontWeight: '600' }}>AI Performance Metrics</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div className="form-group">
                <label>Model Accuracy (%)</label>
                <input
                  type="number"
                  name="model_accuracy"
                  value={metricFormData.model_accuracy}
                  onChange={handleMetricFormChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Comments</label>
                <textarea
                  name="model_accuracy_comments"
                  value={metricFormData.model_accuracy_comments}
                  onChange={handleMetricFormChange}
                  rows="2"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div className="form-group">
                <label>User Adoption Rate (%)</label>
                <input
                  type="number"
                  name="user_adoption_rate"
                  value={metricFormData.user_adoption_rate}
                  onChange={handleMetricFormChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Comments</label>
                <textarea
                  name="user_adoption_comments"
                  value={metricFormData.user_adoption_comments}
                  onChange={handleMetricFormChange}
                  rows="2"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button type="button" onClick={() => setShowMetricForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-success">
                Save Metrics
              </button>
            </div>
          </form>
        )}

        {/* Metrics History */}
        {metrics.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Metrics History</h3>
            <div>
              {metrics.map(metric => (
                <div key={metric.id} style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #3b82f6' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      {metric.metric_period}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Updated: {new Date(metric.modified_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeletePeriod(metric.metric_period)}
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        title="Delete entire period"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {metric.additional_metrics && Object.keys(metric.additional_metrics).length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                      {Object.entries(metric.additional_metrics).map(([metricName, metricData]) => (
                        <div key={metricName} style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                          {editingMetric && editingMetric.period === metric.metric_period && editingMetric.metricName === metricName ? (
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                Edit: {metricName}
                              </div>
                              <input
                                type="number"
                                value={editingMetric.value}
                                onChange={(e) => setEditingMetric({ ...editingMetric, value: e.target.value })}
                                style={{ width: '100%', padding: '6px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px' }}
                                placeholder="Value"
                              />
                              <textarea
                                value={editingMetric.comments}
                                onChange={(e) => setEditingMetric({ ...editingMetric, comments: e.target.value })}
                                style={{ width: '100%', padding: '6px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}
                                placeholder="Comments"
                                rows="2"
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={handleSaveEdit} className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}>
                                  <Save size={14} /> Save
                                </button>
                                <button onClick={() => setEditingMetric(null)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                                {metricName}
                              </div>
                              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                                {metricData.value || '-'}
                              </div>
                              {metricData.comments && (
                                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #e5e7eb' }}>
                                  {metricData.comments}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '4px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                                <button
                                  onClick={() => handleEditMetric(metric.metric_period, metricName, metricData)}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}
                                  title="Edit metric"
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMetric(metric.metric_period, metricName)}
                                  className="btn btn-danger"
                                  style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}
                                  title="Delete metric"
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '14px' }}>
                      No metrics recorded for this period
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectView;
