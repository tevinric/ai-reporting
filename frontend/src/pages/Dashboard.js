import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, FolderKanban, CheckCircle, Clock, Lightbulb, Plus, Eye, ChevronLeft, ChevronRight, Pin, X } from 'lucide-react';
import { getDashboardStats, getMonthlyTrends, getInitiatives, pinInitiative, unpinInitiative } from '../services/api';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [allInitiatives, setAllInitiatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drilldownData, setDrilldownData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [selectedInitiatives, setSelectedInitiatives] = useState([]);
  const [selectedInitiativeType, setSelectedInitiativeType] = useState('');
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadTrendsWithFilters();
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [selectedInitiatives, selectedInitiativeType, selectedBusinessUnit]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, trendsResponse, initiativesResponse] = await Promise.all([
        getDashboardStats(),
        getMonthlyTrends(),
        getInitiatives()
      ]);
      setStats(statsResponse.data);
      setTrends(trendsResponse.data);
      setAllInitiatives(initiativesResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter initiatives based on selected filters
  const getFilteredInitiatives = () => {
    let filtered = [...allInitiatives];

    // Filter by specific initiative IDs
    if (selectedInitiatives.length > 0) {
      filtered = filtered.filter(i => selectedInitiatives.includes(i.id));
    }

    // Filter by initiative type
    if (selectedInitiativeType) {
      filtered = filtered.filter(i => i.initiative_type === selectedInitiativeType);
    }

    // Filter by business unit
    if (selectedBusinessUnit) {
      filtered = filtered.filter(i => i.business_unit === selectedBusinessUnit);
    }

    return filtered;
  };

  // Calculate filtered statistics
  const getFilteredStats = () => {
    const filtered = getFilteredInitiatives();

    return {
      total_initiatives: filtered.length,
      completed_count: filtered.filter(i => i.status === 'Live (Complete)').length,
      in_progress_count: filtered.filter(i => i.status === 'In Progress').length,
      ideation_count: filtered.filter(i => i.status === 'Ideation').length,
      new_initiatives_count: filtered.filter(i => {
        const createdDate = new Date(i.created_at);
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      }).length,
      avg_completion: filtered.length > 0
        ? filtered.reduce((sum, i) => sum + (i.percentage_complete || 0), 0) / filtered.length
        : 0,
      in_progress_initiatives: filtered.filter(i => i.status === 'In Progress').slice(0, 10),
      by_department: calculateDepartmentStats(filtered),
      by_benefit: calculateBenefitStats(filtered),
      by_business_unit: calculateBusinessUnitStats(filtered),
      pinned_initiatives: filtered.filter(i => i.is_pinned)
    };
  };

  // Helper function to calculate department statistics
  const calculateDepartmentStats = (initiatives) => {
    const deptMap = {};
    initiatives.forEach(initiative => {
      if (initiative.departments && Array.isArray(initiative.departments)) {
        initiative.departments.forEach(dept => {
          deptMap[dept] = (deptMap[dept] || 0) + 1;
        });
      }
    });
    return Object.entries(deptMap).map(([department, count]) => ({ department, count }));
  };

  // Helper function to calculate benefit statistics
  const calculateBenefitStats = (initiatives) => {
    const benefitMap = {};
    initiatives.forEach(initiative => {
      if (initiative.benefit) {
        benefitMap[initiative.benefit] = (benefitMap[initiative.benefit] || 0) + 1;
      }
    });
    return Object.entries(benefitMap).map(([benefit, count]) => ({ benefit, count }));
  };

  // Helper function to calculate business unit statistics
  const calculateBusinessUnitStats = (initiatives) => {
    const businessUnitMap = {};
    initiatives.forEach(initiative => {
      if (initiative.business_unit) {
        businessUnitMap[initiative.business_unit] = (businessUnitMap[initiative.business_unit] || 0) + 1;
      }
    });
    return Object.entries(businessUnitMap).map(([business_unit, count]) => ({ business_unit, count }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedInitiatives([]);
    setSelectedInitiativeType('');
    setSelectedBusinessUnit('');
  };

  // Get the display stats - filtered or original
  const displayStats = (selectedInitiatives.length > 0 || selectedInitiativeType || selectedBusinessUnit)
    ? getFilteredStats()
    : stats;

  const filteredInitiatives = getFilteredInitiatives();

  const loadTrendsWithFilters = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedInitiatives.length > 0) {
        params.append('initiative_ids', selectedInitiatives.join(','));
      }
      if (selectedInitiativeType) {
        params.append('initiative_type', selectedInitiativeType);
      }

      const queryString = params.toString();
      const url = `${API_ENDPOINTS.MONTHLY_TRENDS}${queryString ? `?${queryString}` : ''}`;
      const response = await axios.get(url);
      setTrends(response.data);
    } catch (err) {
      console.error('Failed to load filtered trends', err);
    }
  };

  const handlePeriodClick = async (period) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.DASHBOARD_STATS}/period/${period}`);
      setDrilldownData(response.data);
    } catch (err) {
      console.error('Failed to load drilldown data', err);
    }
  };

  const handleMetricClick = async (metricName) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.DASHBOARD_STATS}/metric/${encodeURIComponent(metricName)}`);
      setDrilldownData(response.data);
    } catch (err) {
      console.error('Failed to load metric drilldown', err);
    }
  };

  const closeDrilldown = () => {
    setDrilldownData(null);
  };

  const handlePinToggle = async (initiativeId, isPinned) => {
    try {
      if (isPinned) {
        await unpinInitiative(initiativeId);
      } else {
        await pinInitiative(initiativeId);
      }
      // Reload dashboard to get updated pinned list
      loadDashboardData();
    } catch (err) {
      console.error('Failed to toggle pin', err);
      alert('Failed to update pin status');
    }
  };

  const handleInitiativeToggle = (initiativeId) => {
    setSelectedInitiatives(prev => {
      if (prev.includes(initiativeId)) {
        return prev.filter(id => id !== initiativeId);
      } else {
        return [...prev, initiativeId];
      }
    });
  };

  // Extract all unique metric names from trends
  const getAllMetricNames = () => {
    const metricNames = new Set();
    trends.forEach(trend => {
      Object.keys(trend).forEach(key => {
        if (key.endsWith('_total') || key.endsWith('_avg')) {
          const metricName = key.replace(/_total$/, '').replace(/_avg$/, '');
          metricNames.add(metricName);
        }
      });
    });
    return Array.from(metricNames).filter(name =>
      name !== 'metric_period' && name !== 'active_initiatives'
    );
  };

  // Get color for metric
  const getColorForMetric = (index) => {
    return COLORS[index % COLORS.length];
  };

  // Pagination - use filtered initiatives
  const totalPages = Math.ceil(filteredInitiatives.length / itemsPerPage);
  const paginatedInitiatives = filteredInitiatives.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const hasActiveFilters = selectedInitiatives.length > 0 || selectedInitiativeType || selectedBusinessUnit;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of all AI initiatives and their performance metrics</p>
      </div>

      {/* Global Filter Controls - Moved to Top */}
      <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #3b82f6' }}>
        <div className="card-header">
          <h2>Dashboard Filters</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Filter all dashboard data by initiative or type
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Initiative Multiselect */}
          <div style={{ flex: '1 1 300px', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
              Filter by Initiative(s)
            </label>
            <div style={{
              position: 'relative',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              minHeight: '38px',
              padding: '4px 8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              alignItems: 'center'
            }}>
              {selectedInitiatives.length === 0 ? (
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>All initiatives</span>
              ) : (
                selectedInitiatives.map(id => {
                  const initiative = allInitiatives.find(i => i.id === id);
                  return initiative ? (
                    <span key={id} style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {initiative.use_case_name}
                      <X
                        size={14}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleInitiativeToggle(id)}
                      />
                    </span>
                  ) : null;
                })
              )}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleInitiativeToggle(parseInt(e.target.value));
                  }
                }}
                style={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  minWidth: '120px',
                  fontSize: '14px',
                  padding: '4px',
                  backgroundColor: 'transparent'
                }}
              >
                <option value="">+ Add initiative</option>
                {allInitiatives
                  .filter(i => !selectedInitiatives.includes(i.id))
                  .map(i => (
                    <option key={i.id} value={i.id}>{i.use_case_name}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Initiative Type Dropdown */}
          <div style={{ flex: '0 1 200px', minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
              Filter by Type
            </label>
            <select
              value={selectedInitiativeType}
              onChange={(e) => setSelectedInitiativeType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="">All Types</option>
              <option value="Internal AI">Internal AI</option>
              <option value="RPA">RPA</option>
              <option value="External AI">External AI</option>
            </select>
          </div>

          {/* Business Unit Dropdown */}
          <div style={{ flex: '0 1 200px', minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
              Filter by Business Unit
            </label>
            <select
              value={selectedBusinessUnit}
              onChange={(e) => setSelectedBusinessUnit(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="">All Business Units</option>
              {stats?.by_business_unit?.map((bu, index) => (
                <option key={index} value={bu.business_unit}>{bu.business_unit}</option>
              ))}
            </select>
          </div>

          {/* Clear All Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="btn btn-secondary"
            >
              Clear All Filters
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#eff6ff', borderRadius: '6px', fontSize: '13px', color: '#1e40af' }}>
            Showing filtered results: {filteredInitiatives.length} initiative{filteredInitiatives.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Key Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Initiatives</span>
          <div className="stat-value">{displayStats?.total_initiatives || 0}</div>
          <div className="stat-change">
            <FolderKanban size={16} />
            <span>Active projects</span>
          </div>
        </div>

        <div className="stat-card success">
          <span className="stat-label">Completed</span>
          <div className="stat-value">{displayStats?.completed_count || 0}</div>
          <div className="stat-change positive">
            <CheckCircle size={16} />
            <span>Live solutions</span>
          </div>
        </div>

        <div className="stat-card warning">
          <span className="stat-label">In Progress</span>
          <div className="stat-value">{displayStats?.in_progress_count || 0}</div>
          <div className="stat-change">
            <Clock size={16} />
            <span>Under development</span>
          </div>
        </div>

        <div className="stat-card info">
          <span className="stat-label">New This Month</span>
          <div className="stat-value">{displayStats?.new_initiatives_count || 0}</div>
          <div className="stat-change positive">
            <Plus size={16} />
            <span>Recently added</span>
          </div>
        </div>
      </div>

      {/* Pinned Initiatives */}
      {displayStats?.pinned_initiatives && displayStats.pinned_initiatives.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #3b82f6' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Pin size={20} style={{ color: '#3b82f6' }} />
            <h2>Pinned Initiatives</h2>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Initiative</th>
                  <th>Type</th>
                  <th>Departments</th>
                  <th>Status</th>
                  <th>Health</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayStats.pinned_initiatives.map(initiative => (
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
                            {initiative.use_case_name?.charAt(0) || 'I'}
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
                    <td style={{ fontSize: '13px' }}>{initiative.initiative_type || 'Internal AI'}</td>
                    <td style={{ fontSize: '13px' }}>{initiative.departments || '-'}</td>
                    <td>
                      <span className={`badge ${
                        initiative.status === 'Live (Complete)' ? 'badge-success' :
                        initiative.status === 'In Progress' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {initiative.status}
                      </span>
                    </td>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          flex: 1,
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          minWidth: '80px'
                        }}>
                          <div style={{
                            width: `${initiative.percentage_complete || 0}%`,
                            height: '100%',
                            backgroundColor: '#3b82f6',
                            transition: 'width 0.3s'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '13px', color: '#64748b', minWidth: '35px' }}>
                          {initiative.percentage_complete || 0}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => navigate(`/initiatives/${initiative.id}`)}
                          className="btn btn-sm btn-secondary"
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handlePinToggle(initiative.id, true)}
                          className="btn btn-sm btn-secondary"
                          title="Unpin"
                          style={{ color: '#3b82f6' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* In-Progress Initiatives Table */}
      {displayStats?.in_progress_initiatives && displayStats.in_progress_initiatives.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h2>In-Progress Initiatives</h2>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Initiative</th>
                  <th>Departments</th>
                  <th>Health Status</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayStats.in_progress_initiatives.map(initiative => (
                  <tr key={initiative.id}>
                    <td><strong>{initiative.use_case_name}</strong></td>
                    <td style={{ fontSize: '13px' }}>{initiative.departments || '-'}</td>
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
                    <td style={{ minWidth: '200px' }}>
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
                    <td>
                      <button
                        onClick={() => navigate(`/initiatives/${initiative.id}`)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px' }}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Initiatives by Department */}
        <div className="card">
          <div className="card-header">
            <h2>Initiatives by Department</h2>
          </div>
          {displayStats?.by_department && displayStats.by_department.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={displayStats.by_department}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No data available</p>
          )}
        </div>

        {/* Initiatives by Benefit */}
        <div className="card">
          <div className="card-header">
            <h2>Initiatives by Benefit Category</h2>
          </div>
          {displayStats?.by_benefit && displayStats.by_benefit.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={displayStats.by_benefit}
                  dataKey="count"
                  nameKey="benefit"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.benefit}
                >
                  {displayStats.by_benefit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No data available</p>
          )}
        </div>

        {/* Initiatives by Business Unit */}
        <div className="card">
          <div className="card-header">
            <h2>Initiatives by Business Unit</h2>
          </div>
          {displayStats?.by_business_unit && displayStats.by_business_unit.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={displayStats.by_business_unit}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="business_unit" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No data available</p>
          )}
        </div>
      </div>

      {/* Monthly ROI Trends - Aggregated Across All Projects */}
      {trends && trends.length > 0 && getAllMetricNames().length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Monthly ROI Trends {hasActiveFilters ? '(Filtered)' : ''}</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Aggregated metrics across {hasActiveFilters ? 'selected' : 'all'} initiatives - Click any chart to drill down
            </p>
          </div>

          {/* Aggregate ROI Summary Cards */}
          {trends && trends.length > 0 && (
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
                Aggregate ROI Metrics {selectedInitiatives.length > 0 || selectedInitiativeType ? '(Filtered)' : '(All Initiatives)'}
              </h3>
              <div className="stats-grid">
                {getAllMetricNames().slice(0, 4).map((metricName, index) => {
                  // Get the latest values
                  const latestTrend = trends.filter(t => t[`${metricName}_total`] !== undefined).slice(-1)[0];
                  if (!latestTrend) return null;

                  const total = latestTrend[`${metricName}_total`] || 0;
                  const avg = latestTrend[`${metricName}_avg`] || 0;
                  const count = latestTrend[`${metricName}_count`] || 0;

                  const cardColors = ['', 'success', 'warning', 'info'];

                  return (
                    <div key={metricName} className={`stat-card ${cardColors[index % cardColors.length]}`}>
                      <span className="stat-label">{metricName}</span>
                      <div className="stat-value">{total.toFixed(2)}</div>
                      <div className="stat-change">
                        <TrendingUp size={16} />
                        <span>Avg: {avg.toFixed(2)} | {count} initiatives</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', padding: '20px' }}>
            {getAllMetricNames().map((metricName, index) => {
              // Filter trends to only periods where this metric exists
              const metricData = trends.filter(trend =>
                trend[`${metricName}_total`] !== undefined
              ).map(trend => ({
                metric_period: trend.metric_period,
                total: trend[`${metricName}_total`],
                average: trend[`${metricName}_avg`],
                count: trend[`${metricName}_count`]
              }));

              if (metricData.length === 0) return null;

              return (
                <div
                  key={metricName}
                  style={{
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onClick={() => handleMetricClick(metricName)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title="Click to see per-initiative breakdown"
                >
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '12px', textAlign: 'center' }}>
                    {metricName}
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={metricData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric_period" style={{ fontSize: '11px' }} />
                      <YAxis style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{ fontSize: '12px' }}
                        formatter={(value, name) => {
                          if (name === 'total') return [value.toFixed(2), 'Total'];
                          if (name === 'average') return [value.toFixed(2), 'Average'];
                          if (name === 'count') return [value, 'Initiatives'];
                          return [value, name];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke={getColorForMetric(index)}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Total"
                      />
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke={getColorForMetric(index + 5)}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3 }}
                        name="Average"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: '12px', padding: '8px', backgroundColor: 'white', borderRadius: '4px', display: 'flex', justifyContent: 'space-around', fontSize: '11px' }}>
                    <span><strong>Total:</strong> {metricData[metricData.length - 1]?.total?.toFixed(2) || 0}</span>
                    <span><strong>Avg:</strong> {metricData[metricData.length - 1]?.average?.toFixed(2) || 0}</span>
                    <span><strong>Initiatives:</strong> {metricData[metricData.length - 1]?.count || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Initiatives - Paginated Table */}
      <div className="card">
        <div className="card-header">
          <h2>All Initiatives ({filteredInitiatives.length}{hasActiveFilters ? ` of ${allInitiatives.length}` : ''})</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            {hasActiveFilters ? 'Filtered list of initiatives' : 'Complete list of all initiatives with status and details'}
          </p>
        </div>
        {filteredInitiatives.length > 0 ? (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Initiative Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Health</th>
                    <th>Departments</th>
                    <th>Benefit</th>
                    <th>Progress</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInitiatives.map(initiative => (
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
                              {initiative.use_case_name?.charAt(0) || 'I'}
                            </div>
                          )}
                          <div>
                            <strong>{initiative.use_case_name}</strong>
                            {initiative.description && (
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                {initiative.description.substring(0, 80)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px' }}>{initiative.initiative_type || 'Internal AI'}</td>
                      <td>
                        <span className={`badge ${
                          initiative.status === 'Live (Complete)' ? 'badge-success' :
                          initiative.status === 'In Progress' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {initiative.status}
                        </span>
                      </td>
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
                      <td style={{ fontSize: '13px' }}>{initiative.departments?.join(', ') || '-'}</td>
                      <td style={{ fontSize: '13px' }}>{initiative.benefit || '-'}</td>
                      <td style={{ minWidth: '150px' }}>
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
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => navigate(`/initiatives/${initiative.id}`)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px' }}
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handlePinToggle(initiative.id, initiative.is_pinned)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', color: initiative.is_pinned ? '#3b82f6' : '#64748b' }}
                            title={initiative.is_pinned ? 'Unpin from dashboard' : 'Pin to dashboard'}
                          >
                            <Pin size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '20px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No initiatives found</p>
        )}
      </div>

      {/* Drilldown Modal */}
      {drilldownData && (
        <div className="modal-overlay" onClick={closeDrilldown}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header">
              <div>
                <h2>{drilldownData.metric_name ? `Metric: ${drilldownData.metric_name}` : `Period: ${drilldownData.period}`}</h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                  {drilldownData.metric_name ? 'Per-initiative breakdown across all periods' : 'All initiatives with metrics for this period'}
                </p>
              </div>
              <button onClick={closeDrilldown} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {drilldownData.initiatives ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Initiative</th>
                        <th>Departments</th>
                        <th>Status</th>
                        <th>Health</th>
                        <th>Metrics</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drilldownData.initiatives.map(initiative => (
                        <tr key={initiative.id}>
                          <td><strong>{initiative.use_case_name}</strong></td>
                          <td style={{ fontSize: '13px' }}>{initiative.departments || '-'}</td>
                          <td>
                            <span className={`badge ${
                              initiative.status === 'Live (Complete)' ? 'badge-success' :
                              initiative.status === 'In Progress' ? 'badge-warning' : 'badge-info'
                            }`}>
                              {initiative.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor:
                                  (initiative.health_status || '').toLowerCase() === 'green' ? '#10b981' :
                                  (initiative.health_status || '').toLowerCase() === 'amber' ? '#f59e0b' : '#ef4444'
                              }}></div>
                              <span style={{ fontSize: '12px' }}>{initiative.health_status}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            {Object.keys(initiative.metrics || {}).length} tracked
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                closeDrilldown();
                                navigate(`/initiatives/${initiative.id}`);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              <Eye size={14} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : drilldownData.by_period ? (
                <div>
                  {Object.entries(drilldownData.by_period).map(([period, initiatives]) => (
                    <div key={period} style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #3b82f6' }}>
                        {period}
                      </h3>
                      <div className="table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>Initiative</th>
                              <th>Departments</th>
                              <th>Value</th>
                              <th>Comments</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {initiatives.map(initiative => (
                              <tr key={`${period}-${initiative.id}`}>
                                <td><strong>{initiative.use_case_name}</strong></td>
                                <td style={{ fontSize: '13px' }}>{initiative.departments || '-'}</td>
                                <td><strong>{initiative.value}</strong></td>
                                <td style={{ fontSize: '12px', fontStyle: 'italic' }}>{initiative.comments || '-'}</td>
                                <td>
                                  <button
                                    onClick={() => {
                                      closeDrilldown();
                                      navigate(`/initiatives/${initiative.id}`);
                                    }}
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                  >
                                    <Eye size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button onClick={closeDrilldown} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
