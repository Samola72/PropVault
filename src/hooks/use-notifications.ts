"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "@/store/notification-store";
import toast from "react-hot-toast";

const BASE = "/api/notifications";

async function fetchNotifications(unreadOnly = false) {
  const query = unreadOnly ? "?unread=true" : "";
  const res = await fetch(`${BASE}${query}`);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return (await res.json()).data;
}

async function markRead(id: string) {
  const res = await fetch(BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to mark notification");
  return (await res.json()).data;
}

async function markAllRead() {
  const res = await fetch(BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "MARK_ALL_READ" }),
  });
  if (!res.ok) throw new Error("Failed to mark all read");
  return (await res.json()).data;
}

export function useNotifications(unreadOnly = false) {
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  return useQuery({
    queryKey: ["notifications", { unreadOnly }],
    queryFn: async () => {
      const data = await fetchNotifications(unreadOnly);
      setNotifications(data);
      return data;
    },
    refetchInterval: 30_000, // Poll every 30 seconds
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  return useMutation({
    mutationFn: markRead,
    onSuccess: (_, id) => {
      markAsRead(id);
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      markAllAsRead();
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });
}
