import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, TrendingUp, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getInitiativeById, getInitiativeMetrics, saveInitiativeMetric } from '../services/api';
import RiskModal from '../components/RiskModal';

function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initiative, setInitiative] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
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
      {metrics.length > 1 && (
        <div className="card">
          <div className="card-header">
            <h2>Historical Trends</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[...metrics].reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric_period" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="time_saved_hours" stroke="#3b82f6" name="Time Saved (hrs)" />
              <Line yAxisId="right" type="monotone" dataKey="cost_saved_rands" stroke="#10b981" name="Cost Saved (R)" />
              <Line yAxisId="left" type="monotone" dataKey="customer_experience_score" stroke="#f59e0b" name="CX Score" />
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
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>CX Score</th>
                    <th>Time Saved</th>
                    <th>Cost Saved</th>
                    <th>Revenue</th>
                    <th>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map(metric => (
                    <tr key={metric.id}>
                      <td>{metric.metric_period}</td>
                      <td>{metric.customer_experience_score || '-'}</td>
                      <td>{metric.time_saved_hours || 0} hrs</td>
                      <td>R{(metric.cost_saved_rands || 0).toLocaleString()}</td>
                      <td>R{(metric.revenue_increase_rands || 0).toLocaleString()}</td>
                      <td>{metric.model_accuracy || '-'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectView;
