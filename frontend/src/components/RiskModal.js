import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { getInitiativeRisks, createRisk, updateRisk, deleteRisk, getFieldOptions } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../utils/userUtils';

function RiskModal({ initiativeId, onClose }) {
  const { user } = useAuth();
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);
  const [frequencyOptions, setFrequencyOptions] = useState([]);
  const [severityOptions, setSeverityOptions] = useState([]);

  const [formData, setFormData] = useState({
    risk_title: '',
    risk_detail: '',
    frequency: '',
    severity: '',
    risk_mitigation: '',
    controls: ''
  });

  useEffect(() => {
    loadRisks();
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [freq, sev] = await Promise.all([
        getFieldOptions('frequency'),
        getFieldOptions('severity')
      ]);
      setFrequencyOptions(freq.data);
      setSeverityOptions(sev.data);
    } catch (err) {
      console.error('Failed to load options', err);
    }
  };

  const loadRisks = async () => {
    try {
      setLoading(true);
      const response = await getInitiativeRisks(initiativeId);
      setRisks(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load risks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get current user based on environment (DEV = test user, PROD = Entra ID user)
      const currentUser = getCurrentUser(user);

      // Add user information to formData
      const dataWithUser = {
        ...formData,
        created_by_name: currentUser.name,
        created_by_email: currentUser.email,
        modified_by_name: currentUser.name,
        modified_by_email: currentUser.email
      };

      if (editingRisk) {
        await updateRisk(editingRisk.id, dataWithUser);
      } else {
        await createRisk(initiativeId, dataWithUser);
      }
      setFormData({ risk_title: '', risk_detail: '', frequency: '', severity: '', risk_mitigation: '', controls: '' });
      setShowForm(false);
      setEditingRisk(null);
      loadRisks();
    } catch (err) {
      alert('Failed to save risk');
      console.error(err);
    }
  };

  const handleEdit = (risk) => {
    setEditingRisk(risk);
    setFormData({
      risk_title: risk.risk_title,
      risk_detail: risk.risk_detail,
      frequency: risk.frequency,
      severity: risk.severity,
      risk_mitigation: risk.risk_mitigation || '',
      controls: risk.controls || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (riskId) => {
    if (!window.confirm('Are you sure you want to delete this risk?')) return;

    try {
      await deleteRisk(riskId);
      loadRisks();
    } catch (err) {
      alert('Failed to delete risk');
      console.error(err);
    }
  };

  const getRiskBadgeClass = (value) => {
    if (value === 'High') return 'badge-danger';
    if (value === 'Medium') return 'badge-warning';
    return 'badge-success';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px' }}>
        <div className="modal-header">
          <h2>Risk Assessment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Identify and manage risks associated with this initiative
            </p>
            <button
              onClick={() => { setShowForm(!showForm); setEditingRisk(null); setFormData({ risk_title: '', risk_detail: '', frequency: '', severity: '' }); }}
              className="btn btn-primary"
            >
              {showForm ? <X size={18} /> : <Plus size={18} />}
              {showForm ? 'Cancel' : 'Add Risk'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                {editingRisk ? 'Edit Risk' : 'New Risk'}
              </h3>
              <div className="form-group">
                <label>Risk Title *</label>
                <input
                  type="text"
                  value={formData.risk_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, risk_title: e.target.value }))}
                  required
                  placeholder="e.g., Data quality issues"
                />
              </div>
              <div className="form-group">
                <label>Risk Detail</label>
                <textarea
                  value={formData.risk_detail}
                  onChange={(e) => setFormData(prev => ({ ...prev, risk_detail: e.target.value }))}
                  rows="3"
                  placeholder="Describe the risk in detail..."
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Frequency *</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                    required
                  >
                    <option value="">Select frequency</option>
                    {frequencyOptions.map(opt => (
                      <option key={opt.id} value={opt.option_value}>{opt.option_value}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Severity *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                    required
                  >
                    <option value="">Select severity</option>
                    {severityOptions.map(opt => (
                      <option key={opt.id} value={opt.option_value}>{opt.option_value}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Risk Mitigation</label>
                <textarea
                  value={formData.risk_mitigation}
                  onChange={(e) => setFormData(prev => ({ ...prev, risk_mitigation: e.target.value }))}
                  rows="3"
                  placeholder="Describe mitigation strategies to reduce or manage this risk..."
                />
              </div>
              <div className="form-group">
                <label>Controls</label>
                <textarea
                  value={formData.controls}
                  onChange={(e) => setFormData(prev => ({ ...prev, controls: e.target.value }))}
                  rows="3"
                  placeholder="Describe control measures in place to prevent or detect this risk..."
                />
              </div>
              <button type="submit" className="btn btn-success" style={{ marginTop: '12px' }}>
                <Save size={18} />
                {editingRisk ? 'Update Risk' : 'Save Risk'}
              </button>
            </form>
          )}

          {loading ? (
            <div className="loading">Loading risks...</div>
          ) : risks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <AlertTriangle size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>No risks identified yet</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Risk Title</th>
                    <th>Detail</th>
                    <th>Frequency</th>
                    <th>Severity</th>
                    <th>Overall Risk</th>
                    <th>Mitigation</th>
                    <th>Controls</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {risks.map(risk => (
                    <tr key={risk.id}>
                      <td><strong>{risk.risk_title}</strong></td>
                      <td style={{ fontSize: '13px', maxWidth: '200px' }}>
                        {risk.risk_detail || '-'}
                      </td>
                      <td>
                        <span className={`badge ${getRiskBadgeClass(risk.frequency)}`}>
                          {risk.frequency}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getRiskBadgeClass(risk.severity)}`}>
                          {risk.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getRiskBadgeClass(risk.overall_risk)}`}>
                          {risk.overall_risk || 'Low'}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', maxWidth: '200px' }}>
                        {risk.risk_mitigation ? (
                          <span>{risk.risk_mitigation.substring(0, 80)}{risk.risk_mitigation.length > 80 ? '...' : ''}</span>
                        ) : '-'}
                      </td>
                      <td style={{ fontSize: '13px', maxWidth: '200px' }}>
                        {risk.controls ? (
                          <span>{risk.controls.substring(0, 80)}{risk.controls.length > 80 ? '...' : ''}</span>
                        ) : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(risk)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(risk.id)}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
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

export default RiskModal;
