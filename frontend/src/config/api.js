const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Health
  HEALTH: `${API_BASE_URL}/api/health`,

  // Dashboard
  DASHBOARD_STATS: `${API_BASE_URL}/api/dashboard/stats`,
  MONTHLY_TRENDS: `${API_BASE_URL}/api/dashboard/monthly-trends`,

  // Initiatives
  INITIATIVES: `${API_BASE_URL}/api/initiatives`,
  INITIATIVE_BY_ID: (id) => `${API_BASE_URL}/api/initiatives/${id}`,

  // Metrics
  INITIATIVE_METRICS: (id) => `${API_BASE_URL}/api/initiatives/${id}/metrics`,
  INITIATIVE_METRIC_BY_PERIOD: (id, period) => `${API_BASE_URL}/api/initiatives/${id}/metrics/${period}`,

  // Field Options
  FIELD_OPTIONS: `${API_BASE_URL}/api/field-options`,
  FIELD_OPTION_BY_ID: (id) => `${API_BASE_URL}/api/field-options/${id}`,

  // Custom Metrics
  CUSTOM_METRICS: `${API_BASE_URL}/api/custom-metrics`,

  // Featured Solutions
  FEATURED_SOLUTIONS: `${API_BASE_URL}/api/featured-solutions`,

  // Suggestions
  PROCESS_OWNERS: `${API_BASE_URL}/api/suggestions/process-owners`,
  BUSINESS_OWNERS: `${API_BASE_URL}/api/suggestions/business-owners`,
};

export default API_BASE_URL;
