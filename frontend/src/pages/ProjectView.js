import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, TrendingUp, TrendingDown, AlertTriangle, Edit2, Trash2, Save, BarChart3, Plus, Eye, MessageSquare, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getInitiativeById, getInitiativeMetrics, getProgressUpdates, createProgressUpdate, updateProgressUpdate, deleteProgressUpdate, getProgressUpdateById } from '../services/api';
import RiskModal from '../components/RiskModal';
import MetricsModal from '../components/MetricsModal';
import ProgressUpdateModal from '../components/ProgressUpdateModal';
import ProgressTimeline from '../components/ProgressTimeline';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initiative, setInitiative] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [editingMetric, setEditingMetric] = useState(null);

  // Progress Updates state
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [progressUpdatesLoading, setProgressUpdatesLoading] = useState(false);
  const [showProgressUpdateModal, setShowProgressUpdateModal] = useState(false);
  const [selectedProgressUpdate, setSelectedProgressUpdate] = useState(null);
  const [viewProgressUpdate, setViewProgressUpdate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUpdates, setTotalUpdates] = useState(0);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    loadProgressUpdates();
  }, [id, currentPage]);

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

  const loadProgressUpdates = async () => {
    try {
      setProgressUpdatesLoading(true);
      const response = await getProgressUpdates(id, currentPage, 10);
      setProgressUpdates(response.data.updates);
      setTotalPages(response.data.total_pages);
      setTotalUpdates(response.data.total_count);
    } catch (err) {
      console.error('Failed to load progress updates:', err);
    } finally {
      setProgressUpdatesLoading(false);
    }
  };

  const handleSaveProgressUpdate = async (formData) => {
    if (selectedProgressUpdate) {
      await updateProgressUpdate(selectedProgressUpdate.id, formData);
    } else {
      await createProgressUpdate(id, formData);
    }
    loadProgressUpdates();
    setShowProgressUpdateModal(false);
    setSelectedProgressUpdate(null);
  };

  const handleEditProgressUpdate = (update) => {
    setSelectedProgressUpdate(update);
    setShowProgressUpdateModal(true);
  };

  const handleDeleteProgressUpdate = async (updateId) => {
    if (!window.confirm('Are you sure you want to delete this progress update?')) {
      return;
    }
    try {
      await deleteProgressUpdate(updateId);
      loadProgressUpdates();
    } catch (err) {
      alert('Failed to delete progress update');
      console.error(err);
    }
  };

  const handleViewProgressUpdate = async (updateId) => {
    try {
      const response = await getProgressUpdateById(updateId);
      setViewProgressUpdate(response.data);
    } catch (err) {
      console.error('Failed to load progress update details:', err);
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

  // Get all unique metric names from current initiative
  const getCurrentMetricNames = () => {
    if (metrics.length === 0) return [];

    const metricNames = new Set();
    metrics.forEach(metric => {
      if (metric.additional_metrics && typeof metric.additional_metrics === 'object') {
        Object.keys(metric.additional_metrics).forEach(name => metricNames.add(name));
      }
    });

    return Array.from(metricNames);
  };

  // Get current month metrics as object
  const getCurrentMonthMetrics = () => {
    if (!metrics[0] || !metrics[0].additional_metrics) return {};
    return metrics[0].additional_metrics;
  };

  // Calculate YTD (Year to Date) metrics
  const calculateYTDMetrics = () => {
    const currentYear = new Date().getFullYear();
    const ytdMetrics = metrics.filter(metric => {
      const metricYear = new Date(metric.metric_period + '-01').getFullYear();
      return metricYear === currentYear;
    });

    if (ytdMetrics.length === 0) return null;

    const aggregated = {};
    const metricNames = getCurrentMetricNames();

    metricNames.forEach(metricName => {
      const values = [];
      ytdMetrics.forEach(metric => {
        if (metric.additional_metrics && metric.additional_metrics[metricName]) {
          const value = parseFloat(metric.additional_metrics[metricName].value);
          if (!isNaN(value)) {
            values.push(value);
          }
        }
      });

      if (values.length > 0) {
        // Determine if this should be summed or averaged based on metric name
        const shouldSum = metricName.toLowerCase().includes('saved') ||
                         metricName.toLowerCase().includes('revenue') ||
                         metricName.toLowerCase().includes('cost') ||
                         metricName.toLowerCase().includes('time') ||
                         metricName.toLowerCase().includes('units');

        aggregated[metricName] = {
          value: shouldSum ? values.reduce((a, b) => a + b, 0) : values.reduce((a, b) => a + b, 0) / values.length,
          isAverage: !shouldSum
        };
      }
    });

    return { metrics: aggregated, months_count: ytdMetrics.length };
  };

  // Calculate All Time metrics
  const calculateAllTimeMetrics = () => {
    if (metrics.length === 0) return null;

    const aggregated = {};
    const metricNames = getCurrentMetricNames();

    metricNames.forEach(metricName => {
      const values = [];
      metrics.forEach(metric => {
        if (metric.additional_metrics && metric.additional_metrics[metricName]) {
          const value = parseFloat(metric.additional_metrics[metricName].value);
          if (!isNaN(value)) {
            values.push(value);
          }
        }
      });

      if (values.length > 0) {
        // Determine if this should be summed or averaged based on metric name
        const shouldSum = metricName.toLowerCase().includes('saved') ||
                         metricName.toLowerCase().includes('revenue') ||
                         metricName.toLowerCase().includes('cost') ||
                         metricName.toLowerCase().includes('time') ||
                         metricName.toLowerCase().includes('units');

        aggregated[metricName] = {
          value: shouldSum ? values.reduce((a, b) => a + b, 0) : values.reduce((a, b) => a + b, 0) / values.length,
          isAverage: !shouldSum
        };
      }
    });

    return { metrics: aggregated, months_count: metrics.length };
  };

  if (loading) {
    return <div className="loading">Loading project data...</div>;
  }

  if (error || !initiative) {
    return <div className="error-message">{error || 'Initiative not found'}</div>;
  }

  const currentMetric = metrics[0];
  const previousMetric = metrics[1];
  const currentMonthMetrics = getCurrentMonthMetrics();
  const ytdMetrics = calculateYTDMetrics();
  const allTimeMetrics = calculateAllTimeMetrics();

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <button onClick={() => navigate('/initiatives')} className="btn btn-secondary" style={{ marginBottom: '12px' }}>
            <ArrowLeft size={18} />
            Back to Initiatives
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px' }}>
            {initiative.initiative_image ? (
              <img
                src={initiative.initiative_image}
                alt={initiative.use_case_name}
                className="initiative-avatar-large"
              />
            ) : (
              <div className="initiative-avatar-large-placeholder">
                {initiative.use_case_name?.charAt(0)?.toUpperCase() || 'I'}
              </div>
            )}
            <div>
              <h1 style={{ margin: 0 }}>{initiative.use_case_name}</h1>
              <p style={{ margin: '8px 0 0 0' }}>{initiative.description}</p>
            </div>
          </div>
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

      {/* Metrics Modal */}
      {showMetricsModal && initiative && (
        <MetricsModal
          initiative={initiative}
          onClose={() => {
            setShowMetricsModal(false);
            loadData(); // Reload data after metrics modal closes
          }}
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
      {currentMetric && Object.keys(currentMonthMetrics).length > 0 && (
        <>
          <div className="card-header" style={{ marginTop: '24px', marginBottom: '16px' }}>
            <h2>Current Month Metrics</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              {currentMetric.metric_period}
            </p>
          </div>
          <div className="stats-grid">
            {Object.entries(currentMonthMetrics).map(([metricName, metricData], index) => {
              const cardTypes = ['', 'success', 'warning', 'info', '', 'success'];
              const cardType = cardTypes[index % cardTypes.length];

              const previousValue = previousMetric?.additional_metrics?.[metricName]?.value;
              const currentValue = metricData.value;

              return (
                <div key={metricName} className={`stat-card ${cardType}`}>
                  <span className="stat-label">{metricName}</span>
                  <div className="stat-value">{parseFloat(currentValue).toLocaleString() || 0}</div>
                  {previousValue && getTrendIndicator(parseFloat(currentValue), parseFloat(previousValue))}
                  {metricData.comments && (
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>
                      {metricData.comments}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* YTD Metrics */}
      {ytdMetrics && Object.keys(ytdMetrics.metrics).length > 0 && (
        <>
          <div className="card-header" style={{ marginTop: '24px', marginBottom: '16px' }}>
            <h2>YTD Metrics (Year to Date)</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Aggregated metrics for {ytdMetrics.months_count} month{ytdMetrics.months_count > 1 ? 's' : ''} in {new Date().getFullYear()}
            </p>
          </div>
          <div className="stats-grid">
            {Object.entries(ytdMetrics.metrics).map(([metricName, metricData], index) => {
              const cardTypes = ['', 'success', 'warning', 'info', '', 'success'];
              const cardType = cardTypes[index % cardTypes.length];

              return (
                <div key={metricName} className={`stat-card ${cardType}`}>
                  <span className="stat-label">
                    {metricName} {metricData.isAverage ? '(Avg)' : '(Total)'}
                  </span>
                  <div className="stat-value">
                    {metricData.isAverage
                      ? metricData.value.toFixed(1)
                      : Math.round(metricData.value).toLocaleString()
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* All Time Metrics */}
      {allTimeMetrics && Object.keys(allTimeMetrics.metrics).length > 0 && (
        <>
          <div className="card-header" style={{ marginTop: '24px', marginBottom: '16px' }}>
            <h2>All Time Metrics</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Aggregated metrics from start of initiative ({allTimeMetrics.months_count} month{allTimeMetrics.months_count > 1 ? 's' : ''})
            </p>
          </div>
          <div className="stats-grid">
            {Object.entries(allTimeMetrics.metrics).map(([metricName, metricData], index) => {
              const cardTypes = ['', 'success', 'warning', 'info', '', 'success'];
              const cardType = cardTypes[index % cardTypes.length];

              return (
                <div key={metricName} className={`stat-card ${cardType}`}>
                  <span className="stat-label">
                    {metricName} {metricData.isAverage ? '(Avg)' : '(Total)'}
                  </span>
                  <div className="stat-value">
                    {metricData.isAverage
                      ? metricData.value.toFixed(1)
                      : Math.round(metricData.value).toLocaleString()
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Individual Metrics Trends */}
      {metrics.length > 1 && getAllMetricNames().length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Performance Trends</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Individual trend charts for each tracked metric
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', padding: '20px' }}>
            {getAllMetricNames().map((metricName, index) => {
              // Filter data to only include periods where this metric has values
              const metricData = prepareTrendData().filter(point =>
                point[metricName] !== undefined && point[metricName] !== null
              );

              if (metricData.length === 0) return null;

              return (
                <div key={metricName} style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '12px', textAlign: 'center' }}>
                    {metricName}
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={metricData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="metric_period"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: '12px' }}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Line
                        type="monotone"
                        dataKey={metricName}
                        stroke={getColorForIndex(index)}
                        strokeWidth={3}
                        dot={{ r: 5, fill: getColorForIndex(index) }}
                        activeDot={{ r: 7 }}
                        name={metricName}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: '12px', padding: '8px', backgroundColor: 'white', borderRadius: '4px', textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {metricData.length} data points
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Updates Section */}
      <div className="card">
        <div className="card-header">
          <h2>Progress Updates</h2>
          <button
            onClick={() => {
              setSelectedProgressUpdate(null);
              setShowProgressUpdateModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Add Update
          </button>
        </div>

        {progressUpdatesLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading updates...
          </div>
        ) : progressUpdates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p>No progress updates yet</p>
            <button
              onClick={() => {
                setSelectedProgressUpdate(null);
                setShowProgressUpdateModal(true);
              }}
              className="btn btn-primary"
              style={{ marginTop: '16px' }}
            >
              <Plus size={18} />
              Add Your First Update
            </button>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Created By</th>
                    <th>Created At</th>
                    <th>Last Modified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {progressUpdates.map(update => {
                    const getTypeColor = (type) => {
                      switch (type) {
                        case 'Update': return '#10b981';
                        case 'Road block': return '#f59e0b';
                        case 'Threat': return '#ef4444';
                        case 'Requirement': return '#3b82f6';
                        default: return '#64748b';
                      }
                    };

                    return (
                      <tr key={update.id}>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: `${getTypeColor(update.update_type)}20`,
                            color: getTypeColor(update.update_type)
                          }}>
                            {update.update_type}
                          </span>
                        </td>
                        <td>
                          <strong>{update.update_title}</strong>
                        </td>
                        <td>{update.created_by_name}</td>
                        <td style={{ fontSize: '13px', color: '#64748b' }}>
                          {new Date(update.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ fontSize: '13px', color: '#64748b' }}>
                          {update.modified_at !== update.created_at
                            ? new Date(update.modified_at).toLocaleDateString()
                            : '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleViewProgressUpdate(update.id)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px' }}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditProgressUpdate(update)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px' }}
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteProgressUpdate(update.id)}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px' }}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '16px', borderTop: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                  Showing page {currentPage} of {totalPages} ({totalUpdates} total updates)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px' }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px' }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Timeline */}
        {progressUpdates.length > 0 && (
          <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '2px solid #e5e7eb' }}>
            <ProgressTimeline updates={progressUpdates} />
          </div>
        )}
      </div>

      {/* Progress Update Modal */}
      {showProgressUpdateModal && (
        <ProgressUpdateModal
          update={selectedProgressUpdate}
          onSave={handleSaveProgressUpdate}
          onClose={() => {
            setShowProgressUpdateModal(false);
            setSelectedProgressUpdate(null);
          }}
        />
      )}

      {/* View Progress Update Modal */}
      {viewProgressUpdate && (
        <div className="modal-overlay" onClick={() => setViewProgressUpdate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Update Details</h2>
              <button onClick={() => setViewProgressUpdate(null)} className="modal-close">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <span className="stat-label">Type</span>
                <div style={{ marginTop: '8px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: (() => {
                      switch (viewProgressUpdate.update_type) {
                        case 'Update': return '#10b98120';
                        case 'Road block': return '#f59e0b20';
                        case 'Threat': return '#ef444420';
                        case 'Requirement': return '#3b82f620';
                        default: return '#64748b20';
                      }
                    })(),
                    color: (() => {
                      switch (viewProgressUpdate.update_type) {
                        case 'Update': return '#10b981';
                        case 'Road block': return '#f59e0b';
                        case 'Threat': return '#ef4444';
                        case 'Requirement': return '#3b82f6';
                        default: return '#64748b';
                      }
                    })()
                  }}>
                    {viewProgressUpdate.update_type}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span className="stat-label">Title</span>
                <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                  {viewProgressUpdate.update_title}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span className="stat-label">Details</span>
                <div style={{ marginTop: '8px', fontSize: '14px', color: '#1f2937', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {viewProgressUpdate.update_details || 'No details provided'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <div>
                  <span className="stat-label">Created By</span>
                  <div style={{ marginTop: '4px', fontSize: '14px', color: '#1f2937' }}>
                    {viewProgressUpdate.created_by_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {viewProgressUpdate.created_by_email}
                  </div>
                </div>
                <div>
                  <span className="stat-label">Created At</span>
                  <div style={{ marginTop: '4px', fontSize: '14px', color: '#1f2937' }}>
                    {new Date(viewProgressUpdate.created_at).toLocaleString()}
                  </div>
                </div>
                {viewProgressUpdate.modified_at !== viewProgressUpdate.created_at && (
                  <>
                    <div>
                      <span className="stat-label">Modified By</span>
                      <div style={{ marginTop: '4px', fontSize: '14px', color: '#1f2937' }}>
                        {viewProgressUpdate.modified_by_name}
                      </div>
                    </div>
                    <div>
                      <span className="stat-label">Modified At</span>
                      <div style={{ marginTop: '4px', fontSize: '14px', color: '#1f2937' }}>
                        {new Date(viewProgressUpdate.modified_at).toLocaleString()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setViewProgressUpdate(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Metrics */}
      <div className="card">
        <div className="card-header">
          <h2>Monthly Metrics</h2>
          <button onClick={() => setShowMetricsModal(true)} className="btn btn-primary">
            <BarChart3 size={18} />
            Track Monthly Metrics
          </button>
        </div>

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
                                onChange={(e) => setEditingMetric(prev => ({ ...prev, value: e.target.value }))}
                                style={{ width: '100%', padding: '6px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px' }}
                                placeholder="Value"
                              />
                              <textarea
                                value={editingMetric.comments}
                                onChange={(e) => setEditingMetric(prev => ({ ...prev, comments: e.target.value }))}
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
