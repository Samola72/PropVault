"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Phone, Mail, Calendar, Building2 } from "lucide-react";
import { useTenants } from "@/hooks/use-tenants";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableRowSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate, formatCurrency, generateInitials } from "@/lib/utils";

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useTenants({ search, status: status || undefined });
  const tenants = data?.data || [];

  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tenants"
        description={`${data?.total ?? 0} tenants total`}
        actionLabel="Add Tenant"
        actionHref="/tenants/new"
      />

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, phone..." className="flex-1" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {["ACTIVE", "INACTIVE", "EVICTION", "PENDING"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <table className="w-full"><tbody>{[...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={6} />)}</tbody></table>
        ) : tenants.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No tenants found"
            description="Add your first tenant to start managing occupancies."
            actionLabel="Add Tenant"
            actionHref="/tenants/new"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Tenant", "Property", "Rent", "Lease Period", "Status", ""].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tenants.map((t: any) => {
                  const leaseEnd = new Date(t.lease_end);
                  const expiringSoon = leaseEnd <= thirtyDays && leaseEnd >= today;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                            {generateInitials(t.full_name)}
                          </div>
                          <div>
                            <Link href={`/tenants/${t.id}`} className="font-medium text-gray-900 hover:text-blue-600 text-sm">{t.full_name}</Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{t.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                          {t.property?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(t.monthly_rent)}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">
                          <div>{formatDate(t.lease_start)} →</div>
                          <div className={expiringSoon ? "text-orange-600 font-medium" : ""}>{formatDate(t.lease_end)}</div>
                          {expiringSoon && <div className="text-orange-500 text-[10px] font-medium mt-0.5">⚠ Expiring soon</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                      <td className="px-6 py-4">
                        <Link href={`/tenants/${t.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
