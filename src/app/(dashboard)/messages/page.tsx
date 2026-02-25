"use client";

import { MessageSquare, Send } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default function MessagesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 text-sm mt-1">Communicate with tenants and service providers</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 min-h-96">
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Messages between you, tenants, and service providers will appear here."
        />
      </div>
    </div>
  );
}
