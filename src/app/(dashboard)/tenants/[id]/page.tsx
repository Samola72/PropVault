"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Phone, Mail, Building2, Calendar, DollarSign,
  Edit, Trash2, FileText, Wrench, AlertCircle
} from "lucide-react";
import { useTenant, useDeleteTenant } from "@/hooks/use-tenants";
import { DetailHeader } from "@/components/shared/detail-header";
import { DetailTabs } from "@/components/shared/detail-tabs";
import { InfoCard, InfoRow } from "@/components/shared/info-row";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";

function generateInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: tenant, isLoading } = useTenant(id);
  const deleteTenant = useDeleteTenant();

  async function handleDelete() {
    await deleteTenant.mutateAsync(id);
    router.push(ROUTES.TENANTS);
  }

  if (isLoading) {
    return <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>;
  }

  if (!tenant) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Tenant not found</p>
        <Link href={ROUTES.TENANTS} className="text-blue-600 text-sm hover:underline mt-2 inline-block">Back to tenants</Link>
      </div>
    );
  }

  const workOrders = tenant.work_orders || [];
  const invoices = tenant.invoices || [];
  const documents = tenant.documents || [];

  const leaseEnd = new Date(tenant.lease_end);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((leaseEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const leaseExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  const leaseExpired = daysUntilExpiry < 0;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "work-orders", label: "Work Orders", count: workOrders.length },
    { id: "invoices", label: "Invoices", count: invoices.length },
    { id: "documents", label: "Documents", count: documents.length },
  ];

  return (
    <div className="animate-fade-in">
      <DetailHeader
        title={tenant.full_name}
        subtitle={tenant.email}
        backHref={ROUTES.TENANTS}
        backLabel="Tenants"
        badge={<StatusBadge status={tenant.status} />}
        actions={[
          {
            label: "Edit",
            icon: <Edit className="w-4 h-4" />,
            onClick: () => router.push(`/tenants/${id}/edit`),
          },
          {
            label: "Delete",
            icon: <Trash2 className="w-4 h-4" />,
            variant: "danger",
            onClick: () => setDeleteOpen(true),
          },
        ]}
      />

      {/* Lease Alert */}
      {(leaseExpiringSoon || leaseExpired) && (
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-2xl border mb-6",
          leaseExpired ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
        )}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${leaseExpired ? "text-red-500" : "text-yellow-500"}`} />
          <p className={`text-sm font-medium ${leaseExpired ? "text-red-700" : "text-yellow-700"}`}>
            {leaseExpired
              ? `Lease expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) !== 1 ? "s" : ""} ago`
              : `Lease expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`}
          </p>
        </div>
      )}

      <DetailTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Profile Card */}
            <InfoCard title="Tenant Information">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center flex-shrink-0">
                  {generateInitials(tenant.full_name)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{tenant.full_name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{tenant.email}</span>
                    {tenant.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{tenant.phone}</span>}
                  </div>
                </div>
              </div>
              {tenant.national_id && <InfoRow label="National ID" value={tenant.national_id} />}
              {tenant.emergency_contact && (
                <InfoRow
                  label="Emergency Contact"
                  value={`${(tenant.emergency_contact as any).name} — ${(tenant.emergency_contact as any).phone}`}
                />
              )}
            </InfoCard>

            {/* Lease Card */}
            <InfoCard title="Lease Details">
              <InfoRow label="Property" value={
                <Link href={`/properties/${tenant.property?.id}`} className="text-blue-600 hover:underline">
                  {tenant.property?.name}
                </Link>
              } />
              <InfoRow label="Lease Start" value={formatDate(tenant.lease_start)} />
              <InfoRow
                label="Lease End"
                value={
                  <span className={leaseExpired ? "text-red-600 font-semibold" : leaseExpiringSoon ? "text-yellow-600 font-semibold" : ""}>
                    {formatDate(tenant.lease_end)}
                    {leaseExpiringSoon && ` (${daysUntilExpiry} days left)`}
                    {leaseExpired && " (Expired)"}
                  </span>
                }
              />
              <InfoRow label="Monthly Rent" value={<span className="text-green-700 font-semibold">{formatCurrency(tenant.monthly_rent)}</span>} />
              <InfoRow label="Security Deposit" value={formatCurrency(tenant.security_deposit)} />
              <InfoRow label="Status" value={<StatusBadge status={tenant.status} />} />
            </InfoCard>

            {tenant.notes && (
              <InfoCard title="Notes">
                <p className="text-sm text-gray-600 leading-relaxed">{tenant.notes}</p>
              </InfoCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <InfoCard title="Financial Summary">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <span className="text-sm text-green-700">Monthly Rent</span>
                  <span className="text-sm font-bold text-green-700">{formatCurrency(tenant.monthly_rent)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <span className="text-sm text-blue-700">Total Invoices</span>
                  <span className="text-sm font-bold text-blue-700">{invoices.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <span className="text-sm text-red-700">Overdue</span>
                  <span className="text-sm font-bold text-red-700">
                    {invoices.filter((i: any) => i.status === "OVERDUE").length}
                  </span>
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Property">
              {tenant.property && (
                <Link href={`/properties/${tenant.property.id}`}
                  className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600 group-hover:underline">{tenant.property.name}</p>
                    <p className="text-xs text-gray-500">{tenant.property.city}, {tenant.property.state}</p>
                  </div>
                </Link>
              )}
            </InfoCard>
          </div>
        </div>
      )}

      {/* Work Orders Tab */}
      {activeTab === "work-orders" && (
        <div className="space-y-3">
          {workOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No work orders for this tenant</p>
            </div>
          ) : workOrders.map((wo: any) => (
            <Link key={wo.id} href={`/work-orders/${wo.id}`}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-blue-200 transition group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition truncate">{wo.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{wo.category.replace("_", " ")} · {formatDate(wo.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={wo.priority} />
                <StatusBadge status={wo.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No invoices for this tenant</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Invoice #", "Amount", "Due Date", "Status"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-sm text-blue-600 hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{formatDate(inv.due_date)}</td>
                    <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Remove Tenant"
        description={`Are you sure you want to remove "${tenant.full_name}"? Their lease and payment history will also be removed.`}
        confirmLabel="Remove Tenant"
        isLoading={deleteTenant.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
