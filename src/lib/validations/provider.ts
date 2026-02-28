import { z } from "zod";

export const providerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  company_name: z.string().optional(),
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
  license_number: z.string().optional(),
  hourly_rate: z.number().min(0).optional(),
  availability_status: z.enum(["AVAILABLE", "BUSY", "UNAVAILABLE"]),
  notes: z.string().optional(),
});

export type ProviderFormData = z.infer<typeof providerSchema>;
export const providerUpdateSchema = providerSchema.partial();
