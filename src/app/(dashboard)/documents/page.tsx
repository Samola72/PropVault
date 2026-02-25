"use client";

import { FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function DocumentsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Documents"
        description="Leases, deeds, permits, and property documents"
      />
      <div className="bg-white rounded-2xl border border-gray-100 min-h-96">
        <EmptyState
          icon={FolderOpen}
          title="No documents yet"
          description="Upload property documents, leases, and inspection reports here."
        />
      </div>
    </div>
  );
}
