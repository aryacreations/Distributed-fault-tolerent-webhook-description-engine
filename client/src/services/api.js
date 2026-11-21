import axios from 'axios';

// Automatically detect production vs local backend URL
export const BACKEND_URL = 
  import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://distributed-fault-tolerent-webhook.onrender.com'
    : 'http://localhost:5000');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? 'https://distributed-fault-tolerent-webhook.onrender.com/api'
        : '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

export const dispatchWebhook = async (data) => {
  const response = await api.post('/webhooks/dispatch', data);
  return response.data;
};

export const fetchJobs = async (params = {}) => {
  const response = await api.get('/webhooks/jobs', { params });
  return response.data;
};

export const fetchJobDetails = async (jobId) => {
  const response = await api.get(`/webhooks/jobs/${jobId}`);
  return response.data;
};

export const retryWebhookJob = async (jobId) => {
  const response = await api.post(`/webhooks/jobs/${jobId}/retry`);
  return response.data;
};

export const fetchStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const resetMockReceiver = async () => {
  const response = await api.post('/mock-receiver/reset');
  return response.data;
};

export default api;
