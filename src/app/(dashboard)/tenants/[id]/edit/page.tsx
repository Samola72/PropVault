"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTenant, useUpdateTenant } from "@/hooks/use-tenants";
import { useProperties } from "@/hooks/use-properties";
import { FormField } from "@/components/forms/form-field";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSection } from "@/components/forms/form-section";
import { FormActions } from "@/components/forms/form-actions";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/shared/loading-skeleton";

const tenantSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  national_id: z.string().optional(),
  property_id: z.string().uuid("Please select a property"),
  monthly_rent: z.coerce.number().min(1, "Monthly rent is required"),
  security_deposit: z.coerce.number().min(0).default(0),
  lease_start: z.string().min(1, "Lease start date is required"),
  lease_end: z.string().min(1, "Lease end date is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "EVICTION", "PENDING"]).default("ACTIVE"),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  notes: z.string().optional(),
});

const TENANT_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "EVICTION", label: "Eviction" },
];

export default function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: tenant, isLoading } = useTenant(id);
  const updateTenant = useUpdateTenant();
  const { data: propertiesData } = useProperties({});

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(tenantSchema),
  });

  useEffect(() => {
    if (tenant) {
      const ec = tenant.emergency_contact as any;
      reset({
        full_name: tenant.full_name,
        email: tenant.email,
        phone: tenant.phone || "",
        national_id: tenant.national_id || "",
        property_id: tenant.property_id,
        monthly_rent: tenant.monthly_rent,
        security_deposit: tenant.security_deposit,
        lease_start: tenant.lease_start?.split("T")[0],
        lease_end: tenant.lease_end?.split("T")[0],
        status: tenant.status,
        emergency_contact_name: ec?.name || "",
        emergency_contact_phone: ec?.phone || "",
        emergency_contact_relationship: ec?.relationship || "",
        notes: tenant.notes || "",
      });
    }
  }, [tenant, reset]);

  async function onSubmit(data: any) {
    const { emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, ...rest } = data;
    await updateTenant.mutateAsync({
      id,
      data: {
        ...rest,
        emergency_contact: emergency_contact_name
          ? { name: emergency_contact_name, phone: emergency_contact_phone, relationship: emergency_contact_relationship }
          : null,
      },
    });
    router.push(`/tenants/${id}`);
  }

  if (isLoading) return <div className="space-y-4 max-w-3xl mx-auto">{[1,2,3].map(i=><Skeleton key={i} className="h-48 rounded-2xl"/>)}</div>;

  const propertyOptions = (propertiesData?.data || []).map((p: any) => ({ value: p.id, label: `${p.name} — ${p.city}, ${p.state}` }));

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader title="Edit Tenant" backHref={`/tenants/${id}`} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title="Tenant Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" required error={errors.full_name?.message} {...register("full_name")} />
            <FormField label="Email" required type="email" error={errors.email?.message} {...register("email")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Phone" type="tel" error={errors.phone?.message} {...register("phone")} />
            <FormField label="SSN / Driver's License" error={errors.national_id?.message} {...register("national_id")} />
          </div>
          <FormSelect label="Status" required options={TENANT_STATUSES} error={errors.status?.message} {...register("status")} />
        </FormSection>
        <FormSection title="Lease Details">
          <FormSelect label="Property" required options={propertyOptions} placeholder="Select property..." error={errors.property_id?.message} {...register("property_id")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Lease Start" required type="date" error={errors.lease_start?.message} {...register("lease_start")} />
            <FormField label="Lease End" required type="date" error={errors.lease_end?.message} {...register("lease_end")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Monthly Rent ($)" required type="number" step="0.01" error={errors.monthly_rent?.message} {...register("monthly_rent")} />
            <FormField label="Security Deposit ($)" type="number" step="0.01" error={errors.security_deposit?.message} {...register("security_deposit")} />
          </div>
        </FormSection>
        <FormSection title="Emergency Contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Contact Name" error={errors.emergency_contact_name?.message} {...register("emergency_contact_name")} />
            <FormField label="Contact Phone" type="tel" error={errors.emergency_contact_phone?.message} {...register("emergency_contact_phone")} />
          </div>
          <FormField label="Relationship" error={errors.emergency_contact_relationship?.message} {...register("emergency_contact_relationship")} />
        </FormSection>
        <FormSection title="Notes">
          <FormTextarea label="Internal Notes" error={errors.notes?.message} {...register("notes")} />
        </FormSection>
        <FormActions cancelHref={`/tenants/${id}`} submitLabel="Save Changes" isLoading={updateTenant.isPending} />
      </form>
    </div>
  );
}
