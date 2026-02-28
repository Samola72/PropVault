"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
  Building2, MapPin, BedDouble, Bath, Square, Calendar,
  DollarSign, Edit, Trash2, Plus, Wrench, Users, FileText, FolderOpen
} from "lucide-react";
import { useProperty, useDeleteProperty } from "@/hooks/use-properties";
import { DetailHeader } from "@/components/shared/detail-header";
import { DetailTabs } from "@/components/shared/detail-tabs";
import { InfoCard, InfoRow } from "@/components/shared/info-row";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: property, isLoading } = useProperty(id);
  const deleteProperty = useDeleteProperty();

  async function handleDelete() {
    await deleteProperty.mutateAsync(id);
    router.push(ROUTES.PROPERTIES);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Property not found</p>
        <Link href={ROUTES.PROPERTIES} className="text-blue-600 text-sm hover:underline mt-2 inline-block">
          Back to properties
        </Link>
      </div>
    );
  }

  const occupants = property.occupants || [];
  const workOrders = property.work_orders || [];
  const invoices = property.invoices || [];
  const documents = property.documents || [];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "tenants", label: "Tenants", count: occupants.length },
    { id: "work-orders", label: "Work Orders", count: workOrders.length },
    { id: "invoices", label: "Invoices", count: invoices.length },
    { id: "documents", label: "Documents", count: documents.length },
  ];

  return (
    <div className="animate-fade-in">
      <DetailHeader
        title={property.name}
        subtitle={`${property.address_line1}, ${property.city}, ${property.state} ${property.postal_code}`}
        backHref={ROUTES.PROPERTIES}
        backLabel="Properties"
        badge={<StatusBadge status={property.status} />}
        actions={[
          {
            label: "Edit",
            icon: <Edit className="w-4 h-4" />,
            onClick: () => router.push(`/properties/${id}/edit`),
          },
          {
            label: "Delete",
            icon: <Trash2 className="w-4 h-4" />,
            variant: "danger",
            onClick: () => setDeleteOpen(true),
          },
        ]}
        meta={[
          { label: "Type", value: property.type },
          { label: "Added", value: formatDate(property.created_at) },
        ]}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Monthly Rent",
            value: property.monthly_rent ? formatCurrency(property.monthly_rent) : "N/A",
            icon: DollarSign,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Active Tenants",
            value: occupants.filter((o: any) => o.status === "ACTIVE").length,
            icon: Users,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Open Work Orders",
            value: workOrders.filter((w: any) => ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(w.status)).length,
            icon: Wrench,
            color: "text-orange-600 bg-orange-50",
          },
          {
            label: "Pending Invoices",
            value: invoices.filter((i: any) => ["SENT", "DRAFT", "PARTIAL"].includes(i.status)).length,
            icon: FileText,
            color: "text-purple-600 bg-purple-50",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <DetailTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Image */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="h-52 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                {property.images?.[0] ? (
                  <img src={property.images[0]} alt={property.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-16 h-16 text-blue-300" />
                )}
              </div>
              <div className="p-4">
                {property.amenities && property.amenities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {property.amenities.map((a: string) => (
                        <span key={a} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-lg">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="lg:col-span-2 space-y-5">
            <InfoCard title="Property Details">
              <InfoRow label="Property Type" value={property.type} />
              <InfoRow label="Status" value={<StatusBadge status={property.status} />} />
              <InfoRow label="Address" value={`${property.address_line1}${property.address_line2 ? `, ${property.address_line2}` : ""}`} />
              <InfoRow label="City, State" value={`${property.city}, ${property.state} ${property.postal_code}`} />
              <InfoRow label="Country" value={property.country} />
            </InfoCard>

            <InfoCard title="Property Specifications">
              {property.bedrooms !== null && (
                <InfoRow label="Bedrooms" value={`${property.bedrooms} bed${property.bedrooms !== 1 ? "s" : ""}`} />
              )}
              {property.bathrooms !== null && (
                <InfoRow label="Bathrooms" value={`${property.bathrooms} bath${property.bathrooms !== 1 ? "s" : ""}`} />
              )}
              {property.square_feet && (
                <InfoRow label="Square Feet" value={`${property.square_feet.toLocaleString()} sqft`} />
              )}
              {property.year_built && (
                <InfoRow label="Year Built" value={property.year_built.toString()} />
              )}
              {property.monthly_rent && (
                <InfoRow label="Monthly Rent" value={formatCurrency(property.monthly_rent)} />
              )}
              {property.purchase_price && (
                <InfoRow label="Purchase Price" value={formatCurrency(property.purchase_price)} />
              )}
            </InfoCard>

            {property.notes && (
              <InfoCard title="Notes">
                <p className="text-sm text-gray-600 leading-relaxed">{property.notes}</p>
              </InfoCard>
            )}
          </div>
        </div>
      )}

      {/* Tenants Tab */}
      {activeTab === "tenants" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={`/tenants/new?property_id=${id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
            >
              <Plus className="w-4 h-4" />Add Tenant
            </Link>
          </div>
          {occupants.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No tenants for this property</p>
            </div>
          ) : (
            <div className="space-y-3">
              {occupants.map((occupant: any) => (
                <Link
                  key={occupant.id}
                  href={`/tenants/${occupant.id}`}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:border-blue-200 hover:shadow-sm transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0">
                    {occupant.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">{occupant.full_name}</p>
                    <p className="text-xs text-gray-500">{occupant.email}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={occupant.status} />
                    <p className="text-xs text-gray-500 mt-1">
                      Lease ends {formatDate(occupant.lease_end)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Work Orders Tab */}
      {activeTab === "work-orders" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={`/work-orders/new?property_id=${id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
            >
              <Plus className="w-4 h-4" />New Work Order
            </Link>
          </div>
          {workOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No work orders for this property</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workOrders.map((wo: any) => (
                <Link
                  key={wo.id}
                  href={`/work-orders/${wo.id}`}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:border-blue-200 hover:shadow-sm transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-blue-600 transition truncate">{wo.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{wo.category.replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={wo.priority} />
                    <StatusBadge status={wo.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={`/invoices/new?property_id=${id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
            >
              <Plus className="w-4 h-4" />Create Invoice
            </Link>
          </div>
          {invoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No invoices for this property</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Invoice #", "Type", "Amount", "Due Date", "Status"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <Link href={`/invoices/${inv.id}`} className="font-mono text-sm font-medium text-blue-600 hover:underline">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 capitalize">{inv.type.toLowerCase()}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatCurrency(inv.total_amount)}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{formatDate(inv.due_date)}</td>
                      <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No documents uploaded for this property</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc: any) => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                    <FolderOpen className="w-5 h-5 text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{doc.category.toLowerCase()}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Property"
        description={`Are you sure you want to delete "${property.name}"? This will also remove all associated records. This action cannot be undone.`}
        confirmLabel="Delete Property"
        isLoading={deleteProperty.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
