"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench, User, Building2, Calendar, DollarSign,
  Edit, Trash2, CheckCircle2, Clock, Send
} from "lucide-react";
import { useWorkOrder, useUpdateWorkOrder, useDeleteWorkOrder } from "@/hooks/use-work-orders";
import { DetailHeader } from "@/components/shared/detail-header";
import { DetailTabs } from "@/components/shared/detail-tabs";
import { InfoCard, InfoRow } from "@/components/shared/info-row";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Modal } from "@/components/shared/modal";
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
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateCost, setUpdateCost] = useState("");
  const [updating, setUpdating] = useState(false);

  const { data: workOrder, isLoading } = useWorkOrder(id);
  const deleteWorkOrder = useDeleteWorkOrder();
  const updateWorkOrder = useUpdateWorkOrder();

  async function handleDelete() {
    await deleteWorkOrder.mutateAsync(id);
    router.push(ROUTES.WORK_ORDERS);
  }

  async function handleStatusUpdate() {
    if (!updateMessage.trim() || !updateStatus) {
      alert("Please provide a status and update message");
      return;
    }

    setUpdating(true);
    try {
      await updateWorkOrder.mutateAsync({
        id,
        data: {
          status: updateStatus,
          message: updateMessage,
          actual_cost: updateCost ? parseFloat(updateCost) : undefined,
        },
      });
      setUpdateOpen(false);
      setUpdateMessage("");
      setUpdateCost("");
      setUpdateStatus("");
    } catch (error) {
      console.error("Failed to update work order:", error);
      alert("Failed to update work order. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  function openStatusUpdate(status?: string) {
    setUpdateStatus(status || workOrder?.status || "");
    setUpdateOpen(true);
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

      {/* Quick Actions Bar */}
      {workOrder.status !== "COMPLETED" && workOrder.status !== "CLOSED" && workOrder.status !== "CANCELLED" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => openStatusUpdate("IN_PROGRESS")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition text-sm font-medium"
          >
            <Clock className="w-4 h-4" />
            Start Work
          </button>
          <button
            onClick={() => openStatusUpdate("COMPLETED")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Complete
          </button>
          <button
            onClick={() => openStatusUpdate()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition text-sm font-medium"
          >
            <Send className="w-4 h-4" />
            Add Update
          </button>
        </div>
      )}

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

      {/* Status Update Modal */}
      <Modal
        open={updateOpen}
        onClose={() => {
          setUpdateOpen(false);
          setUpdateMessage("");
          setUpdateCost("");
        }}
        title="Update Work Order Status"
        description="Add an update and optionally change the status"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_PARTS">Pending Parts</option>
              <option value="COMPLETED">Completed</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Message *
            </label>
            <textarea
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              rows={4}
              placeholder="Describe what was done, current status, next steps..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {updateStatus === "COMPLETED" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actual Cost (optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={updateCost}
                  onChange={(e) => setUpdateCost(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setUpdateOpen(false);
                setUpdateMessage("");
                setUpdateCost("");
              }}
              disabled={updating}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStatusUpdate}
              disabled={updating || !updateMessage.trim() || !updateStatus}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post Update
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
