import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Sanitize baseURL: strip trailing /api if present to prevent /api/api double-prefix
// This handles cases where NEXT_PUBLIC_API_URL is set with or without /api suffix
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const baseURL = rawBaseUrl.replace(/\/api\/?$/, '');

// Create a singleton axios instance
const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    // Read from localStorage (Zustand persist)
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      if (state.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 Unauthorized & auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (!authStorage) throw new Error('No refresh token');

        const { state } = JSON.parse(authStorage);
        if (!state.refreshToken) throw new Error('No refresh token');

        // Request new tokens
        const { data } = await axios.post(`${api.defaults.baseURL}/api/auth/refresh`, {
          refreshToken: state.refreshToken,
        });

        // Update Zustand store
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g. refresh token expired) -> force logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
