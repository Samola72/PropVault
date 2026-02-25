"use client";

import { useState } from "react";
import Link from "next/link";
import { Wrench, Calendar, User } from "lucide-react";
import { useWorkOrders } from "@/hooks/use-work-orders";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableRowSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { WorkOrderStatus, WorkOrderPriority } from "@/types";

const STATUSES = ["", "OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CLOSED"];

export default function WorkOrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WorkOrderStatus | "">("");
  const [priority, setPriority] = useState<WorkOrderPriority | "">("");

  const { data, isLoading } = useWorkOrders({
    search,
    status: status || undefined,
    priority: priority || undefined,
  });
  const workOrders = data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Work Orders"
        description={`${data?.total ?? 0} total work orders`}
        actionLabel="New Work Order"
        actionHref="/work-orders/new"
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search work orders..." className="flex-1" />

        <select value={status} onChange={(e) => setStatus(e.target.value as WorkOrderStatus | "")}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING_PARTS", "COMPLETED", "CLOSED", "CANCELLED"].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>

        <select value={priority} onChange={(e) => setPriority(e.target.value as WorkOrderPriority | "")}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Priorities</option>
          {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <table className="w-full">
            <tbody>
              {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={6} />)}
            </tbody>
          </table>
        ) : workOrders.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No work orders found"
            description="Create a work order to start tracking maintenance requests."
            actionLabel="New Work Order"
            actionHref="/work-orders/new"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Title", "Property", "Category", "Priority", "Status", "Created"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {workOrders.map((wo: any) => (
                  <tr key={wo.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <Link href={`/work-orders/${wo.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition line-clamp-1">
                        {wo.title}
                      </Link>
                      {wo.assigned_to && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <User className="w-3 h-3" />{wo.service_provider?.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{wo.property?.name || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{wo.category.toLowerCase().replace("_", " ")}</td>
                    <td className="px-6 py-4"><PriorityBadge priority={wo.priority} /></td>
                    <td className="px-6 py-4"><StatusBadge status={wo.status} /></td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatRelativeTime(wo.created_at)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
