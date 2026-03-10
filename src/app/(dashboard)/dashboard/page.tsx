"use client";

import Link from "next/link";
import { Building2, Wrench, Users, FileText, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { Skeleton } from "@/components/shared/loading-skeleton";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats();
  const stats = data?.stats;
  const recentActivity = data?.recentActivity || [];

  const statCards = [
    { 
      title: "Total Properties", 
      value: stats?.totalProperties?.toString() || "0", 
      icon: Building2, 
      change: stats?.propertiesChange || 0 
    },
    { 
      title: "Active Work Orders", 
      value: stats?.activeWorkOrders?.toString() || "0", 
      icon: Wrench, 
      change: stats?.workOrdersChange || 0 
    },
    { 
      title: "Total Tenants", 
      value: stats?.totalTenants?.toString() || "0", 
      icon: Users, 
      change: stats?.tenantsChange || 0 
    },
    { 
      title: "Pending Invoices", 
      value: formatCurrency(stats?.pendingInvoices || 0), 
      icon: FileText, 
      change: stats?.pendingInvoicesChange || 0 
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Welcome to PropVault - Your complete property management solution"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No recent activity yet</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 8).map((activity: any) => (
                <Link
                  key={`${activity.type}-${activity.id}`}
                  href={`/${activity.type === "work_order" ? "work-orders" : "invoices"}/${activity.id}`}
                  className="block p-3 rounded-xl hover:bg-gray-50 transition border border-gray-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {activity.type === "work_order" ? (
                          <Wrench className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        )}
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {activity.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.type === "work_order" && activity.priority && (
                          <PriorityBadge priority={activity.priority} />
                        )}
                        <StatusBadge status={activity.status} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">{formatRelativeTime(activity.created_at)}</p>
                      {activity.amount && (
                        <p className="text-sm font-medium text-gray-700 mt-1">{formatCurrency(activity.amount)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <Link href="/properties/new" className="block p-4 rounded-xl hover:bg-gray-50 transition border border-gray-100 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add Property</p>
                  <p className="text-sm text-gray-500">Start managing a new property</p>
                </div>
              </div>
            </Link>
            <Link href="/tenants" className="block p-4 rounded-xl hover:bg-gray-50 transition border border-gray-100 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center transition">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add Tenant</p>
                  <p className="text-sm text-gray-500">Register a new tenant</p>
                </div>
              </div>
            </Link>
            <Link href="/work-orders/new" className="block p-4 rounded-xl hover:bg-gray-50 transition border border-gray-100 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center transition">
                  <Wrench className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create Work Order</p>
                  <p className="text-sm text-gray-500">Request maintenance or repairs</p>
                </div>
              </div>
            </Link>
            <Link href="/invoices/new" className="block p-4 rounded-xl hover:bg-gray-50 transition border border-gray-100 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create Invoice</p>
                  <p className="text-sm text-gray-500">Generate a new invoice</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
