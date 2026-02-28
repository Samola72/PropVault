"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { X } from "lucide-react";
import { useCreateProvider } from "@/hooks/use-providers";
import { FormField } from "@/components/forms/form-field";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSection } from "@/components/forms/form-section";
import { FormActions } from "@/components/forms/form-actions";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES, WORK_ORDER_CATEGORIES } from "@/lib/constants";
import { providerSchema, type ProviderFormData } from "@/lib/validations/provider";

const AVAILABILITY_OPTIONS = [
  { value: "AVAILABLE", label: "Available — Ready for new jobs" },
  { value: "BUSY", label: "Busy — Currently on active jobs" },
  { value: "UNAVAILABLE", label: "Unavailable — Not accepting work" },
];

type Specialty = "PLUMBING" | "ELECTRICAL" | "HVAC" | "APPLIANCE" | "STRUCTURAL" | "PEST_CONTROL" | "CLEANING" | "LANDSCAPING" | "SECURITY" | "PAINTING" | "FLOORING" | "ROOFING" | "OTHER";

export default function NewProviderPage() {
  const router = useRouter();
  const createProvider = useCreateProvider();
  const [selectedSpecialties, setSelectedSpecialties] = useState<Specialty[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      availability_status: "AVAILABLE",
      specialties: [],
    },
  });

  function toggleSpecialty(value: string) {
    const updated = selectedSpecialties.includes(value as Specialty)
      ? selectedSpecialties.filter((s) => s !== value)
      : [...selectedSpecialties, value as Specialty];
    setSelectedSpecialties(updated);
    setValue("specialties", updated, { shouldValidate: true });
  }

  async function onSubmit(data: ProviderFormData) {
    const provider = await createProvider.mutateAsync(data);
    router.push(`/providers/${provider.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title="Add Service Provider"
        description="Add a contractor or service provider to your directory"
        backHref={ROUTES.PROVIDERS}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title="Provider Information" description="Contact details and company info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Full Name"
              required
              placeholder="John Smith"
              error={errors.name?.message}
              {...register("name")}
            />
            <FormField
              label="Company Name (optional)"
              placeholder="Smith Plumbing LLC"
              error={errors.company_name?.message}
              {...register("company_name")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Email"
              required
              type="email"
              placeholder="john@smithplumbing.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <FormField
              label="Phone"
              required
              type="tel"
              placeholder="+1 (555) 000-0000"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="License Number (optional)"
              placeholder="LIC-12345"
              error={errors.license_number?.message}
              {...register("license_number")}
            />
            <FormField
              label="Hourly Rate ($)"
              type="number"
              min="0"
              step="0.01"
              placeholder="75.00"
              error={errors.hourly_rate?.message}
              {...register("hourly_rate", { valueAsNumber: true })}
            />
          </div>
          <FormSelect
            label="Availability Status"
            required
            options={AVAILABILITY_OPTIONS}
            error={errors.availability_status?.message}
            {...register("availability_status")}
          />
        </FormSection>

        <FormSection
          title="Specialties"
          description="Select all service categories this provider covers"
        >
          <div className="flex flex-wrap gap-2">
            {WORK_ORDER_CATEGORIES.map((cat) => {
              const selected = selectedSpecialties.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleSpecialty(cat.value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition ${
                    selected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
          {selectedSpecialties.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 mt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 self-center">Selected:</span>
              {selectedSpecialties.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium"
                >
                  {s.replace(/_/g, " ")}
                  <button type="button" onClick={() => toggleSpecialty(s)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.specialties && (
            <p className="text-xs text-red-600">{errors.specialties.message}</p>
          )}
        </FormSection>

        <FormSection title="Notes">
          <FormTextarea
            label="Additional Notes (optional)"
            placeholder="Insurance details, service area, preferred contact method..."
            error={errors.notes?.message}
            {...register("notes")}
          />
        </FormSection>

        <FormActions
          cancelHref={ROUTES.PROVIDERS}
          submitLabel="Add Provider"
          isLoading={createProvider.isPending}
        />
      </form>
    </div>
  );
}
