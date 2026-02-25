import { z } from "zod";

export const providerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  company_name: z.string().optional().nullable(),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Phone number is required"),
  specialties: z
    .array(
      z.enum([
        "PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "STRUCTURAL",
        "PEST_CONTROL", "CLEANING", "LANDSCAPING", "SECURITY",
        "PAINTING", "FLOORING", "ROOFING", "OTHER",
      ])
    )
    .min(1, "At least one specialty is required"),
  license_number: z.string().optional().nullable(),
  hourly_rate: z.coerce.number().min(0).optional().nullable(),
  availability_status: z
    .enum(["AVAILABLE", "BUSY", "UNAVAILABLE"])
    .default("AVAILABLE"),
  notes: z.string().optional().nullable(),
  is_verified: z.boolean().default(false),
});

export type ProviderFormData = z.infer<typeof providerSchema>;
export const providerUpdateSchema = providerSchema.partial();
