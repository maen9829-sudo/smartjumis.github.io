import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true, // Initially true while checking

      setTokens: (access, refresh) => 
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      logout: () => {
        const { refreshToken } = get();
        // Fire & forget logout to backend to clear refresh token
        if (refreshToken) api.post('/api/auth/logout', { refreshToken }).catch(() => {});
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });
          const { accessToken } = get();
          
          if (!accessToken) {
            set({ isAuthenticated: false, isLoading: false, user: null });
            return;
          }

          // Fetch fresh user profile
          const { data } = await api.get('/api/auth/me');
          set({ user: data, isAuthenticated: true, isLoading: false });
        } catch (error) {
          // If api.ts interceptor fails to refresh, it handles logout
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      // Only persist tokens, not isLoading or full user data (it can get stale)
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken 
      }),
    }
  )
);
