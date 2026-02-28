import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  type: string;
  is_read: boolean;
  thread_id: string | null;
  created_at: string;
  sender?: { id: string; full_name: string; email: string; avatar_url?: string };
  recipient?: { id: string; full_name: string; email: string };
}

async function fetchMessages(folder: "inbox" | "sent" | "all" = "inbox") {
  const res = await fetch(`/api/messages?folder=${folder}&limit=50`);
  if (!res.ok) throw new Error("Failed to load messages");
  return (await res.json()).data;
}

async function fetchThread(threadId: string) {
  const res = await fetch(`/api/messages?thread_id=${threadId}&limit=50`);
  if (!res.ok) throw new Error("Failed to load thread");
  return (await res.json()).data;
}

async function sendMessage(data: {
  recipient_id: string;
  subject: string;
  body: string;
  thread_id?: string;
}) {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return (await res.json()).data;
}

async function markAsRead(messageId: string) {
  const res = await fetch("/api/messages/read", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message_id: messageId }),
  });
  if (!res.ok) throw new Error("Failed to mark as read");
  return (await res.json()).data;
}

export function useMessages(folder: "inbox" | "sent" | "all" = "inbox") {
  return useQuery({
    queryKey: ["messages", folder],
    queryFn: () => fetchMessages(folder),
    refetchInterval: 30_000, // Poll every 30s
  });
}

export function useThread(threadId: string | null) {
  return useQuery({
    queryKey: ["messages", "thread", threadId],
    queryFn: () => fetchThread(threadId!),
    enabled: !!threadId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Message sent");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

// Fetch users for recipient dropdown
export function useOrgUsers() {
  return useQuery({
    queryKey: ["org-users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) return { data: [] };
      return (await res.json()).data;
    },
  });
}
