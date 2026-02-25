"use client";

import { useState } from "react";
import Link from "next/link";
import { UserCog, Phone, Mail, Star, CheckCircle2 } from "lucide-react";
import { useProviders } from "@/hooks/use-providers";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency } from "@/lib/utils";
import { WORK_ORDER_CATEGORIES } from "@/lib/constants";

export default function ProvidersPage() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [availability, setAvailability] = useState("");

  const { data, isLoading } = useProviders({ search, specialty: specialty || undefined, availability_status: availability || undefined });
  const providers = data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Service Providers"
        description={`${data?.total ?? 0} providers in directory`}
        actionLabel="Add Provider"
        actionHref="/providers/new"
      />

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search providers..." className="flex-1" />
        <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Specialties</option>
          {WORK_ORDER_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={availability} onChange={(e) => setAvailability(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Availability</option>
          {["AVAILABLE", "BUSY", "UNAVAILABLE"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : providers.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No service providers found"
          description="Add service providers to your directory to assign work orders."
          actionLabel="Add Provider"
          actionHref="/providers/new"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {providers.map((p: any) => (
            <Link key={p.id} href={`/providers/${p.id}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {p.name.charAt(0)}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={p.availability_status} />
                  {p.is_verified && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />Verified
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition mb-1">{p.name}</h3>
              {p.company_name && <p className="text-xs text-gray-500 mb-3">{p.company_name}</p>}

              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(p.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                ))}
                <span className="text-xs text-gray-500 ml-1">({p.total_jobs} jobs)</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.specialties.slice(0, 3).map((s: string) => (
                  <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">
                    {s.replace("_", " ")}
                  </span>
                ))}
                {p.specialties.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-lg">
                    +{p.specialties.length - 3}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="w-3 h-3" />{p.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail className="w-3 h-3" />{p.email}
                </div>
                {p.hourly_rate && (
                  <div className="text-xs font-medium text-green-600">
                    {formatCurrency(p.hourly_rate)}/hr
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
