import axios from 'axios';

// Tạo axios instance với base URL của backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào headers nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API calls
export const registerDID = async (data: {
  qrData: string;
  privateKey: string;
}) => {
  return api.post('/auth/register', data);
};

export const loginDID = async (data: {
  address: string;
  message: string;
  signature: string;
  qrData: string;
}) => {
  return api.post('/auth/login', data);
};

export const getDIDInfo = async (address: string) => {
  return api.get(`/did/${address}`);
};

export const getLogs = async (params?: { limit?: number; offset?: number }) => {
  return api.get('/admin/logs', { params });
};

export default api;
