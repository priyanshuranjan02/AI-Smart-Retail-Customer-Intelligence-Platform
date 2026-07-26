import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://ai-smart-retail-customer-intelligence.onrender.com';
const API_KEY = 'smart-retail-secret-key-2026';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
  },
});

export const api = {
  // Dashboard & Analytics
  getDashboardStats: async () => {
    const res = await apiClient.get('/dashboard/stats');
    return res.data;
  },

  getVisits: async (limit = 20) => {
    const res = await apiClient.get(`/dashboard/visits?limit=${limit}`);
    return res.data;
  },

  getReviews: async (limit = 20) => {
    const res = await apiClient.get(`/dashboard/reviews?limit=${limit}`);
    return res.data;
  },

  getLogs: async (limit = 50) => {
    const res = await apiClient.get(`/dashboard/logs?limit=${limit}`);
    return res.data;
  },

  // Vision Endpoints
  recognizeFace: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    const res = await apiClient.post('/recognize-face', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  registerCustomer: async (customerCode, name, imageFile) => {
    const formData = new FormData();
    formData.append('customer_code', customerCode);
    formData.append('name', name);
    formData.append('file', imageFile);
    const res = await apiClient.post('/register-customer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },


  classifyProduct: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    const res = await apiClient.post('/classify-product', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // NLP & Sentiment
  analyzeSentiment: async (text) => {
    const res = await apiClient.post('/analyze-sentiment', { text });
    return res.data;
  },

  // Chatbot
  sendChatMessage: async (message) => {
    const res = await apiClient.post('/chatbot', { message });
    return res.data;
  },
};
