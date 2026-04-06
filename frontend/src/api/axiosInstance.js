import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — add auth headers for mock auth
axiosInstance.interceptors.request.use(
  (config) => {
    // For development: send mock user headers
    // TODO: Replace with real JWT token when Chanuka integrates auth
    const mockUserId = localStorage.getItem('mockUserId') || '00000000-0000-0000-0000-000000000001';
    const mockRoles = localStorage.getItem('mockRoles') || 'USER,ADMIN,TECHNICIAN';
    
    config.headers['X-Mock-User-Id'] = mockUserId;
    config.headers['X-Mock-User-Roles'] = mockRoles;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error(`API Error [${status}]:`, data?.message || data);
    } else {
      console.error('Network error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
