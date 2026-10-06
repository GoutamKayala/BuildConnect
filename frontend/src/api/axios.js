import axios from 'axios';

export const formatBaseUrl = (rawUrl) => {
  if (!rawUrl) return '/api';
  let url = rawUrl.trim();
  if (url.startsWith('/')) return url;
  if (!/^https?:\/\//i.test(url)) {
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
    url = `${isLocal ? 'http://' : 'https://'}${url}`;
  }
  return url.replace(/\/+$/, '');
};

const API_BASE = formatBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post(
          `${API_BASE}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );
        if (res.data?.accessToken) {
          localStorage.setItem('accessToken', res.data.accessToken);
          if (res.data.refreshToken) {
            localStorage.setItem('refreshToken', res.data.refreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export { API_BASE };
export default api;
