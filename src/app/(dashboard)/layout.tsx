"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/hooks/use-organization";
import { useUIStore } from "@/store/ui-store";
import { useRealtime } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useOrganization();
  const router = useRouter();
  const { sidebarCollapsed } = useUIStore();

  // Enable real-time subscriptions
  useRealtime();

  useEffect(() => {
    if (isInitialized && !user) router.push("/login");
  }, [isInitialized, user, router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading PropVault...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className={cn("flex flex-col flex-1 overflow-hidden transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
