"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@/types/database";

export function useOrganization() {
  const { user, organization, setUser, setOrganization, setLoading, clearAuth } =
    useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    async function loadUserAndOrg() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          clearAuth();
          setIsInitialized(true);
          return;
        }

        // Load user profile
        const { data: userProfile } = await supabase
          .from("users")
          .select("*, organization:organizations(*)")
          .eq("auth_user_id", authUser.id)
          .single();

        if (userProfile) {
          const typedProfile = userProfile as any;
          setUser(typedProfile as User);
          if (typedProfile.organization) {
            setOrganization(typedProfile.organization);
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
        clearAuth();
      } finally {
        setIsInitialized(true);
      }
    }

    loadUserAndOrg();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        clearAuth();
      } else if (event === "SIGNED_IN") {
        await loadUserAndOrg();
      }
    });

    return () => subscription.unsubscribe();
  }, [clearAuth, setLoading, setOrganization, setUser]);

  return { user, organization, isInitialized };
}

export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

export function useCurrentOrg() {
  return useAuthStore((state) => state.organization);
}

export function useIsAuthenticated() {
  return useAuthStore((state) => state.isAuthenticated);
}
