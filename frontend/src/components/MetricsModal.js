import React, { useState, useEffect } from 'react';
import { X, Save, BarChart3, Edit2, Trash2 } from 'lucide-react';
import { getInitiativeMetrics, saveInitiativeMetric, getCustomMetrics } from '../services/api';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

function MetricsModal({ initiative, onClose }) {
  const [metrics, setMetrics] = useState([]);
  const [customMetrics, setCustomMetrics] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMetric, setEditingMetric] = useState(null); // {period, metricName, value, comments}

  const [formData, setFormData] = useState({
    metric_period: '',
    additional_metrics: {}
  });

  useEffect(() => {
    loadMetrics();
    loadCustomMetrics();
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

  const loadCustomMetrics = async () => {
    try {
      const response = await getCustomMetrics();
      setCustomMetrics(response.data);
    } catch (err) {
      console.error('Failed to load custom metrics', err);
    }
  };

  const handleMetricSelection = (metric) => {
    const isSelected = selectedMetrics.some(m => m.id === metric.id);
    if (isSelected) {
      setSelectedMetrics(selectedMetrics.filter(m => m.id !== metric.id));
      const newAdditionalMetrics = { ...formData.additional_metrics };
      delete newAdditionalMetrics[metric.metric_name];
      setFormData({ ...formData, additional_metrics: newAdditionalMetrics });
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
      setFormData({
        ...formData,
        additional_metrics: {
          ...formData.additional_metrics,
          [metric.metric_name]: { value: '', comments: '' }
        }
      });
    }
  };

  const updateMetricValue = (metricName, field, value) => {
    setFormData({
      ...formData,
      additional_metrics: {
        ...formData.additional_metrics,
        [metricName]: {
          ...formData.additional_metrics[metricName],
          [field]: value
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveInitiativeMetric(initiative.id, formData);
      setFormData({
        metric_period: '',
        additional_metrics: {}
      });
      setSelectedMetrics([]);
      setShowForm(false);
      loadMetrics();
    } catch (err) {
      alert('Failed to save metrics');
      console.error(err);
    }
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
        `${API_ENDPOINTS.INITIATIVE_METRICS(initiative.id)}/${editingMetric.period}/metric/${encodeURIComponent(editingMetric.metricName)}`,
        {
          value: editingMetric.value,
          comments: editingMetric.comments
        }
      );
      setEditingMetric(null);
      loadMetrics();
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
        `${API_ENDPOINTS.INITIATIVE_METRICS(initiative.id)}/${period}/metric/${encodeURIComponent(metricName)}`
      );
      loadMetrics();
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
      await axios.delete(`${API_ENDPOINTS.INITIATIVE_METRICS(initiative.id)}/${period}`);
      loadMetrics();
    } catch (err) {
      alert('Failed to delete period');
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

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label>Reporting Period (YYYY-MM) *</label>
                <input
                  type="month"
                  value={formData.metric_period}
                  onChange={(e) => setFormData({ ...formData, metric_period: e.target.value })}
                  required
                  style={{ marginLeft: '8px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px', textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Select Metrics to Track</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '4px',
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db'
                }}>
                  {customMetrics.map(metric => (
                    <label
                      key={metric.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMetrics.some(m => m.id === metric.id)}
                        onChange={() => handleMetricSelection(metric)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13px', textAlign: 'left' }}>
                        {metric.metric_name}
                        {metric.unit_of_measure && (
                          <span style={{ color: '#64748b', fontSize: '11px' }}> ({metric.unit_of_measure})</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedMetrics.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#374151', textAlign: 'left' }}>
                    Enter Metric Values
                  </h4>
                  {selectedMetrics.map(metric => (
                    <div key={metric.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', alignItems: 'center' }}>
                        <div className="form-group" style={{ textAlign: 'left' }}>
                          <label>
                            {metric.metric_name}
                            {metric.unit_of_measure && (
                              <span style={{ color: '#64748b', fontSize: '11px' }}> ({metric.unit_of_measure})</span>
                            )}
                          </label>
                          <input
                            type="number"
                            value={formData.additional_metrics[metric.metric_name]?.value || ''}
                            onChange={(e) => updateMetricValue(metric.metric_name, 'value', e.target.value)}
                            step="0.01"
                            placeholder={`Enter ${metric.metric_name.toLowerCase()}`}
                            style={{ marginTop: '2px', width: '100%' }}
                          />
                          {metric.metric_description && (
                            <small style={{ fontSize: '10px', color: '#64748b' }}>{metric.metric_description}</small>
                          )}
                        </div>
                        <div className="form-group" style={{ textAlign: 'left' }}>
                          <label>Comments</label>
                          <textarea
                            value={formData.additional_metrics[metric.metric_name]?.comments || ''}
                            onChange={(e) => updateMetricValue(metric.metric_name, 'comments', e.target.value)}
                            rows="2"
                            placeholder="Add context or notes"
                            style={{ marginTop: '2px', width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-success"
                style={{ marginTop: '8px' }}
                disabled={selectedMetrics.length === 0}
              >
                <Save size={18} />
                Save Metrics
              </button>
            </form>
          )}

          {(() => {
            let content;
            if (loading) {
              content = (
                <div className="loading">Loading metrics...</div>
              );
            } else if (metrics.length === 0) {
              content = (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>No metrics recorded yet</p>
                </div>
              );
            } else {
              content = (
                <div>
                  {metrics.map(metric => (
                    <div key={metric.id} style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '2px solid #3b82f6' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                          {metric.metric_period}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Updated: {new Date(metric.modified_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleDeletePeriod(metric.metric_period)}
                            className="btn btn-danger"
                            style={{ padding: '3px 7px', fontSize: '11px' }}
                            title="Delete entire period"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {metric.additional_metrics && Object.keys(metric.additional_metrics).length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                          {Object.entries(metric.additional_metrics).map(([metricName, metricData]) => (
                            <div key={metricName} style={{ padding: '8px', backgroundColor: '#f9fafb', borderRadius: '6px', position: 'relative', textAlign: 'left' }}>
                              {editingMetric && editingMetric.period === metric.metric_period && editingMetric.metricName === metricName ? (
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                    Edit: {metricName}
                                  </div>
                                  <input
                                    type="number"
                                    value={editingMetric.value}
                                    onChange={(e) => setEditingMetric({ ...editingMetric, value: e.target.value })}
                                    style={{ width: '100%', padding: '5px', marginBottom: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    placeholder="Value"
                                  />
                                  <textarea
                                    value={editingMetric.comments}
                                    onChange={(e) => setEditingMetric({ ...editingMetric, comments: e.target.value })}
                                    style={{ width: '100%', padding: '5px', marginBottom: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    placeholder="Comments"
                                    rows="2"
                                  />
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={handleSaveEdit} className="btn btn-success" style={{ padding: '3px 10px', fontSize: '11px', flex: 1 }}>
                                      <Save size={13} /> Save
                                    </button>
                                    <button onClick={() => setEditingMetric(null)} className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '11px', flex: 1 }}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '2px' }}>
                                    {metricName}
                                  </div>
                                  <div style={{ fontSize: '17px', fontWeight: '700', color: '#1f2937', marginBottom: '2px' }}>
                                    {metricData.value || '-'}
                                  </div>
                                  {metricData.comments && (
                                    <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginBottom: '6px' }}>
                                      {metricData.comments}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
                                    <button
                                      onClick={() => handleEditMetric(metric.metric_period, metricName, metricData)}
                                      className="btn btn-secondary"
                                      style={{ padding: '3px 7px', fontSize: '10px', flex: 1 }}
                                      title="Edit metric"
                                    >
                                      <Edit2 size={11} /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMetric(metric.metric_period, metricName)}
                                      className="btn btn-danger"
                                      style={{ padding: '3px 7px', fontSize: '10px', flex: 1 }}
                                      title="Delete metric"
                                    >
                                      <Trash2 size={11} /> Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '13px' }}>
                          No metrics recorded for this period
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            }
            return content;
          })()}
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
