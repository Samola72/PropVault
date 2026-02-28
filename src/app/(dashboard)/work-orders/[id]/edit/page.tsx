"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWorkOrder, useUpdateWorkOrder } from "@/hooks/use-work-orders";
import { useProperties } from "@/hooks/use-properties";
import { useProviders } from "@/hooks/use-providers";
import { useTenants } from "@/hooks/use-tenants";
import { FormField } from "@/components/forms/form-field";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSection } from "@/components/forms/form-section";
import { FormActions } from "@/components/forms/form-actions";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { WORK_ORDER_CATEGORIES } from "@/lib/constants";

const workOrderSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum([
    "PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "STRUCTURAL",
    "PEST_CONTROL", "LANDSCAPING", "CLEANING", "SECURITY", "PAINTING",
    "FLOORING", "ROOFING", "WINDOWS_DOORS", "GENERAL", "OTHER",
  ]),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  property_id: z.string().uuid("Please select a property"),
  occupant_id: z.string().optional(),
  assigned_to: z.string().optional(),
  estimated_cost: z.coerce.number().min(0).optional().nullable(),
  due_date: z.string().optional().nullable(),
  notes: z.string().optional(),
});

const PRIORITIES = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

export default function EditWorkOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: workOrder, isLoading } = useWorkOrder(id);
  const updateWorkOrder = useUpdateWorkOrder();
  const { data: propertiesData } = useProperties({});
  const { data: providersData } = useProviders({});
  const { data: tenantsData } = useTenants({ status: "ACTIVE" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(workOrderSchema) });

  useEffect(() => {
    if (workOrder) {
      reset({
        title: workOrder.title,
        description: workOrder.description,
        category: workOrder.category,
        priority: workOrder.priority,
        property_id: workOrder.property_id,
        occupant_id: workOrder.occupant_id || "",
        assigned_to: workOrder.assigned_to || "",
        estimated_cost: workOrder.estimated_cost,
        due_date: workOrder.due_date ? workOrder.due_date.split("T")[0] : "",
        notes: workOrder.notes || "",
      });
    }
  }, [workOrder, reset]);

  async function onSubmit(data: any) {
    // Convert empty strings to null for optional UUID fields
    const cleanedData = {
      ...data,
      occupant_id: data.occupant_id || null,
      assigned_to: data.assigned_to || null,
    };
    await updateWorkOrder.mutateAsync({ id, data: cleanedData });
    router.push(`/work-orders/${id}`);
  }

  if (isLoading)
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );

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
    label: p.name,
  }));

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader title="Edit Work Order" backHref={`/work-orders/${id}`} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title="Work Order Details">
          <FormField
            label="Title"
            required
            error={errors.title?.message}
            {...register("title")}
          />
          <FormTextarea
            label="Description"
            required
            error={errors.description?.message}
            {...register("description")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Category"
              required
              options={WORK_ORDER_CATEGORIES as any}
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
        <FormSection title="Location & Tenant">
          <FormSelect
            label="Property"
            required
            options={propertyOptions}
            placeholder="Select property..."
            error={errors.property_id?.message}
            {...register("property_id")}
          />
          <FormSelect
            label="Tenant (optional)"
            options={tenantOptions}
            placeholder="Select tenant..."
            error={errors.occupant_id?.message}
            {...register("occupant_id")}
          />
        </FormSection>
        <FormSection title="Assignment & Schedule">
          <FormSelect
            label="Assign to Provider"
            options={providerOptions}
            placeholder="Assign later..."
            error={errors.assigned_to?.message}
            {...register("assigned_to")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Estimated Cost ($)"
              type="number"
              step="0.01"
              error={errors.estimated_cost?.message}
              {...register("estimated_cost")}
            />
            <FormField
              label="Due Date"
              type="date"
              error={errors.due_date?.message}
              {...register("due_date")}
            />
          </div>
        </FormSection>
        <FormSection title="Notes">
          <FormTextarea
            label="Internal Notes"
            error={errors.notes?.message}
            {...register("notes")}
          />
        </FormSection>
        <FormActions
          cancelHref={`/work-orders/${id}`}
          submitLabel="Save Changes"
          isLoading={updateWorkOrder.isPending}
        />
      </form>
    </div>
  );
}
