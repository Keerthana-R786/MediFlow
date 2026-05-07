import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      patientProfile: null,
      setAuth: (user, accessToken, patientProfile = null) =>
        set({ user, accessToken, patientProfile }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null, patientProfile: null }),
    }),
    { name: 'mediflow-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken }) }
  )
);
