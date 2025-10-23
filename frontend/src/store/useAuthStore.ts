import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CCCDInfo } from '../utils/qr-parser';

interface User {
  address: string;
  cccdHash?: string;
  anomalyScore?: number;
  cccdInfo?: CCCDInfo; // Thông tin CCCD parsed (chỉ lưu trong session)
}

interface AuthState {
  user: User | null;
  token: string | null;
  privateKey: string | null; // CHỈ DÙNG CHO DEMO - KHÔNG LƯU TRONG PRODUCTION
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setPrivateKey: (key: string | null) => void;
  setCCCDInfo: (cccdInfo: CCCDInfo | null) => void; // Setter cho CCCD info
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
      setCCCDInfo: (cccdInfo) =>
        set((state) => ({
          user: state.user ? { ...state.user, cccdInfo: cccdInfo || undefined } : null,
        })),
      logout: () => {
        localStorage.removeItem('authToken');
        set({ user: null, token: null, privateKey: null });
      },
    }),
    {
      name: 'auth-storage', // key trong localStorage
      partialize: (state) => ({
        user: state.user ? {
          address: state.user.address,
          cccdHash: state.user.cccdHash,
          anomalyScore: state.user.anomalyScore,
          // KHÔNG persist cccdInfo để tăng bảo mật
        } : null,
        token: state.token,
        // Không persist privateKey để tăng bảo mật
      }),
    }
  )
);
