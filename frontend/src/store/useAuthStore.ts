import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  address: string;
  cccdHash?: string;
  anomalyScore?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  privateKey: string | null; // CHỈ DÙNG CHO DEMO - KHÔNG LƯU TRONG PRODUCTION
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setPrivateKey: (key: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      privateKey: null,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        if (token) {
          localStorage.setItem('authToken', token);
        } else {
          localStorage.removeItem('authToken');
        }
        set({ token });
      },
      setPrivateKey: (privateKey) => set({ privateKey }),
      logout: () => {
        localStorage.removeItem('authToken');
        set({ user: null, token: null, privateKey: null });
      },
    }),
    {
      name: 'auth-storage', // key trong localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        // Không persist privateKey để tăng bảo mật
      }),
    }
  )
);
