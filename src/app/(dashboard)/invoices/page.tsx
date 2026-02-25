"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Calendar, DollarSign } from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableRowSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceStatus } from "@/types";

export default function InvoicesPage() {
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const { data, isLoading } = useInvoices({ status: status || undefined, overdue: overdueOnly });
  const invoices = data?.data || [];

  const totalPending = invoices
    .filter((i: any) => ["SENT", "PARTIAL"].includes(i.status))
    .reduce((sum: number, i: any) => sum + i.balance, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Invoices"
        description={`${data?.total ?? 0} invoices total`}
        actionLabel="Create Invoice"
        actionHref="/invoices/new"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Invoices", value: data?.total ?? 0, color: "text-gray-900" },
          { label: "Pending Amount", value: formatCurrency(totalPending), color: "text-blue-600" },
          { label: "Overdue", value: invoices.filter((i: any) => i.status === "OVERDUE").length, color: "text-red-600" },
          { label: "Paid This Month", value: invoices.filter((i: any) => i.status === "PAID").length, color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus | "")}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {["DRAFT", "SENT", "PAID", "OVERDUE", "PARTIAL", "CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          Overdue only
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <table className="w-full"><tbody>{[...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={6} />)}</tbody></table>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices found"
            description="Create invoices to track payments and billing."
            actionLabel="Create Invoice"
            actionHref="/invoices/new"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Invoice #", "Type", "Property", "Amount", "Due Date", "Status", ""].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-sm font-medium text-blue-600 hover:text-blue-700">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{inv.type.toLowerCase()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{inv.property?.name || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(inv.total_amount)}</div>
                      {inv.balance > 0 && inv.status !== "PAID" && (
                        <div className="text-xs text-gray-400">Balance: {formatCurrency(inv.balance)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />{formatDate(inv.due_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                    <td className="px-6 py-4">
                      <Link href={`/invoices/${inv.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View →</Link>
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
