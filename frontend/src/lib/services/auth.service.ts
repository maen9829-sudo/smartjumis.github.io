import api from '../api';
import { useAuthStore } from '../../store/authStore';

export const AuthService = {
  // Login
  login: async (credentials: any) => {
    const { data } = await api.post('/api/auth/login', credentials);
    useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
    useAuthStore.getState().setUser(data.user);
    return data;
  },

  // Register
  register: async (userData: any) => {
    const { data } = await api.post('/api/auth/register', userData);
    useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
    useAuthStore.getState().setUser(data.user);
    return data;
  },

  // Google OAuth URL provider
  getGoogleAuthUrl: () => {
    return `${api.defaults.baseURL}/api/auth/google`;
  },

  // Logout (Calls backend to invalidate refresh token, then clears store)
  logout: async () => {
    useAuthStore.getState().logout();
  },

  // Fetch current user profile
  getMe: async () => {
    const { data } = await api.get('/api/auth/me');
    useAuthStore.getState().setUser(data);
    return data;
  },
};
