"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useProvider, useUpdateProvider } from "@/hooks/use-providers";
import { FormField } from "@/components/forms/form-field";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSection } from "@/components/forms/form-section";
import { FormActions } from "@/components/forms/form-actions";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { ROUTES, WORK_ORDER_CATEGORIES } from "@/lib/constants";

const providerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone number is required"),
  company_name: z.string().optional(),
  license_number: z.string().optional(),
  hourly_rate: z.coerce.number().min(0).optional().nullable(),
  availability_status: z.enum(["AVAILABLE", "BUSY", "UNAVAILABLE"]).default("AVAILABLE"),
  specialties: z.array(z.string()).min(1, "Select at least one specialty"),
  notes: z.string().optional(),
});

const AVAILABILITY_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "BUSY", label: "Busy" },
  { value: "UNAVAILABLE", label: "Unavailable" },
];

export default function EditProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: provider, isLoading } = useProvider(id);
  const updateProvider = useUpdateProvider();
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(providerSchema),
  });

  useEffect(() => {
    if (provider) {
      setSelectedSpecialties(provider.specialties || []);
      reset({
        name: provider.name,
        email: provider.email,
        phone: provider.phone,
        company_name: provider.company_name || "",
        license_number: provider.license_number || "",
        hourly_rate: provider.hourly_rate,
        availability_status: provider.availability_status,
        specialties: provider.specialties || [],
        notes: provider.notes || "",
      });
    }
  }, [provider, reset]);

  function toggleSpecialty(value: string) {
    const updated = selectedSpecialties.includes(value)
      ? selectedSpecialties.filter((s) => s !== value)
      : [...selectedSpecialties, value];
    setSelectedSpecialties(updated);
    setValue("specialties", updated, { shouldValidate: true });
  }

  async function onSubmit(data: any) {
    await updateProvider.mutateAsync({ id, data });
    router.push(`/providers/${id}`);
  }

  if (isLoading) return <div className="space-y-4 max-w-3xl mx-auto">{[1,2,3].map(i=><Skeleton key={i} className="h-48 rounded-2xl"/>)}</div>;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader title="Edit Provider" backHref={`/providers/${id}`} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title="Provider Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" required error={errors.name?.message} {...register("name")} />
            <FormField label="Company Name" error={errors.company_name?.message} {...register("company_name")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email" required type="email" error={errors.email?.message} {...register("email")} />
            <FormField label="Phone" required type="tel" error={errors.phone?.message} {...register("phone")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="License Number" error={errors.license_number?.message} {...register("license_number")} />
            <FormField label="Hourly Rate ($)" type="number" step="0.01" error={errors.hourly_rate?.message} {...register("hourly_rate")} />
          </div>
          <FormSelect label="Availability" required options={AVAILABILITY_OPTIONS} error={errors.availability_status?.message} {...register("availability_status")} />
        </FormSection>
        <FormSection title="Specialties">
          <div className="flex flex-wrap gap-2">
            {WORK_ORDER_CATEGORIES.map((cat) => {
              const selected = selectedSpecialties.includes(cat.value);
              return (
                <button key={cat.value} type="button" onClick={() => toggleSpecialty(cat.value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition ${selected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                  {cat.label}
                </button>
              );
            })}
          </div>
          {errors.specialties && <p className="text-xs text-red-600">{errors.specialties.message}</p>}
        </FormSection>
        <FormSection title="Notes">
          <FormTextarea label="Notes" error={errors.notes?.message} {...register("notes")} />
        </FormSection>
        <FormActions cancelHref={`/providers/${id}`} submitLabel="Save Changes" isLoading={updateProvider.isPending} />
      </form>
    </div>
  );
}
