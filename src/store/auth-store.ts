import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Organization } from "@/types/database";

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user, isLoading: false }),

      setOrganization: (organization) => set({ organization }),

      setLoading: (isLoading) => set({ isLoading }),

      clearAuth: () =>
        set({
          user: null,
          organization: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: "propvault-auth",
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
      }),
    }
  )
);
