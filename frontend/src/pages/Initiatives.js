import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Filter, BarChart3, AlertTriangle, Download } from 'lucide-react';
import { getInitiatives, deleteInitiative, getFieldOptions } from '../services/api';
import MetricsModal from '../components/MetricsModal';
import RiskModal from '../components/RiskModal';

function Initiatives() {
  const navigate = useNavigate();
  const [initiatives, setInitiatives] = useState([]);
  const [filteredInitiatives, setFilteredInitiatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusOptions, setStatusOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [selectedInitiativeForRisk, setSelectedInitiativeForRisk] = useState(null);

  useEffect(() => {
    loadInitiatives();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [initiatives, statusFilter, departmentFilter]);

  const loadInitiatives = async () => {
    try {
      setLoading(true);
      const response = await getInitiatives();
      setInitiatives(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load initiatives');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [statusRes, deptRes] = await Promise.all([
        getFieldOptions('status'),
        getFieldOptions('department')
      ]);
      setStatusOptions(statusRes.data);
      setDepartmentOptions(deptRes.data);
    } catch (err) {
      console.error('Failed to load filter options', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...initiatives];

    if (statusFilter) {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    if (departmentFilter) {
      filtered = filtered.filter(i => i.departments && i.departments.includes(departmentFilter));
    }

    setFilteredInitiatives(filtered);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this initiative?')) {
      return;
    }

    try {
      await deleteInitiative(id);
      loadInitiatives();
    } catch (err) {
      alert('Failed to delete initiative');
      console.error(err);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/initiatives/export`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export initiatives');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'AI_Initiatives_Export.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to export initiatives to Excel');
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

  if (loading) {
    return <div className="loading">Loading initiatives...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>AI Initiatives</h1>
        <p>Manage all AI initiatives across the organization</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters and Actions */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="">All Statuses</option>
              {statusOptions.map(opt => (
                <option key={opt.id} value={opt.option_value}>{opt.option_value}</option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="">All Departments</option>
              {departmentOptions.map(opt => (
                <option key={opt.id} value={opt.option_value}>{opt.option_value}</option>
              ))}
            </select>

            {(statusFilter || departmentFilter) && (
              <button
                onClick={() => { setStatusFilter(''); setDepartmentFilter(''); }}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleExportToExcel}
              className="btn btn-secondary"
              title="Export all initiatives to Excel"
            >
              <Download size={18} />
              Export to Excel
            </button>

            <button
              onClick={() => navigate('/initiatives/new')}
              className="btn btn-primary"
            >
              <Plus size={18} />
              New Initiative
            </button>
          </div>
        </div>
      </div>

      {/* Initiatives Table */}
      <div className="card">
        <div className="table-container">
          {filteredInitiatives.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <p>No initiatives found</p>
              <button
                onClick={() => navigate('/initiatives/new')}
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
              >
                <Plus size={18} />
                Create Your First Initiative
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Use Case Name</th>
                  <th>Type</th>
                  <th>Business Unit</th>
                  <th>Status</th>
                  <th>Health</th>
                  <th>Departments</th>
                  <th>Benefit</th>
                  <th>Progress</th>
                  <th>Modified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInitiatives.map(initiative => (
                  <tr key={initiative.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {initiative.initiative_image ? (
                          <img
                            src={initiative.initiative_image}
                            alt={initiative.use_case_name}
                            className="initiative-avatar"
                          />
                        ) : (
                          <div className="initiative-avatar-placeholder">
                            {initiative.use_case_name?.charAt(0)?.toUpperCase() || 'I'}
                          </div>
                        )}
                        <div>
                          <strong>{initiative.use_case_name}</strong>
                          <br />
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {initiative.description?.substring(0, 60)}
                            {initiative.description?.length > 60 ? '...' : ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        {initiative.initiative_type || 'Internal AI'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        {initiative.business_unit || '-'}
                      </span>
                    </td>
                    <td>{getStatusBadge(initiative.status)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor:
                            (initiative.health_status || '').toLowerCase() === 'green' ? '#10b981' :
                            (initiative.health_status || '').toLowerCase() === 'amber' ? '#f59e0b' : '#ef4444'
                        }}></div>
                        <span style={{ fontSize: '13px' }}>{initiative.health_status || 'Green'}</span>
                      </div>
                    </td>
                    <td>
                      {initiative.departments?.join(', ') || '-'}
                    </td>
                    <td>{initiative.benefit || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${initiative.percentage_complete || 0}%` }}
                          ></div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {initiative.percentage_complete || 0}%
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {new Date(initiative.modified_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => navigate(`/initiatives/${initiative.id}`)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px' }}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => { setSelectedInitiative(initiative); setShowMetricsModal(true); }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px' }}
                          title="Metrics"
                        >
                          <BarChart3 size={16} />
                        </button>
                        <button
                          onClick={() => { setSelectedInitiativeForRisk(initiative.id); setShowRiskModal(true); }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px' }}
                          title="View Risks"
                        >
                          <AlertTriangle size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/initiatives/${initiative.id}/edit`)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px' }}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(initiative.id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Metrics Modal */}
      {showMetricsModal && selectedInitiative && (
        <MetricsModal
          initiative={selectedInitiative}
          onClose={() => { setShowMetricsModal(false); setSelectedInitiative(null); }}
        />
      )}

      {/* Risk Modal */}
      {showRiskModal && selectedInitiativeForRisk && (
        <RiskModal
          initiativeId={selectedInitiativeForRisk}
          onClose={() => { setShowRiskModal(false); setSelectedInitiativeForRisk(null); }}
        />
      )}
    </div>
  );
}

export default Initiatives;
