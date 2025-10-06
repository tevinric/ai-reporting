import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Calendar, Eye } from 'lucide-react';
import { getFeaturedSolutions } from '../services/api';

function FeaturedSolutions() {
  const navigate = useNavigate();
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    loadFeaturedSolutions();
  }, [selectedMonth]);

  const loadFeaturedSolutions = async () => {
    try {
      setLoading(true);
      const response = await getFeaturedSolutions(selectedMonth);
      setSolutions(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load featured solutions');
      console.error(err);
    } finally {
      setLoading(false);
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
    return <div className="loading">Loading featured solutions...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Featured Solutions</h1>
        <p>Showcasing highlighted AI initiatives for executive reporting</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filter */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar size={20} />
          <label style={{ fontWeight: '500', marginRight: '8px' }}>Filter by Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
          />
          {selectedMonth && (
            <button onClick={() => setSelectedMonth('')} className="btn btn-secondary">
              Show All
            </button>
          )}
        </div>
      </div>

      {/* Featured Solutions List */}
      {solutions.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <Star size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No Featured Solutions</h3>
            <p>No initiatives have been marked as featured for the selected period.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {solutions.map(solution => (
            <div key={solution.id} className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Star size={20} fill="#f59e0b" stroke="#f59e0b" />
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                      {solution.use_case_name}
                    </h2>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    {getStatusBadge(solution.status)}
                    {solution.featured_month && (
                      <span className="badge badge-warning">
                        Featured: {solution.featured_month}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/initiatives/${solution.id}`)}
                  className="btn btn-primary"
                >
                  <Eye size={18} />
                  View Details
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Description</h4>
                <p style={{ color: '#1e293b', lineHeight: '1.6' }}>{solution.description}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <div>
                  <span className="stat-label">Departments</span>
                  <div style={{ marginTop: '4px', fontSize: '14px', color: '#1e293b' }}>
                    {solution.departments?.join(', ') || 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="stat-label">Benefit Category</span>
                  <div style={{ marginTop: '4px', fontSize: '14px', color: '#1e293b' }}>
                    {solution.benefit || 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="stat-label">Strategic Objective</span>
                  <div style={{ marginTop: '4px', fontSize: '14px', color: '#1e293b' }}>
                    {solution.strategic_objective || 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="stat-label">Completion</span>
                  <div style={{ marginTop: '4px' }}>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${solution.percentage_complete || 0}%` }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      {solution.percentage_complete || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {(solution.process_owner || solution.business_owner) && (
                <div style={{ marginTop: '16px', display: 'flex', gap: '24px', fontSize: '14px', color: '#64748b' }}>
                  {solution.process_owner && (
                    <div>
                      <strong>Process Owner:</strong> {solution.process_owner}
                    </div>
                  )}
                  {solution.business_owner && (
                    <div>
                      <strong>Business Owner:</strong> {solution.business_owner}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeaturedSolutions;
