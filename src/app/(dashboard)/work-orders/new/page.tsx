"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateWorkOrder } from "@/hooks/use-work-orders";
import { useProperties } from "@/hooks/use-properties";
import { useProviders } from "@/hooks/use-providers";
import { useTenants } from "@/hooks/use-tenants";
import { FormField } from "@/components/forms/form-field";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSection } from "@/components/forms/form-section";
import { FormActions } from "@/components/forms/form-actions";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES, WORK_ORDER_CATEGORIES } from "@/lib/constants";
import { workOrderSchema, type WorkOrderFormData } from "@/lib/validations/work-order";

const PRIORITIES = [
  { value: "CRITICAL", label: "Critical — Emergency" },
  { value: "HIGH", label: "High — Urgent" },
  { value: "MEDIUM", label: "Medium — Standard" },
  { value: "LOW", label: "Low — Not urgent" },
];

function NewWorkOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get("property_id") || "";

  const createWorkOrder = useCreateWorkOrder();
  const { data: propertiesData } = useProperties({});
  const { data: providersData } = useProviders({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      priority: "MEDIUM",
      category: "OTHER",
      property_id: defaultPropertyId,
    },
  });

  const selectedPropertyId = watch("property_id");
  const { data: tenantsData } = useTenants({
    status: "ACTIVE",
    property_id: selectedPropertyId || undefined,
  });

  const propertyOptions = (propertiesData?.data || []).map((p: any) => ({
    value: p.id,
    label: p.name,
  }));

  const tenantOptions = (tenantsData?.data || []).map((t: any) => ({
    value: t.id,
    label: t.full_name,
  }));

  const providerOptions = (providersData?.data || []).map((p: any) => ({
    value: p.id,
    label: `${p.name}${p.availability_status === "AVAILABLE" ? " ✓" : ""}`,
  }));

  async function onSubmit(data: WorkOrderFormData) {
    // Convert empty strings to null for optional UUID fields
    const cleanedData = {
      ...data,
      occupant_id: data.occupant_id || null,
      assigned_to: data.assigned_to || null,
    };
    const wo = await createWorkOrder.mutateAsync(cleanedData);
    router.push(`/work-orders/${wo.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title="New Work Order"
        description="Create a maintenance or repair request"
        backHref={ROUTES.WORK_ORDERS}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title="Work Order Details" description="Describe the issue and set priority">
          <FormField
            label="Title"
            required
            placeholder="e.g. Leaking kitchen faucet in Unit 2B"
            error={errors.title?.message}
            {...register("title")}
          />
          <FormTextarea
            label="Description"
            required
            placeholder="Describe the issue in detail — what is happening, when it started, any relevant history..."
            rows={4}
            error={errors.description?.message}
            {...register("description")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Category"
              required
              options={[...WORK_ORDER_CATEGORIES]}
              error={errors.category?.message}
              {...register("category")}
            />
            <FormSelect
              label="Priority"
              required
              options={PRIORITIES}
              error={errors.priority?.message}
              {...register("priority")}
            />
          </div>
        </FormSection>

        <FormSection title="Location & Tenant" description="Which property and tenant is this for?">
          <FormSelect
            label="Property"
            required
            options={propertyOptions}
            placeholder="Select a property..."
            error={errors.property_id?.message}
            {...register("property_id")}
          />
          <FormSelect
            label="Tenant (optional)"
            options={tenantOptions}
            placeholder="Select tenant if applicable..."
            error={errors.occupant_id?.message}
            hint={!selectedPropertyId ? "Select a property first to filter tenants" : undefined}
            {...register("occupant_id")}
          />
        </FormSection>

        <FormSection title="Assignment & Schedule" description="Assign a provider and set due date">
          <FormSelect
            label="Assign to Service Provider (optional)"
            options={providerOptions}
            placeholder="Assign later..."
            error={errors.assigned_to?.message}
            {...register("assigned_to")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Estimated Cost ($)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              error={errors.estimated_cost?.message}
              {...register("estimated_cost", { valueAsNumber: true })}
            />
            <FormField
              label="Due Date"
              type="date"
              error={errors.due_date?.message}
              {...register("due_date")}
            />
          </div>
        </FormSection>

        <FormSection title="Additional Notes">
          <FormTextarea
            label="Internal Notes (optional)"
            placeholder="Any additional context for your team..."
            error={errors.notes?.message}
            {...register("notes")}
          />
        </FormSection>

        <FormActions
          cancelHref={ROUTES.WORK_ORDERS}
          submitLabel="Create Work Order"
          isLoading={createWorkOrder.isPending}
        />
      </form>
    </div>
  );
}

export default function NewWorkOrderPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto p-6">Loading...</div>}>
      <NewWorkOrderContent />
    </Suspense>
  );
}
