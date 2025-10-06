import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { getFieldOptions, createFieldOption, updateFieldOption, deleteFieldOption, getCustomMetrics, createCustomMetric } from '../services/api';

function Management() {
  const [fieldOptions, setFieldOptions] = useState([]);
  const [customMetrics, setCustomMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [showNewOptionForm, setShowNewOptionForm] = useState(false);
  const [showNewMetricForm, setShowNewMetricForm] = useState(false);
  const [newOption, setNewOption] = useState({ field_name: '', option_value: '', display_order: 0 });
  const [newMetric, setNewMetric] = useState({ metric_name: '', metric_description: '', metric_type: 'quantitative', unit_of_measure: '' });

  const fieldCategories = [
    { name: 'benefit', label: 'Benefit Categories', description: 'Benefits that AI initiatives can provide' },
    { name: 'strategic_objective', label: 'Strategic Objectives', description: 'Strategic goals aligned with initiatives' },
    { name: 'status', label: 'Status Options', description: 'Lifecycle stages of initiatives' },
    { name: 'department', label: 'Departments', description: 'Organizational departments' },
    { name: 'priority', label: 'Priority Levels', description: 'Initiative priority classifications' },
    { name: 'risk_level', label: 'Risk Levels', description: 'Risk assessment classifications' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [optionsRes, metricsRes] = await Promise.all([
        getFieldOptions(),
        getCustomMetrics()
      ]);
      setFieldOptions(optionsRes.data);
      setCustomMetrics(metricsRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load management data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOption = async (e) => {
    e.preventDefault();
    try {
      await createFieldOption(newOption);
      setSuccess('Field option created successfully');
      setShowNewOptionForm(false);
      setNewOption({ field_name: '', option_value: '', display_order: 0 });
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create field option');
      console.error(err);
    }
  };

  const handleUpdateOption = async (option) => {
    try {
      await updateFieldOption(option.id, {
        ...option,
        old_value: fieldOptions.find(o => o.id === option.id)?.option_value
      });
      setSuccess('Field option updated successfully');
      setEditingOption(null);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update field option');
      console.error(err);
    }
  };

  const handleDeleteOption = async (id) => {
    if (!window.confirm('Are you sure you want to delete this option? Existing records will retain this value.')) {
      return;
    }

    try {
      await deleteFieldOption(id);
      setSuccess('Field option deleted successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete field option');
      console.error(err);
    }
  };

  const handleCreateMetric = async (e) => {
    e.preventDefault();
    try {
      await createCustomMetric(newMetric);
      setSuccess('Custom metric created successfully');
      setShowNewMetricForm(false);
      setNewMetric({ metric_name: '', metric_description: '', metric_type: 'quantitative', unit_of_measure: '' });
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create custom metric');
      console.error(err);
    }
  };

  const getOptionsForField = (fieldName) => {
    return fieldOptions.filter(opt => opt.field_name === fieldName);
  };

  if (loading) {
    return <div className="loading">Loading management settings...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Management</h1>
        <p>Configure field options and custom metrics for the application</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Field Options Management */}
      <div className="card">
        <div className="card-header">
          <h2>Field Options Configuration</h2>
          <button onClick={() => setShowNewOptionForm(!showNewOptionForm)} className="btn btn-primary">
            {showNewOptionForm ? <X size={18} /> : <Plus size={18} />}
            {showNewOptionForm ? 'Cancel' : 'New Option'}
          </button>
        </div>

        {showNewOptionForm && (
          <form onSubmit={handleCreateOption} style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Add New Field Option</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Field Name</label>
                <select
                  value={newOption.field_name}
                  onChange={(e) => setNewOption({ ...newOption, field_name: e.target.value })}
                  required
                >
                  <option value="">Select field</option>
                  {fieldCategories.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Option Value</label>
                <input
                  type="text"
                  value={newOption.option_value}
                  onChange={(e) => setNewOption({ ...newOption, option_value: e.target.value })}
                  required
                  placeholder="Enter option value"
                />
              </div>
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  value={newOption.display_order}
                  onChange={(e) => setNewOption({ ...newOption, display_order: parseInt(e.target.value) })}
                  min="0"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-success" style={{ marginTop: '12px' }}>
              <Save size={18} />
              Create Option
            </button>
          </form>
        )}

        <div style={{ display: 'grid', gap: '24px', marginTop: '20px' }}>
          {fieldCategories.map(category => {
            const options = getOptionsForField(category.name);
            return (
              <div key={category.name} style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{category.label}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>{category.description}</p>

                {options.length === 0 ? (
                  <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>No options configured</p>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Value</th>
                          <th>Display Order</th>
                          <th>Last Modified</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {options.map(option => (
                          <tr key={option.id}>
                            <td>
                              {editingOption?.id === option.id ? (
                                <input
                                  type="text"
                                  value={editingOption.option_value}
                                  onChange={(e) => setEditingOption({ ...editingOption, option_value: e.target.value })}
                                  style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                />
                              ) : (
                                option.option_value
                              )}
                            </td>
                            <td>
                              {editingOption?.id === option.id ? (
                                <input
                                  type="number"
                                  value={editingOption.display_order}
                                  onChange={(e) => setEditingOption({ ...editingOption, display_order: parseInt(e.target.value) })}
                                  style={{ width: '80px', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                />
                              ) : (
                                option.display_order
                              )}
                            </td>
                            <td style={{ fontSize: '13px', color: '#64748b' }}>
                              {new Date(option.modified_at).toLocaleDateString()}
                            </td>
                            <td>
                              {editingOption?.id === option.id ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => handleUpdateOption(editingOption)}
                                    className="btn btn-success"
                                    style={{ padding: '6px 12px' }}
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={() => setEditingOption(null)}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 12px' }}
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => setEditingOption(option)}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 12px' }}
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOption(option.id)}
                                    className="btn btn-danger"
                                    style={{ padding: '6px 12px' }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Metrics Management */}
      <div className="card">
        <div className="card-header">
          <h2>Custom Metrics</h2>
          <button onClick={() => setShowNewMetricForm(!showNewMetricForm)} className="btn btn-primary">
            {showNewMetricForm ? <X size={18} /> : <Plus size={18} />}
            {showNewMetricForm ? 'Cancel' : 'New Metric'}
          </button>
        </div>

        {showNewMetricForm && (
          <form onSubmit={handleCreateMetric} style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Add Custom Metric</h3>
            <div className="form-group">
              <label>Metric Name</label>
              <input
                type="text"
                value={newMetric.metric_name}
                onChange={(e) => setNewMetric({ ...newMetric, metric_name: e.target.value })}
                required
                placeholder="e.g., Automation Rate"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newMetric.metric_description}
                onChange={(e) => setNewMetric({ ...newMetric, metric_description: e.target.value })}
                placeholder="Describe what this metric measures"
                rows="3"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Metric Type</label>
                <select
                  value={newMetric.metric_type}
                  onChange={(e) => setNewMetric({ ...newMetric, metric_type: e.target.value })}
                  required
                >
                  <option value="quantitative">Quantitative</option>
                  <option value="qualitative">Qualitative</option>
                </select>
              </div>
              <div className="form-group">
                <label>Unit of Measure</label>
                <input
                  type="text"
                  value={newMetric.unit_of_measure}
                  onChange={(e) => setNewMetric({ ...newMetric, unit_of_measure: e.target.value })}
                  placeholder="e.g., percentage, hours, score"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-success">
              <Save size={18} />
              Create Metric
            </button>
          </form>
        )}

        <div className="table-container">
          {customMetrics.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No custom metrics defined</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Metric Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Unit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customMetrics.map(metric => (
                  <tr key={metric.id}>
                    <td><strong>{metric.metric_name}</strong></td>
                    <td style={{ fontSize: '13px' }}>{metric.metric_description}</td>
                    <td>
                      <span className={`badge ${metric.metric_type === 'quantitative' ? 'badge-info' : 'badge-warning'}`}>
                        {metric.metric_type}
                      </span>
                    </td>
                    <td>{metric.unit_of_measure || '-'}</td>
                    <td>
                      <span className="badge badge-success">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Management;
