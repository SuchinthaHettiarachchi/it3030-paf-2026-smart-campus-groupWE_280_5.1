import axios from 'axios';

/**
 * Axios instance pre-configured for the Smart Campus backend.
 * In development, Vite proxies /api → http://localhost:8080
 * (see vite.config.js). In production, set VITE_API_URL.
 *
 * Chanuka's AuthContext will set the JWT token via:
 *   axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
 * or via the interceptor below.
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
});

// ── Request interceptor: attach JWT if present ──────────────
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 globally ───────────────
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Redirect to login — Chanuka's auth will handle this properly
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
