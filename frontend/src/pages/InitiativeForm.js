import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import {
  getInitiativeById,
  createInitiative,
  updateInitiative,
  getFieldOptions,
  getProcessOwnerSuggestions,
  getBusinessOwnerSuggestions
} from '../services/api';

function InitiativeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Field options
  const [benefitOptions, setBenefitOptions] = useState([]);
  const [objectiveOptions, setObjectiveOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [riskOptions, setRiskOptions] = useState([]);
  const [healthStatusOptions, setHealthStatusOptions] = useState([]);
  const [initiativeTypeOptions, setInitiativeTypeOptions] = useState([]);
  const [processOwnerSuggestions, setProcessOwnerSuggestions] = useState([]);
  const [businessOwnerSuggestions, setBusinessOwnerSuggestions] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    use_case_name: '',
    description: '',
    benefit: '',
    strategic_objective: '',
    status: 'Ideation',
    percentage_complete: 0,
    process_owner: '',
    business_owner: '',
    start_date: '',
    expected_completion_date: '',
    actual_completion_date: '',
    priority: '',
    risk_level: '',
    technology_stack: '',
    team_size: '',
    budget_allocated: '',
    budget_spent: '',
    health_status: 'Green',
    initiative_type: 'Internal AI',
    is_featured: false,
    featured_month: '',
    departments: []
  });

  useEffect(() => {
    loadFieldOptions();
    loadSuggestions();
    if (isEdit) {
      loadInitiative();
    }
  }, [id]);

  const loadFieldOptions = async () => {
    try {
      const [benefits, objectives, statuses, departments, priorities, risks, healthStatuses, initiativeTypes] = await Promise.all([
        getFieldOptions('benefit'),
        getFieldOptions('strategic_objective'),
        getFieldOptions('status'),
        getFieldOptions('department'),
        getFieldOptions('priority'),
        getFieldOptions('risk_level'),
        getFieldOptions('health_status'),
        getFieldOptions('initiative_type')
      ]);

      setBenefitOptions(benefits.data);
      setObjectiveOptions(objectives.data);
      setStatusOptions(statuses.data);
      setDepartmentOptions(departments.data);
      setPriorityOptions(priorities.data);
      setRiskOptions(risks.data);
      setHealthStatusOptions(healthStatuses.data);
      setInitiativeTypeOptions(initiativeTypes.data);
    } catch (err) {
      console.error('Failed to load field options', err);
    }
  };

  const loadSuggestions = async () => {
    try {
      const [processOwners, businessOwners] = await Promise.all([
        getProcessOwnerSuggestions(),
        getBusinessOwnerSuggestions()
      ]);
      setProcessOwnerSuggestions(processOwners.data);
      setBusinessOwnerSuggestions(businessOwners.data);
    } catch (err) {
      console.error('Failed to load suggestions', err);
    }
  };

  const loadInitiative = async () => {
    try {
      setLoading(true);
      const response = await getInitiativeById(id);
      const data = response.data;

      // Helper function to format date strings for date inputs
      const formatDateForInput = (dateValue) => {
        if (!dateValue) return '';
        // Handle both date-only (YYYY-MM-DD) and datetime formats (YYYY-MM-DDTHH:MM:SS)
        const dateStr = String(dateValue);
        if (dateStr.includes('T')) {
          return dateStr.split('T')[0];
        }
        // Already in YYYY-MM-DD format or just take first 10 chars
        return dateStr.substring(0, 10);
      };

      // Format dates for input fields
      const formattedStartDate = formatDateForInput(data.start_date);
      const formattedExpectedDate = formatDateForInput(data.expected_completion_date);
      const formattedActualDate = formatDateForInput(data.actual_completion_date);
      const formattedFeaturedMonth = data.featured_month ? formatDateForInput(data.featured_month).substring(0, 7) : '';

      console.log('Loading initiative - dates from DB:', {
        start_date: data.start_date,
        expected_completion_date: data.expected_completion_date,
        actual_completion_date: data.actual_completion_date
      });
      console.log('Formatted dates for form:', {
        start_date: formattedStartDate,
        expected_completion_date: formattedExpectedDate,
        actual_completion_date: formattedActualDate
      });

      // Ensure all fields exist with defaults
      setFormData({
        use_case_name: data.use_case_name || '',
        description: data.description || '',
        benefit: data.benefit || '',
        strategic_objective: data.strategic_objective || '',
        status: data.status || 'Ideation',
        percentage_complete: data.percentage_complete ?? 0,
        process_owner: data.process_owner || '',
        business_owner: data.business_owner || '',
        start_date: formattedStartDate,
        expected_completion_date: formattedExpectedDate,
        actual_completion_date: formattedActualDate,
        priority: data.priority || '',
        risk_level: data.risk_level || '',
        technology_stack: data.technology_stack || '',
        team_size: data.team_size ?? '',
        budget_allocated: data.budget_allocated ?? '',
        budget_spent: data.budget_spent ?? '',
        health_status: data.health_status || 'Green',
        initiative_type: data.initiative_type || 'Internal AI',
        is_featured: data.is_featured ?? false,
        featured_month: formattedFeaturedMonth,
        departments: data.departments || []
      });
    } catch (err) {
      setError('Failed to load initiative');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDepartmentToggle = (dept) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter(d => d !== dept)
        : [...prev.departments, dept]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Format the data before sending to backend
      const formattedData = {
        // Trim all string fields
        use_case_name: formData.use_case_name?.trim() || '',
        description: formData.description?.trim() || '',
        benefit: formData.benefit?.trim() || '',
        strategic_objective: formData.strategic_objective?.trim() || '',
        status: formData.status?.trim() || 'Ideation',
        process_owner: formData.process_owner?.trim() || '',
        business_owner: formData.business_owner?.trim() || '',
        priority: formData.priority?.trim() || '',
        risk_level: formData.risk_level?.trim() || '',
        technology_stack: formData.technology_stack?.trim() || '',
        health_status: formData.health_status?.trim() || 'Green',
        initiative_type: formData.initiative_type?.trim() || 'Internal AI',
        // Convert empty strings to null for numeric fields
        percentage_complete: formData.percentage_complete === '' ? 0 : Number(formData.percentage_complete),
        team_size: formData.team_size === '' ? null : Number(formData.team_size),
        budget_allocated: formData.budget_allocated === '' ? null : Number(formData.budget_allocated),
        budget_spent: formData.budget_spent === '' ? null : Number(formData.budget_spent),
        // Ensure boolean is properly formatted
        is_featured: Boolean(formData.is_featured),
        // Explicitly preserve date fields - ensure they maintain their values
        start_date: formData.start_date || '',
        expected_completion_date: formData.expected_completion_date || '',
        actual_completion_date: formData.actual_completion_date || '',
        featured_month: formData.featured_month || '',
        // Preserve departments array
        departments: formData.departments || []
      };

      console.log('Submitting initiative - date values:', {
        start_date: formattedData.start_date,
        expected_completion_date: formattedData.expected_completion_date,
        actual_completion_date: formattedData.actual_completion_date,
        isEdit: isEdit
      });

      if (isEdit) {
        await updateInitiative(id, formattedData);
        setSuccess('Initiative updated successfully');
      } else {
        await createInitiative(formattedData);
        setSuccess('Initiative created successfully');
      }

      setTimeout(() => {
        navigate('/initiatives');
      }, 1500);
    } catch (err) {
      setError('Failed to save initiative');
      console.error('Error saving initiative:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return <div className="loading">Loading initiative...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Initiative' : 'New Initiative'}</h1>
        <p>Capture details about the AI initiative</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '600' }}>Basic Information</h3>

          <div className="form-group">
            <label>Use Case Name *</label>
            <input
              type="text"
              name="use_case_name"
              value={formData.use_case_name}
              onChange={handleChange}
              required
              placeholder="Enter the name/title of the AI initiative"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Provide a detailed description of the project"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Benefit *</label>
              <select
                name="benefit"
                value={formData.benefit}
                onChange={handleChange}
                required
              >
                <option value="">Select a benefit</option>
                {benefitOptions.map(opt => (
                  <option key={opt.id} value={opt.option_value}>{opt.option_value}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Strategic Objective *</label>
              <select
                name="strategic_objective"
                value={formData.strategic_objective}
                onChange={handleChange}
                required
              >
                <option value="">Select an objective</option>
                {objectiveOptions.map(opt => (
                  <option key={opt.id} value={opt.option_value}>{opt.option_value}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                {statusOptions.map(opt => (
                  <option key={opt.id} value={opt.option_value}>{opt.option_value}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Initiative Type *</label>
              <select
                name="initiative_type"
                value={formData.initiative_type}
                onChange={handleChange}
                required
              >
                {initiativeTypeOptions.map(opt => (
                  <option key={opt.id} value={opt.option_value}>{opt.option_value}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Percentage Complete</label>
              <input
                type="number"
                name="percentage_complete"
                value={formData.percentage_complete}
                onChange={handleChange}
                min="0"
                max="100"
                placeholder="0-100"
              />
            </div>

            <div className="form-group">
              <label>Health Status</label>
              <select
                name="health_status"
                value={formData.health_status}
                onChange={handleChange}
              >
                {healthStatusOptions.map(opt => (
                  <option key={opt.id} value={opt.option_value}>{opt.option_value}</option>
                ))}
              </select>
              <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Green: On track | Amber: At risk | Red: Behind schedule
              </small>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                style={{ width: 'auto', margin: 0 }}
              />
              Mark as Featured Solution
            </label>
            <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Featured solutions will be highlighted on the dashboard
            </small>
            {formData.is_featured && (
              <div style={{ marginTop: '8px' }}>
                <label>Featured Month</label>
                <input
                  type="month"
                  name="featured_month"
                  value={formData.featured_month}
                  onChange={handleChange}
                  placeholder="YYYY-MM"
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Departments (Select multiple)</label>
            <div className="multiselect-selected">
              {formData.departments.length === 0 ? (
                <span style={{ color: '#9ca3af' }}>Select departments</span>
              ) : (
                formData.departments.map(dept => (
                  <div key={dept} className="multiselect-tag">
                    {dept}
                    <button type="button" onClick={() => handleDepartmentToggle(dept)}>
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {departmentOptions.map(opt => (
                !formData.departments.includes(opt.option_value) && (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleDepartmentToggle(opt.option_value)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '13px' }}
                  >
                    <Plus size={14} />
                    {opt.option_value}
                  </button>
                )
              ))}
            </div>
          </div>

          <h3 style={{ margin: '32px 0 20px 0', fontSize: '16px', fontWeight: '600' }}>Ownership & Timeline</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Process Owner</label>
              <input
                type="text"
                name="process_owner"
                value={formData.process_owner}
                onChange={handleChange}
                list="process-owners"
                placeholder="Enter or select process owner"
              />
              <datalist id="process-owners">
                {processOwnerSuggestions.map((owner, idx) => (
                  <option key={idx} value={owner} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label>Business Owner</label>
              <input
                type="text"
                name="business_owner"
                value={formData.business_owner}
                onChange={handleChange}
                list="business-owners"
                placeholder="Enter or select business owner"
              />
              <datalist id="business-owners">
                {businessOwnerSuggestions.map((owner, idx) => (
                  <option key={idx} value={owner} />
                ))}
              </datalist>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Expected Completion Date *</label>
              <input
                type="date"
                name="expected_completion_date"
                value={formData.expected_completion_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Actual Completion Date</label>
              <input
                type="date"
                name="actual_completion_date"
                value={formData.actual_completion_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <h3 style={{ margin: '32px 0 20px 0', fontSize: '16px', fontWeight: '600' }}>Project Details</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="">Select priority</option>
                {priorityOptions.map(opt => (
                  <option key={opt.id} value={opt.option_value}>{opt.option_value}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Risk Level</label>
              <select name="risk_level" value={formData.risk_level} onChange={handleChange}>
                <option value="">Select risk level</option>
                {riskOptions.map(opt => (
                  <option key={opt.id} value={opt.option_value}>{opt.option_value}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Technology Stack</label>
            <input
              type="text"
              name="technology_stack"
              value={formData.technology_stack}
              onChange={handleChange}
              placeholder="e.g., Python, TensorFlow, Azure ML"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Team Size</label>
              <input
                type="number"
                name="team_size"
                value={formData.team_size}
                onChange={handleChange}
                min="0"
                placeholder="Number of team members"
              />
            </div>

            <div className="form-group">
              <label>Budget Allocated (Rands)</label>
              <input
                type="number"
                name="budget_allocated"
                value={formData.budget_allocated}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Budget Spent (Rands)</label>
              <input
                type="number"
                name="budget_spent"
                value={formData.budget_spent}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <button
              type="button"
              onClick={() => navigate('/initiatives')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Initiative' : 'Create Initiative')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InitiativeForm;
