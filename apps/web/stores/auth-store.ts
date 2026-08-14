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
  /** Tracks whether Zustand has finished rehydrating from localStorage.
   *  The app layout MUST wait for this before checking isAuthenticated,
   *  otherwise a page refresh will always redirect to /login. */
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
        set({ user, accessToken, isAuthenticated: true });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      logout: () => {
        setGlobalAccessToken(null);
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      setHasHydrated: (value) => {
        set({ _hasHydrated: value });
      },
    }),
    {
      name: "axorks_auth_session",
      // partialize: exclude _hasHydrated from being persisted — it's runtime-only
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        // Called after Zustand finishes restoring from localStorage.
        // Sync the in-memory access token for the API client.
        if (state?.accessToken) {
          setGlobalAccessToken(state.accessToken);
        }
        // Mark hydration as complete so the app layout can proceed.
        useAuthStore.getState().setHasHydrated(true);
      },
    }
  )
);
