"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Phone, Mail, Star, CheckCircle2, Edit, Trash2, Wrench, Shield } from "lucide-react";
import { useProvider, useDeleteProvider } from "@/hooks/use-providers";
import { DetailHeader } from "@/components/shared/detail-header";
import { DetailTabs } from "@/components/shared/detail-tabs";
import { InfoCard, InfoRow } from "@/components/shared/info-row";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";

export default function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: provider, isLoading } = useProvider(id);
  const deleteProvider = useDeleteProvider();

  async function handleDelete() {
    await deleteProvider.mutateAsync(id);
    router.push(ROUTES.PROVIDERS);
  }

  if (isLoading) {
    return <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>;
  }

  if (!provider) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Provider not found</p>
        <Link href={ROUTES.PROVIDERS} className="text-blue-600 text-sm hover:underline mt-2 inline-block">Back to providers</Link>
      </div>
    );
  }

  const workOrders = provider.work_orders || [];
  const completedJobs = workOrders.filter((w: any) => ["COMPLETED", "CLOSED"].includes(w.status));
  const activeJobs = workOrders.filter((w: any) => ["ASSIGNED", "IN_PROGRESS"].includes(w.status));

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "jobs", label: "Job History", count: workOrders.length },
  ];

  return (
    <div className="animate-fade-in">
      <DetailHeader
        title={provider.name}
        subtitle={provider.company_name || provider.email}
        backHref={ROUTES.PROVIDERS}
        backLabel="Service Providers"
        badge={
          <div className="flex items-center gap-2">
            <StatusBadge status={provider.availability_status} />
            {provider.is_verified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="w-3 h-3" />Verified
              </span>
            )}
          </div>
        }
        actions={[
          {
            label: "Edit",
            icon: <Edit className="w-4 h-4" />,
            onClick: () => router.push(`/providers/${id}/edit`),
          },
          {
            label: "Remove",
            icon: <Trash2 className="w-4 h-4" />,
            variant: "danger",
            onClick: () => setDeleteOpen(true),
          },
        ]}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Jobs", value: provider.total_jobs, color: "text-blue-600" },
          { label: "Completed", value: completedJobs.length, color: "text-green-600" },
          { label: "Active Jobs", value: activeJobs.length, color: "text-orange-600" },
          { label: "Rating", value: `${provider.rating.toFixed(1)} / 5`, color: "text-yellow-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <DetailTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <InfoCard title="Provider Information">
              <InfoRow label="Full Name" value={provider.name} />
              {provider.company_name && <InfoRow label="Company" value={provider.company_name} />}
              <InfoRow label="Email" value={<a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline">{provider.email}</a>} />
              <InfoRow label="Phone" value={<a href={`tel:${provider.phone}`} className="text-blue-600 hover:underline">{provider.phone}</a>} />
              {provider.license_number && <InfoRow label="License #" value={provider.license_number} />}
              {provider.hourly_rate && <InfoRow label="Hourly Rate" value={formatCurrency(provider.hourly_rate)} />}
            </InfoCard>

            <InfoCard title="Specialties">
              <div className="flex flex-wrap gap-2">
                {provider.specialties.map((s: string) => (
                  <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-xl font-medium">
                    {s.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </InfoCard>

            {provider.notes && (
              <InfoCard title="Notes">
                <p className="text-sm text-gray-600 leading-relaxed">{provider.notes}</p>
              </InfoCard>
            )}
          </div>

          <div className="space-y-5">
            <InfoCard title="Performance">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.floor(provider.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                ))}
                <span className="text-sm font-semibold text-gray-700 ml-1">{provider.rating.toFixed(1)}</span>
              </div>
              <InfoRow label="Total Jobs Done" value={provider.total_jobs.toString()} />
              <InfoRow label="Active Jobs" value={activeJobs.length.toString()} />
              <InfoRow label="Completed" value={completedJobs.length.toString()} />
            </InfoCard>

            <InfoCard title="Availability">
              <StatusBadge status={provider.availability_status} />
              <p className="text-xs text-gray-500 mt-2">
                {provider.availability_status === "AVAILABLE" ? "Ready to take new work orders" :
                 provider.availability_status === "BUSY" ? "Currently working on active jobs" :
                 "Not currently accepting work orders"}
              </p>
            </InfoCard>

            {provider.insurance_info && (
              <InfoCard title="Insurance">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Insurance on file</span>
                </div>
              </InfoCard>
            )}
          </div>
        </div>
      )}

      {activeTab === "jobs" && (
        <div className="space-y-3">
          {workOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No jobs assigned yet</p>
            </div>
          ) : workOrders.map((wo: any) => (
            <Link key={wo.id} href={`/work-orders/${wo.id}`}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-blue-200 transition group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition truncate">{wo.title}</p>
                <p className="text-xs text-gray-500">{wo.property?.name} · {formatDate(wo.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={wo.priority} />
                <StatusBadge status={wo.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Remove Service Provider"
        description={`Remove "${provider.name}" from your directory? Their job history will be preserved.`}
        confirmLabel="Remove Provider"
        isLoading={deleteProvider.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
