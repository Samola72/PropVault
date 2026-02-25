"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Wrench, Users, FileText, TrendingUp, PieChart } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { StatCardSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

async function fetchAnalytics() {
  const res = await fetch("/api/analytics");
  if (!res.ok) throw new Error("Failed");
  return (await res.json()).data;
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: fetchAnalytics });

  const propertyPieData = data ? [
    { name: "Available", value: data.properties.available },
    { name: "Occupied", value: data.properties.occupied },
    { name: "Maintenance", value: data.properties.maintenance },
  ] : [];

  const woStatusData = data ? [
    { name: "Open", value: data.workOrders.open },
    { name: "In Progress", value: data.workOrders.inProgress },
    { name: "Completed", value: data.workOrders.completed },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your portfolio performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading ? [1,2,3,4].map(i => <StatCardSkeleton key={i} />) : (
          <>
            <StatCard title="Total Properties" value={data?.properties.total ?? 0} icon={Building2} color="blue" />
            <StatCard title="Occupancy Rate" value={`${data?.properties.occupancyRate ?? 0}%`} icon={TrendingUp} color="green" />
            <StatCard title="Active Tenants" value={data?.tenants.active ?? 0} icon={Users} color="purple" />
            <StatCard title="Monthly Revenue" value={formatCurrency(data?.tenants.monthlyRentTotal ?? 0)} icon={FileText} color="yellow" />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data?.monthlyRevenue || []}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [formatCurrency(typeof v === 'number' ? v : 0), "Revenue"]} contentStyle={{ borderRadius: "12px" }} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Property Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <RechartsPie>
              <Pie data={propertyPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {propertyPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Work Orders by Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={woStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px" }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Financial Summary</h2>
          <div className="space-y-4">
            {[
              { label: "Monthly Rent Total", value: formatCurrency(data?.tenants.monthlyRentTotal ?? 0), color: "text-green-600" },
              { label: "Pending Invoices", value: formatCurrency(data?.finance.pendingAmount ?? 0), color: "text-blue-600" },
              { label: "Overdue Amount", value: formatCurrency(data?.finance.overdueAmount ?? 0), color: "text-red-600" },
              { label: "Collection Rate", value: `${data?.finance.collectionRate ?? 0}%`, color: "text-purple-600" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
