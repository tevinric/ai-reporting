import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, FolderKanban, CheckCircle, Clock, Lightbulb } from 'lucide-react';
import { getDashboardStats, getMonthlyTrends } from '../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, trendsResponse] = await Promise.all([
        getDashboardStats(),
        getMonthlyTrends()
      ]);
      setStats(statsResponse.data);
      setTrends(trendsResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of all AI initiatives and their performance metrics</p>
      </div>

      {/* Key Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Initiatives</span>
          <div className="stat-value">{stats?.total_initiatives || 0}</div>
          <div className="stat-change">
            <FolderKanban size={16} />
            <span>Active projects</span>
          </div>
        </div>

        <div className="stat-card success">
          <span className="stat-label">Completed</span>
          <div className="stat-value">{stats?.completed_count || 0}</div>
          <div className="stat-change positive">
            <CheckCircle size={16} />
            <span>Live solutions</span>
          </div>
        </div>

        <div className="stat-card warning">
          <span className="stat-label">In Progress</span>
          <div className="stat-value">{stats?.in_progress_count || 0}</div>
          <div className="stat-change">
            <Clock size={16} />
            <span>Under development</span>
          </div>
        </div>

        <div className="stat-card info">
          <span className="stat-label">Ideation</span>
          <div className="stat-value">{stats?.ideation_count || 0}</div>
          <div className="stat-change">
            <Lightbulb size={16} />
            <span>Planning phase</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Initiatives by Department */}
        <div className="card">
          <div className="card-header">
            <h2>Initiatives by Department</h2>
          </div>
          {stats?.by_department && stats.by_department.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.by_department}>
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
          {stats?.by_benefit && stats.by_benefit.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.by_benefit}
                  dataKey="count"
                  nameKey="benefit"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.benefit}
                >
                  {stats.by_benefit.map((entry, index) => (
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
      </div>

      {/* Monthly Trends */}
      {trends && trends.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Monthly ROI Trends</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric_period" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="total_time_saved" stroke="#3b82f6" name="Time Saved (hrs)" />
              <Line yAxisId="right" type="monotone" dataKey="total_cost_saved" stroke="#10b981" name="Cost Saved (R)" />
              <Line yAxisId="right" type="monotone" dataKey="total_revenue_increase" stroke="#f59e0b" name="Revenue Increase (R)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Average Completion */}
      <div className="card">
        <div className="card-header">
          <h2>Overall Progress</h2>
        </div>
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Average Completion Rate</span>
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              {stats?.avg_completion ? `${stats.avg_completion.toFixed(1)}%` : '0%'}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${stats?.avg_completion || 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
