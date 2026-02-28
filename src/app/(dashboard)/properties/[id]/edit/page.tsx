"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProperty, useUpdateProperty } from "@/hooks/use-properties";
import { FormField } from "@/components/forms/form-field";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSection } from "@/components/forms/form-section";
import { FormActions } from "@/components/forms/form-actions";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/shared/loading-skeleton";

const propertyFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["APARTMENT", "HOUSE", "COMMERCIAL", "CONDO", "TOWNHOUSE", "MULTI_FAMILY", "LAND", "OTHER"]),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RENOVATION", "OFF_MARKET"]),
  address_line1: z.string().min(5, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postal_code: z.string().min(5, "ZIP code is required"),
  country: z.string().default("United States"),
  bedrooms: z.coerce.number().min(0).optional().nullable(),
  bathrooms: z.coerce.number().min(0).optional().nullable(),
  square_feet: z.coerce.number().min(0).optional().nullable(),
  year_built: z.coerce.number().min(1800).max(new Date().getFullYear()).optional().nullable(),
  monthly_rent: z.coerce.number().min(0).optional().nullable(),
  purchase_price: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional(),
});

const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "CONDO", label: "Condo" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "MULTI_FAMILY", label: "Multi Family" },
  { value: "LAND", label: "Land" },
  { value: "OTHER", label: "Other" },
];

const PROPERTY_STATUSES = [
  { value: "AVAILABLE", label: "Available" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "MAINTENANCE", label: "Under Maintenance" },
  { value: "RENOVATION", label: "Renovation" },
  { value: "OFF_MARKET", label: "Off Market" },
];

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
];

export default function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: property, isLoading } = useProperty(id);
  const updateProperty = useUpdateProperty();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(propertyFormSchema),
  });

  useEffect(() => {
    if (property) {
      reset({
        name: property.name,
        type: property.type,
        status: property.status,
        address_line1: property.address_line1,
        address_line2: property.address_line2 || "",
        city: property.city,
        state: property.state,
        postal_code: property.postal_code,
        country: property.country,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        square_feet: property.square_feet,
        year_built: property.year_built,
        monthly_rent: property.monthly_rent,
        purchase_price: property.purchase_price,
        notes: property.notes || "",
      });
    }
  }, [property, reset]);

  async function onSubmit(data: any) {
    await updateProperty.mutateAsync({ id, data });
    router.push(`/properties/${id}`);
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title="Edit Property"
        description={property?.name}
        backHref={`/properties/${id}`}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title="Basic Information">
          <FormField
            label="Property Name"
            required
            error={errors.name?.message}
            {...register("name")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Property Type"
              required
              options={PROPERTY_TYPES}
              error={errors.type?.message}
              {...register("type")}
            />
            <FormSelect
              label="Status"
              required
              options={PROPERTY_STATUSES}
              error={errors.status?.message}
              {...register("status")}
            />
          </div>
        </FormSection>

        <FormSection title="Address">
          <FormField
            label="Street Address"
            required
            placeholder="123 Main Street"
            error={errors.address_line1?.message}
            {...register("address_line1")}
          />
          <FormField
            label="Apt, Suite, Unit (optional)"
            error={errors.address_line2?.message}
            {...register("address_line2")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              label="City"
              required
              error={errors.city?.message}
              {...register("city")}
            />
            <FormSelect
              label="State"
              required
              options={US_STATES}
              placeholder="Select state"
              error={errors.state?.message}
              {...register("state")}
            />
            <FormField
              label="ZIP Code"
              required
              error={errors.postal_code?.message}
              {...register("postal_code")}
            />
          </div>
        </FormSection>

        <FormSection title="Property Specifications">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FormField
              label="Bedrooms"
              type="number"
              min="0"
              error={errors.bedrooms?.message}
              {...register("bedrooms")}
            />
            <FormField
              label="Bathrooms"
              type="number"
              min="0"
              step="0.5"
              error={errors.bathrooms?.message}
              {...register("bathrooms")}
            />
            <FormField
              label="Square Feet"
              type="number"
              min="0"
              error={errors.square_feet?.message}
              {...register("square_feet")}
            />
            <FormField
              label="Year Built"
              type="number"
              error={errors.year_built?.message}
              {...register("year_built")}
            />
          </div>
        </FormSection>

        <FormSection title="Financial Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Monthly Rent ($)"
              type="number"
              step="0.01"
              error={errors.monthly_rent?.message}
              {...register("monthly_rent")}
            />
            <FormField
              label="Purchase Price ($)"
              type="number"
              step="0.01"
              error={errors.purchase_price?.message}
              {...register("purchase_price")}
            />
          </div>
        </FormSection>

        <FormSection title="Additional Notes">
          <FormTextarea
            label="Notes"
            error={errors.notes?.message}
            {...register("notes")}
          />
        </FormSection>

        <FormActions
          cancelHref={`/properties/${id}`}
          submitLabel="Save Changes"
          isLoading={updateProperty.isPending}
        />
      </form>
    </div>
  );
}
