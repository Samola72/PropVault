"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { getSupabaseClient } from "@/lib/supabase/client";

export function useOrganization() {
  const { user, organization, setUser, setOrganization, setLoading, clearAuth } =
    useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    async function loadUserAndOrg() {
      try {
        setLoading(true);
        console.log("Loading user and org...");
        
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        console.log("Auth user:", authUser);
        console.log("Auth error:", authError);

        if (!authUser) {
          console.log("No auth user, clearing");
          clearAuth();
          setIsInitialized(true);
          setLoading(false);
          return;
        }

        // Load user profile from database
        const { data: userProfile, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", authUser.id)
          .single();

        console.log("User profile:", userProfile);
        console.log("User error:", userError);

        if (userError || !userProfile) {
          console.log("No user profile found - needs onboarding");
          setUser(null);
          setOrganization(null);
          setIsInitialized(true);
          setLoading(false);
          return;
        }

        setUser(userProfile);

        // Load organization
        if ((userProfile as any).organization_id) {
          const { data: org, error: orgError } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", (userProfile as any).organization_id)
            .single();

          console.log("Organization:", org);
          console.log("Org error:", orgError);

          if (!orgError && org) {
            setOrganization(org);
          }
        }
        
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        console.log("Setting initialized to true");
        setIsInitialized(true);
        setLoading(false);
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
