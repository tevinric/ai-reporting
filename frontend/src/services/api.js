import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard
export const getDashboardStats = () => api.get(API_ENDPOINTS.DASHBOARD_STATS);
export const getMonthlyTrends = () => api.get(API_ENDPOINTS.MONTHLY_TRENDS);

// Initiatives
export const getInitiatives = (params) => api.get(API_ENDPOINTS.INITIATIVES, { params });
export const getInitiativeById = (id) => api.get(API_ENDPOINTS.INITIATIVE_BY_ID(id));
export const createInitiative = (data) => api.post(API_ENDPOINTS.INITIATIVES, data);
export const updateInitiative = (id, data) => api.put(API_ENDPOINTS.INITIATIVE_BY_ID(id), data);
export const deleteInitiative = (id) => api.delete(API_ENDPOINTS.INITIATIVE_BY_ID(id));
export const pinInitiative = (id) => api.post(`${API_ENDPOINTS.INITIATIVE_BY_ID(id)}/pin`);
export const unpinInitiative = (id) => api.post(`${API_ENDPOINTS.INITIATIVE_BY_ID(id)}/unpin`);

// Metrics
export const getInitiativeMetrics = (id) => api.get(API_ENDPOINTS.INITIATIVE_METRICS(id));
export const getInitiativeMetricByPeriod = (id, period) => api.get(API_ENDPOINTS.INITIATIVE_METRIC_BY_PERIOD(id, period));
export const saveInitiativeMetric = (id, data) => api.post(API_ENDPOINTS.INITIATIVE_METRICS(id), data);

// Field Options
export const getFieldOptions = (fieldName) => {
  const params = fieldName ? { field_name: fieldName } : {};
  return api.get(API_ENDPOINTS.FIELD_OPTIONS, { params });
};
export const createFieldOption = (data) => api.post(API_ENDPOINTS.FIELD_OPTIONS, data);
export const updateFieldOption = (id, data) => api.put(API_ENDPOINTS.FIELD_OPTION_BY_ID(id), data);
export const deleteFieldOption = (id) => api.delete(API_ENDPOINTS.FIELD_OPTION_BY_ID(id));

// Custom Metrics
export const getCustomMetrics = () => api.get(API_ENDPOINTS.CUSTOM_METRICS);
export const createCustomMetric = (data) => api.post(API_ENDPOINTS.CUSTOM_METRICS, data);

// Featured Solutions
export const getFeaturedSolutions = (month) => {
  const params = month ? { month } : {};
  return api.get(API_ENDPOINTS.FEATURED_SOLUTIONS, { params });
};

// Suggestions
export const getProcessOwnerSuggestions = () => api.get(API_ENDPOINTS.PROCESS_OWNERS);
export const getBusinessOwnerSuggestions = () => api.get(API_ENDPOINTS.BUSINESS_OWNERS);

// Risks
export const getInitiativeRisks = (id) => api.get(API_ENDPOINTS.INITIATIVE_RISKS(id));
export const createRisk = (id, data) => api.post(API_ENDPOINTS.INITIATIVE_RISKS(id), data);
export const updateRisk = (id, data) => api.put(API_ENDPOINTS.RISK_BY_ID(id), data);
export const deleteRisk = (id) => api.delete(API_ENDPOINTS.RISK_BY_ID(id));

// Progress Updates
export const getProgressUpdates = (id, page = 1, pageSize = 10) => {
  return api.get(API_ENDPOINTS.PROGRESS_UPDATES(id), { params: { page, page_size: pageSize } });
};
export const getProgressUpdateById = (id) => api.get(API_ENDPOINTS.PROGRESS_UPDATE_BY_ID(id));
export const createProgressUpdate = (initiativeId, data) => api.post(API_ENDPOINTS.PROGRESS_UPDATES(initiativeId), data);
export const updateProgressUpdate = (id, data) => api.put(API_ENDPOINTS.PROGRESS_UPDATE_BY_ID(id), data);
export const deleteProgressUpdate = (id) => api.delete(API_ENDPOINTS.PROGRESS_UPDATE_BY_ID(id));

// ROI Assistant
export const roiAssistant = (data) => api.post(API_ENDPOINTS.ROI_ASSISTANT, data);

// Complexity Analyzer
export const analyzeComplexity = (data) => api.post(API_ENDPOINTS.COMPLEXITY_ANALYZER, data);
export const getComplexityConversations = () => api.get(API_ENDPOINTS.COMPLEXITY_CONVERSATIONS);
export const getComplexityConversation = (id) => api.get(API_ENDPOINTS.COMPLEXITY_CONVERSATION_BY_ID(id));
export const getComplexityMatrixData = () => api.get(API_ENDPOINTS.COMPLEXITY_MATRIX_DATA);

export default {
  get: api.get.bind(api),
  post: api.post.bind(api),
  put: api.put.bind(api),
  delete: api.delete.bind(api),
  roiAssistant,
  analyzeComplexity,
  getComplexityConversations,
  getComplexityConversation,
  getComplexityMatrixData,
};
