"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench, User, Building2, Calendar, DollarSign,
  Edit, Trash2, CheckCircle2, Clock
} from "lucide-react";
import { useWorkOrder, useUpdateWorkOrder, useDeleteWorkOrder } from "@/hooks/use-work-orders";
import { DetailHeader } from "@/components/shared/detail-header";
import { DetailTabs } from "@/components/shared/detail-tabs";
import { InfoCard, InfoRow } from "@/components/shared/info-row";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from "@/lib/utils";
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

export default function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: workOrder, isLoading } = useWorkOrder(id);
  const deleteWorkOrder = useDeleteWorkOrder();

  async function handleDelete() {
    await deleteWorkOrder.mutateAsync(id);
    router.push(ROUTES.WORK_ORDERS);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Work order not found</p>
        <Link href={ROUTES.WORK_ORDERS} className="text-blue-600 text-sm hover:underline mt-2 inline-block">
          Back to work orders
        </Link>
      </div>
    );
  }

  const updates = workOrder.work_order_updates || [];

  const tabs = [
    { id: "details", label: "Details" },
    { id: "timeline", label: "Timeline", count: updates.length },
  ];

  return (
    <div className="animate-fade-in">
      <DetailHeader
        title={workOrder.title}
        subtitle={workOrder.property?.name}
        backHref={ROUTES.WORK_ORDERS}
        backLabel="Work Orders"
        badge={
          <div className="flex items-center gap-2">
            <PriorityBadge priority={workOrder.priority} />
            <StatusBadge status={workOrder.status} />
          </div>
        }
        actions={[
          {
            label: "Edit",
            icon: <Edit className="w-4 h-4" />,
            onClick: () => router.push(`/work-orders/${id}/edit`),
          },
          {
            label: "Delete",
            icon: <Trash2 className="w-4 h-4" />,
            variant: "danger",
            onClick: () => setDeleteOpen(true),
          },
        ]}
      />

      <DetailTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <InfoCard title="Work Order Details">
              <InfoRow label="Category" value={workOrder.category.replace(/_/g, " ")} />
              <InfoRow label="Priority" value={<PriorityBadge priority={workOrder.priority} />} />
              <InfoRow label="Status" value={<StatusBadge status={workOrder.status} />} />
              <InfoRow label="Due Date" value={workOrder.due_date ? formatDate(workOrder.due_date) : "Not set"} />
              <InfoRow label="Created" value={formatDateTime(workOrder.created_at)} />
              {workOrder.completed_at && (
                <InfoRow label="Completed" value={formatDateTime(workOrder.completed_at)} />
              )}
            </InfoCard>

            <InfoCard title="Description">
              <p className="text-sm text-gray-700 leading-relaxed">{workOrder.description}</p>
              {workOrder.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Additional Notes</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{workOrder.notes}</p>
                </div>
              )}
            </InfoCard>

            {workOrder.images && workOrder.images.length > 0 && (
              <InfoCard title="Photos">
                <div className="grid grid-cols-3 gap-3">
                  {workOrder.images.map((img: string, i: number) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                      <img src={img} alt={`Photo ${i + 1}`} className="w-full h-24 object-cover rounded-xl hover:opacity-90 transition" />
                    </a>
                  ))}
                </div>
              </InfoCard>
            )}
          </div>

          <div className="space-y-5">
            <InfoCard title="Property">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <Link href={`/properties/${workOrder.property?.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {workOrder.property?.name}
                  </Link>
                  <p className="text-xs text-gray-500">{workOrder.property?.address_line1}</p>
                </div>
              </div>
            </InfoCard>

            {workOrder.occupant && (
              <InfoCard title="Reported By (Tenant)">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center">
                    {generateInitials(workOrder.occupant.full_name)}
                  </div>
                  <div>
                    <Link href={`/tenants/${workOrder.occupant.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {workOrder.occupant.full_name}
                    </Link>
                    <p className="text-xs text-gray-500">{workOrder.occupant.email}</p>
                  </div>
                </div>
              </InfoCard>
            )}

            <InfoCard title="Service Provider" action={
              <Link href={`/work-orders/${id}/edit`} className="text-xs text-blue-600 hover:underline">
                {workOrder.service_provider ? "Change" : "Assign"}
              </Link>
            }>
              {workOrder.service_provider ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <Link href={`/providers/${workOrder.service_provider.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {workOrder.service_provider.name}
                    </Link>
                    <p className="text-xs text-gray-500">{workOrder.service_provider.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No provider assigned</p>
              )}
            </InfoCard>

            <InfoCard title="Cost Estimate">
              <InfoRow label="Estimated Cost" value={workOrder.estimated_cost ? formatCurrency(workOrder.estimated_cost) : "Not set"} />
              <InfoRow label="Actual Cost" value={workOrder.actual_cost ? formatCurrency(workOrder.actual_cost) : "Pending"} />
            </InfoCard>
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === "timeline" && (
        <div className="max-w-2xl">
          {updates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No updates yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-6">
                {updates.map((update: any) => (
                  <div key={update.id} className="relative flex gap-4 pl-14">
                    <div className="absolute left-0 w-10 h-10 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center flex-shrink-0 z-10">
                      {update.user?.avatar_url ? (
                        <img src={update.user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <span className="text-xs font-bold text-blue-600">
                          {generateInitials(update.user?.full_name || "U")}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{update.user?.full_name}</span>
                          <span className="text-xs text-gray-400 ml-2">{formatRelativeTime(update.created_at)}</span>
                        </div>
                        <StatusBadge status={update.status} />
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{update.message}</p>
                      {update.images && update.images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {update.images.map((img: string, i: number) => (
                            <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                              <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg hover:opacity-80 transition" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Work Order"
        description="Are you sure you want to delete this work order? All updates and history will be lost."
        confirmLabel="Delete"
        isLoading={deleteWorkOrder.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
