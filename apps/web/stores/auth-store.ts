"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAccessToken as setGlobalAccessToken } from "@/lib/api-client";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  avatar_url?: string | null;
  permissions?: string[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** Tracks whether Zustand has finished rehydrating from localStorage. */
  _hasHydrated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, accessToken) => {
        setGlobalAccessToken(accessToken);
        set({ user, accessToken, isAuthenticated: true, _hasHydrated: true });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      logout: () => {
        setGlobalAccessToken(null);
        set({ user: null, accessToken: null, isAuthenticated: false, _hasHydrated: true });
      },

      setHasHydrated: (value) => {
        set({ _hasHydrated: value });
      },
    }),
    {
      name: "axorks_auth_session",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setGlobalAccessToken(state.accessToken);
        }
        // Always mark hydration complete when rehydration finishes
        useAuthStore.getState().setHasHydrated(true);
      },
    }
  )
);
