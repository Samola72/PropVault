"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useNotificationStore } from "@/store/notification-store";
import { useCurrentUser } from "./use-organization";
import type { AppNotification, WorkOrder } from "@/types";

export function useRealtimeNotifications() {
  const user = useCurrentUser();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const qc = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as AppNotification;
          addNotification(notification);
          qc.invalidateQueries({ queryKey: ["notifications"] });

          // Browser notification if permitted
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/favicon.ico",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, addNotification, qc]);
}

export function useRealtimeWorkOrders(organizationId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!organizationId) return;

    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`work-orders:${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "work_orders",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["work-orders"] });
          qc.invalidateQueries({ queryKey: ["analytics"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "work_order_updates",
        },
        (payload) => {
          const update = payload.new as { work_order_id: string };
          qc.invalidateQueries({ queryKey: ["work-orders", update.work_order_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, qc]);
}

export function useRealtimeMessages(userId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`messages:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["messages"] });
          qc.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}

// Master hook — use this in the dashboard layout
export function useRealtime() {
  const user = useCurrentUser();
  useRealtimeNotifications();
  useRealtimeWorkOrders(user?.organization_id);
  useRealtimeMessages(user?.id);
}
