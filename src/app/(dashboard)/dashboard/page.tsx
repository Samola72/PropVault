"use client";

import { Building2, Wrench, Users, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";

export default function DashboardPage() {
  // Mock stats - would come from API in production
  const stats = [
    { title: "Total Properties", value: "0", icon: Building2, change: 0 },
    { title: "Active Work Orders", value: "0", icon: Wrench, change: 0 },
    { title: "Total Tenants", value: "0", icon: Users, change: 0 },
    { title: "Pending Invoices", value: "$0", icon: FileText, change: 0 },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome to PropVault - Your complete property management solution"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <p className="text-gray-500 text-sm">No recent activity yet</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <a href="/properties" className="block p-3 rounded-lg hover:bg-gray-50 transition">
              <p className="font-medium text-gray-900">Add Property</p>
              <p className="text-sm text-gray-500">Start managing a new property</p>
            </a>
            <a href="/tenants" className="block p-3 rounded-lg hover:bg-gray-50 transition">
              <p className="font-medium text-gray-900">Add Tenant</p>
              <p className="text-sm text-gray-500">Register a new tenant</p>
            </a>
            <a href="/work-orders" className="block p-3 rounded-lg hover:bg-gray-50 transition">
              <p className="font-medium text-gray-900">Create Work Order</p>
              <p className="text-sm text-gray-500">Request maintenance or repairs</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
