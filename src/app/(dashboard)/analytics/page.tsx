"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, TrendingUp, Building2, Users, Wrench,
  AlertTriangle, BarChart2, RefreshCw,
} from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";
import { ChartCard } from "@/components/analytics/chart-card";
import { StatTile } from "@/components/analytics/stat-tile";
import { ExportMenu } from "@/components/analytics/export-menu";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/utils";

const BRAND_COLORS = {
  blue: "#2563EB", green: "#16A34A", amber: "#D97706",
  red: "#DC2626", purple: "#7C3AED", sky: "#0EA5E9", teal: "#0D9488",
};

const PIE_COLORS = ["#2563EB", "#7C3AED", "#0EA5E9", "#16A34A", "#D97706", "#DC2626", "#0D9488", "#F59E0B"];

function ChartTooltip({ active, payload, label, currency = false }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium text-gray-900">
            {currency ? formatCurrency(p.value) : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

const RANGE_OPTIONS = [
  { label: "3 Months", value: 3 },
  { label: "6 Months", value: 6 },
  { label: "12 Months", value: 12 },
  { label: "24 Months", value: 24 },
];

export default function AnalyticsPage() {
  const [months, setMonths] = useState(12);
  const { data, isLoading, refetch } = useAnalytics(months);
  const s = data?.summary;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <PageHeader title="Analytics" description="Portfolio performance overview" />
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMonths(opt.value)}
                className={`px-3 py-2 text-sm font-medium transition ${
                  months === opt.value ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <ExportMenu />
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total Revenue Collected" value={s ? formatCurrency(s.totalRevenue) : "—"}
          subtext={`${months}-month period`} icon={DollarSign} color="green" />
        <StatTile label="Outstanding Balance" value={s ? formatCurrency(s.totalOutstanding) : "—"}
          subtext={`${s?.collectionRate ?? 0}% collection rate`} icon={TrendingUp}
          color={s?.collectionRate >= 90 ? "green" : s?.collectionRate >= 70 ? "amber" : "red"} />
        <StatTile label="Current Occupancy" value={s ? `${s.currentOccupancy}%` : "—"}
          subtext={`${s?.totalProperties ?? 0} total properties`} icon={Building2} color="blue" />
        <StatTile label="Active Tenants" value={s?.activeTenants ?? "—"}
          subtext="Currently leasing" icon={Users} color="purple" />
        <StatTile label="Avg Monthly Revenue" value={s ? formatCurrency(s.avgMonthlyRevenue) : "—"}
          subtext="Collected per month" icon={BarChart2} color="blue" />
        <StatTile label="Maintenance Costs" value={s ? formatCurrency(s.totalMaintenanceCost) : "—"}
          subtext={`${months}-month period`} icon={Wrench} color="amber" />
        <StatTile label="Open Work Orders" value={s?.openWorkOrders ?? "—"}
          subtext="Pending resolution" icon={AlertTriangle}
          color={s?.openWorkOrders > 10 ? "red" : "amber"} />
        <StatTile label="Total Properties" value={s?.totalProperties ?? "—"}
          subtext={`${s?.currentOccupancy ?? 0}% occupied`} icon={Building2} color="gray" />
      </div>

      {/* Row 1: Revenue + Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Revenue" subtitle="Collected vs outstanding rent" tall>
          {data?.revenueByMonth ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueByMonth} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <defs>
                  <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_COLORS.blue} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={BRAND_COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOutstanding" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_COLORS.amber} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={BRAND_COLORS.amber} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip currency />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke={BRAND_COLORS.blue} fill="url(#gradCollected)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="outstanding" name="Outstanding" stroke={BRAND_COLORS.amber} fill="url(#gradOutstanding)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-300 text-sm">Loading…</div>
          )}
        </ChartCard>

        <ChartCard title="Occupancy Rate" subtitle="Percentage of units occupied each month" tall>
          {data?.occupancyByMonth ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.occupancyByMonth} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <defs>
                  <linearGradient id="gradOccupancy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_COLORS.green} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={BRAND_COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} formatter={(v: any) => `${v}%`} />
                <Area type="monotone" dataKey="rate" name="Occupancy %" stroke={BRAND_COLORS.green} fill="url(#gradOccupancy)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-300 text-sm">Loading…</div>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Work Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Work Orders by Category" subtitle="Issue types in the selected period">
          {data?.workOrdersByCategory?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.workOrdersByCategory} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={78} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Work Orders" fill={BRAND_COLORS.purple} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-300 text-sm">No data</div>
          )}
        </ChartCard>

        <ChartCard title="Work Order Status Breakdown" subtitle="Current distribution by status">
          {data?.workOrdersByStatus?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.workOrdersByStatus} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={3} dataKey="count" nameKey="status"
                  label={(props: any) => `${props.status} ${((props.percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {data.workOrdersByStatus.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: any) => [value, name]} contentStyle={{ borderRadius: 12, border: "1px solid #F3F4F6", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-300 text-sm">No data</div>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Tenant Activity */}
      <ChartCard title="Tenant Activity" subtitle="New tenants vs departures each month">
        {data?.tenantActivityByMonth ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.tenantActivityByMonth} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="new" name="New Tenants" fill={BRAND_COLORS.blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="departed" name="Departed" fill={BRAND_COLORS.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-300 text-sm">Loading…</div>
        )}
      </ChartCard>

      {/* Row 4: Property Performance Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50">
          <h3 className="text-base font-semibold text-gray-900">Property Performance</h3>
          <p className="text-sm text-gray-500 mt-0.5">Revenue, maintenance costs, and collection rates per property</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                <th className="text-left px-6 py-3">Property</th>
                <th className="text-right px-4 py-3">Monthly Rent</th>
                <th className="text-right px-4 py-3">Total Billed</th>
                <th className="text-right px-4 py-3">Collected</th>
                <th className="text-right px-4 py-3">Outstanding</th>
                <th className="text-right px-4 py-3">Maintenance</th>
                <th className="text-right px-4 py-3">Collection Rate</th>
                <th className="text-right px-4 py-3">Tenants</th>
                <th className="text-right px-4 py-3">Open WOs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.propertyPerformance || []).map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-medium text-gray-900">{p.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-700">{formatCurrency(p.monthlyRent)}</td>
                  <td className="px-4 py-4 text-right text-gray-700">{formatCurrency(p.totalBilled)}</td>
                  <td className="px-4 py-4 text-right font-medium text-green-700">{formatCurrency(p.totalCollected)}</td>
                  <td className="px-4 py-4 text-right text-amber-700">{formatCurrency(p.totalOutstanding)}</td>
                  <td className="px-4 py-4 text-right text-red-700">{formatCurrency(p.maintenanceCost)}</td>
                  <td className="px-4 py-4 text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      p.collectionRate >= 90 ? "bg-green-100 text-green-700" :
                      p.collectionRate >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    }`}>
                      {p.collectionRate}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-700">{p.tenantCount}</td>
                  <td className="px-4 py-4 text-right">
                    {p.openWOs > 0 ? (
                      <span className="text-amber-600 font-semibold">{p.openWOs}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
              {!data?.propertyPerformance?.length && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No property data available for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Footer */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Export Your Data</h4>
            <p className="text-xs text-blue-600 mt-0.5">Download CSV reports for invoices, work orders, and properties</p>
          </div>
          <ExportMenu />
        </div>
      </div>
    </div>
  );
}
