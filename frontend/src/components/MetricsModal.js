import React, { useState, useEffect } from 'react';
import { X, Save, BarChart3 } from 'lucide-react';
import { getInitiativeMetrics, saveInitiativeMetric } from '../services/api';

function MetricsModal({ initiative, onClose }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    metric_period: '',
    customer_experience_score: '',
    customer_experience_comments: '',
    time_saved_hours: '',
    time_saved_comments: '',
    cost_saved_rands: '',
    cost_saved_comments: '',
    revenue_increase_rands: '',
    revenue_increase_comments: '',
    model_accuracy: '',
    user_adoption_rate: ''
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await getInitiativeMetrics(initiative.id);
      setMetrics(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveInitiativeMetric(initiative.id, formData);
      setFormData({
        metric_period: '',
        customer_experience_score: '',
        customer_experience_comments: '',
        time_saved_hours: '',
        time_saved_comments: '',
        cost_saved_rands: '',
        cost_saved_comments: '',
        revenue_increase_rands: '',
        revenue_increase_comments: '',
        model_accuracy: '',
        user_adoption_rate: ''
      });
      setShowForm(false);
      loadMetrics();
    } catch (err) {
      alert('Failed to save metrics');
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <div>
            <h2>Metrics: {initiative.use_case_name}</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Track monthly performance metrics
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              <BarChart3 size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Add and track ROI metrics on a monthly basis
            </p>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-primary"
            >
              {showForm ? 'Cancel' : 'Add Monthly Metrics'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Add Metrics</h3>

              <div className="form-group">
                <label>Reporting Period (YYYY-MM) *</label>
                <input
                  type="month"
                  value={formData.metric_period}
                  onChange={(e) => setFormData({ ...formData, metric_period: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Customer Experience Score (1-10)</label>
                  <input
                    type="number"
                    value={formData.customer_experience_score}
                    onChange={(e) => setFormData({ ...formData, customer_experience_score: e.target.value })}
                    min="1"
                    max="10"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Comments</label>
                  <textarea
                    value={formData.customer_experience_comments}
                    onChange={(e) => setFormData({ ...formData, customer_experience_comments: e.target.value })}
                    rows="2"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Time Saved (Hours/Month)</label>
                  <input
                    type="number"
                    value={formData.time_saved_hours}
                    onChange={(e) => setFormData({ ...formData, time_saved_hours: e.target.value })}
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Comments</label>
                  <textarea
                    value={formData.time_saved_comments}
                    onChange={(e) => setFormData({ ...formData, time_saved_comments: e.target.value })}
                    rows="2"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Cost Saved (Rands/Month)</label>
                  <input
                    type="number"
                    value={formData.cost_saved_rands}
                    onChange={(e) => setFormData({ ...formData, cost_saved_rands: e.target.value })}
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Comments</label>
                  <textarea
                    value={formData.cost_saved_comments}
                    onChange={(e) => setFormData({ ...formData, cost_saved_comments: e.target.value })}
                    rows="2"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Model Accuracy (%)</label>
                  <input
                    type="number"
                    value={formData.model_accuracy}
                    onChange={(e) => setFormData({ ...formData, model_accuracy: e.target.value })}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>User Adoption Rate (%)</label>
                  <input
                    type="number"
                    value={formData.user_adoption_rate}
                    onChange={(e) => setFormData({ ...formData, user_adoption_rate: e.target.value })}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-success" style={{ marginTop: '12px' }}>
                <Save size={18} />
                Save Metrics
              </button>
            </form>
          )}

          {loading ? (
            <div className="loading">Loading metrics...</div>
          ) : metrics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>No metrics recorded yet</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>CX Score</th>
                    <th>Time Saved (hrs)</th>
                    <th>Cost Saved (R)</th>
                    <th>Revenue (R)</th>
                    <th>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map(metric => (
                    <tr key={metric.id}>
                      <td><strong>{metric.metric_period}</strong></td>
                      <td>{metric.customer_experience_score || '-'}</td>
                      <td>{metric.time_saved_hours || 0}</td>
                      <td>R{(metric.cost_saved_rands || 0).toLocaleString()}</td>
                      <td>R{(metric.revenue_increase_rands || 0).toLocaleString()}</td>
                      <td>{metric.model_accuracy || '-'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MetricsModal;
