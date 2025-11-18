import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api';
import type { AuthUser, AuthTokens, LoginRequest, SignupRequest } from '@commerce/types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (data: LoginRequest) => {
        const response = await api.post<{ user: AuthUser; tokens: AuthTokens }>('/auth/login', data);
        const { user, tokens } = response.data;

        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        set({ user, accessToken: tokens.accessToken, isAuthenticated: true });
      },

      signup: async (data: SignupRequest) => {
        const response = await api.post<{ user: AuthUser; tokens: AuthTokens }>('/auth/signup', data);
        const { user, tokens } = response.data;

        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        set({ user, accessToken: tokens.accessToken, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        try {
          const response = await api.get<AuthUser>('/auth/me');
          set({ user: response.data, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
