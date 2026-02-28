"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, MapPin, BedDouble, DollarSign, Users } from "lucide-react";
import { useProperties } from "@/hooks/use-properties";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency } from "@/lib/utils";
import type { Property, PropertyStatus } from "@/types";
import { ROUTES } from "@/lib/constants";

const STATUSES: { value: PropertyStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "AVAILABLE", label: "Available" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "RENOVATION", label: "Renovation" },
];

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PropertyStatus | "">("");

  const { data, isLoading } = useProperties({ search, status: status || undefined });
  const properties: Property[] = data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Properties"
        description={`${data?.total ?? 0} properties total`}
        actionLabel="Add Property"
        actionHref="/properties/new"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search properties..." className="flex-1" />
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button key={s.value} onClick={() => setStatus(s.value as PropertyStatus | "")}
              className={`px-3 py-2 text-sm rounded-xl border transition ${
                status === s.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties found"
          description="Add your first property to start managing your portfolio."
          actionLabel="Add Property"
          actionHref="/properties/new"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property) => (
            <Link key={property.id} href={`/properties/${property.id}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group overflow-hidden">
              {/* Image placeholder */}
              <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                {property.images && property.images[0] ? (
                  <img src={property.images[0]} alt={property.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-12 h-12 text-blue-300" />
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">
                      {property.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-gray-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <p className="text-xs truncate">{property.city}, {property.state}</p>
                    </div>
                  </div>
                  <StatusBadge status={property.status} className="ml-2 flex-shrink-0" />
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {property.bedrooms !== null && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                        <BedDouble className="w-3.5 h-3.5" />
                        <span className="text-xs">{property.bedrooms}bd</span>
                      </div>
                    </div>
                  )}
                  {property.square_feet && (
                    <div className="text-center">
                      <span className="text-xs text-gray-500">{property.square_feet?.toLocaleString()} sqft</span>
                    </div>
                  )}
                  <div className="text-center text-xs text-gray-500 capitalize">
                    {property.type.toLowerCase()}
                  </div>
                </div>

                {property.monthly_rent && (
                  <div className="flex items-center gap-1 text-blue-700 font-semibold text-sm">
                    <DollarSign className="w-3.5 h-3.5" />
                    {formatCurrency(property.monthly_rent)}/mo
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
