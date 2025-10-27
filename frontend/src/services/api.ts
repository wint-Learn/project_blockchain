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
  
  // 🔍 DEBUG: Log request data
  if (config.url === '/auth/register') {
    console.log('🔍 AXIOS INTERCEPTOR: Request config.data =', config.data);
    console.log('🔍 AXIOS INTERCEPTOR: Has walletAddress?', !!config.data?.walletAddress);
    console.log('🔍 AXIOS INTERCEPTOR: Has signature?', !!config.data?.signature);
  }
  
  return config;
});

// API calls
// Auth APIs - MetaMask-based
export const registerWithMetaMask = async (data: {
  cccdNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  issueDate: string;
  phoneNumber: string;
  verificationToken?: string;
  walletAddress?: string; // CRITICAL: MetaMask wallet address
  signature?: string; // CRITICAL: Signature to recover public key
}) => {
  console.log('🔍 API: registerWithMetaMask called with data:', {
    ...data,
    signature: data.signature ? 'EXISTS (length: ' + data.signature.length + ')' : 'MISSING',
    hasWalletAddress: !!data.walletAddress,
    walletAddress: data.walletAddress || 'MISSING'
  });
  
  return api.post('/auth/register', data);
};

export const getLoginMessage = async (address: string) => {
  return api.post('/auth/get-message', { address });
};

export const loginWithMetaMask = async (data: {
  address: string;
  signature: string;
  message: string; // Message that was signed
}) => {
  return api.post('/auth/login', data);
};

// Legacy APIs (for backward compatibility)
export const registerDID = async (data: {
  qrData: string;
  privateKey: string;
  verificationToken?: string;
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

// Verification APIs
export const requestOTP = async (data: {
  cccdNumber: string;
  phoneNumber: string;
}) => {
  return api.post('/verify/request-otp', data);
};

export const verifyOTP = async (data: {
  cccdNumber: string;
  otp: string;
}) => {
  return api.post('/verify/confirm-otp', data);
};

export const checkVerificationStatus = async (cccdNumber: string) => {
  return api.get(`/verify/status/${cccdNumber}`);
};

// Admin APIs
export const adminLogin = async (data: {
  username: string;
  password: string;
}) => {
  return api.post('/admin/login', data);
};

export const getDashboardStats = async () => {
  return api.get('/admin/stats');
};

export const importCCCDBatch = async (csvData: string) => {
  return api.post('/admin/cccd/import', { csvData });
};

export const getPreVerifiedList = async (params?: {
  status?: string;
  phone?: string;
  limit?: number;
  offset?: number;
}) => {
  return api.get('/admin/cccd/list', { params });
};

export const blacklistCCCD = async (id: number, reason: string) => {
  return api.put(`/admin/cccd/${id}/blacklist`, { reason });
};

export const exportLogs = async (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  return api.get('/admin/logs/export', { 
    params,
    responseType: 'blob' // For CSV download
  });
};

// Service Management APIs (Admin)
export const getServiceRequests = async (params?: {
  status?: string;
  serviceId?: number;
  limit?: number;
  offset?: number;
}) => {
  return api.get('/services/admin/requests', { params });
};

export const approveServiceRequest = async (requestId: number, adminNotes?: string) => {
  return api.put(`/services/admin/requests/${requestId}/approve`, { adminNotes });
};

export const rejectServiceRequest = async (requestId: number, reason: string) => {
  return api.put(`/services/admin/requests/${requestId}/reject`, { reason });
};

export const createService = async (data: {
  name: string;
  description: string;
  category: string;
  requiredDocuments?: string;
}) => {
  return api.post('/services/admin/create', data);
};

// Service APIs (User)
export const listServices = async (category?: string) => {
  return api.get('/services', { params: { category } });
};

export const requestService = async (serviceId: number, data: {
  userAddress: string;
  requestData: any;
}) => {
  return api.post(`/services/${serviceId}/request`, data);
};

export const getMyServices = async (userAddress: string) => {
  return api.get('/services/my-services', { params: { userAddress } });
};

export default api;
