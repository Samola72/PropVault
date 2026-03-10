import { z } from "zod";

export const tenantSchema = z.object({
  property_id: z.string().uuid("Invalid property"),
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  national_id: z.string().optional(),
  emergency_contact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    })
    .optional(),
  lease_start: z.string().min(1, "Lease start date is required"),
  lease_end: z.string().min(1, "Lease end date is required"),
  monthly_rent: z.number().min(0, "Monthly rent is required"),
  security_deposit: z.number().min(0).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "EVICTION", "PENDING"]).optional(),
  notes: z.string().optional(),
});

export type TenantFormData = z.infer<typeof tenantSchema>;
export const tenantUpdateSchema = tenantSchema.partial();

// For API - applies defaults for optional fields
export const tenantCreateSchema = tenantSchema.transform((data) => ({
  ...data,
  security_deposit: data.security_deposit ?? 0,
  status: data.status ?? "ACTIVE",
}));
