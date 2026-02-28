"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTenant } from "@/hooks/use-tenants";
import { useProperties } from "@/hooks/use-properties";
import { FormField } from "@/components/forms/form-field";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSection } from "@/components/forms/form-section";
import { FormActions } from "@/components/forms/form-actions";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/lib/constants";

const tenantFormSchema = z.object({
  property_id: z.string().uuid("Invalid property"),
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  national_id: z.string().optional(),
  lease_start: z.string().min(1, "Lease start date is required"),
  lease_end: z.string().min(1, "Lease end date is required"),
  monthly_rent: z.number().min(0, "Monthly rent is required"),
  security_deposit: z.number().min(0),
  status: z.enum(["ACTIVE", "INACTIVE", "EVICTION", "PENDING"]),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  notes: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantFormSchema>;

const TENANT_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending — awaiting move-in" },
  { value: "INACTIVE", label: "Inactive / Moved out" },
  { value: "EVICTION", label: "Eviction in progress" },
];

function NewTenantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get("property_id") || "";

  const createTenant = useCreateTenant();
  const { data: propertiesData } = useProperties({ status: "AVAILABLE" });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      status: "ACTIVE",
      security_deposit: 0,
      property_id: defaultPropertyId,
    },
  });

  const propertyOptions = (propertiesData?.data || []).map((p: any) => ({
    value: p.id,
    label: `${p.name} — ${p.city}, ${p.state}`,
  }));

  async function onSubmit(data: TenantFormData) {
    const {
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      ...rest
    } = data;

    const payload = {
      ...rest,
      emergency_contact:
        emergency_contact_name
          ? {
              name: emergency_contact_name,
              phone: emergency_contact_phone || "",
              relationship: emergency_contact_relationship || "",
            }
          : null,
    };

    const tenant = await createTenant.mutateAsync(payload);
    router.push(`/tenants/${tenant.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title="Add Tenant"
        description="Create a new tenant and lease agreement"
        backHref={ROUTES.TENANTS}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title="Tenant Information"
          description="Personal details and contact info"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Full Name"
              required
              placeholder="John Smith"
              error={errors.full_name?.message}
              {...register("full_name")}
            />
            <FormField
              label="Email Address"
              required
              type="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 000-0000"
              error={errors.phone?.message}
              {...register("phone")}
            />
            <FormField
              label="SSN / Driver's License (optional)"
              placeholder="For background check reference"
              error={errors.national_id?.message}
              {...register("national_id")}
            />
          </div>
          <FormSelect
            label="Tenant Status"
            required
            options={TENANT_STATUSES}
            error={errors.status?.message}
            {...register("status")}
          />
        </FormSection>

        <FormSection
          title="Lease Details"
          description="Property and lease agreement terms"
        >
          <FormSelect
            label="Property"
            required
            options={propertyOptions}
            placeholder="Select a property..."
            error={errors.property_id?.message}
            hint="Only showing available properties"
            {...register("property_id")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Lease Start Date"
              required
              type="date"
              error={errors.lease_start?.message}
              {...register("lease_start")}
            />
            <FormField
              label="Lease End Date"
              required
              type="date"
              error={errors.lease_end?.message}
              {...register("lease_end")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Monthly Rent ($)"
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="2500.00"
              error={errors.monthly_rent?.message}
              {...register("monthly_rent", { valueAsNumber: true })}
            />
            <FormField
              label="Security Deposit ($)"
              type="number"
              min="0"
              step="0.01"
              placeholder="5000.00"
              error={errors.security_deposit?.message}
              {...register("security_deposit", { valueAsNumber: true })}
            />
          </div>
        </FormSection>

        <FormSection
          title="Emergency Contact"
          description="Required for lease agreements"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Contact Name"
              placeholder="Jane Smith"
              error={errors.emergency_contact_name?.message}
              {...register("emergency_contact_name")}
            />
            <FormField
              label="Contact Phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              error={errors.emergency_contact_phone?.message}
              {...register("emergency_contact_phone")}
            />
          </div>
          <FormField
            label="Relationship to Tenant"
            placeholder="e.g. Spouse, Parent, Sibling"
            error={errors.emergency_contact_relationship?.message}
            {...register("emergency_contact_relationship")}
          />
        </FormSection>

        <FormSection title="Notes">
          <FormTextarea
            label="Internal Notes (optional)"
            placeholder="Any special agreements, pet policies, parking spaces, etc..."
            error={errors.notes?.message}
            {...register("notes")}
          />
        </FormSection>

        <FormActions
          cancelHref={ROUTES.TENANTS}
          submitLabel="Add Tenant"
          isLoading={createTenant.isPending}
        />
      </form>
    </div>
  );
}

export default function NewTenantPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto p-6">Loading...</div>}>
      <NewTenantContent />
    </Suspense>
  );
}
