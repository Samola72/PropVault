import { z } from "zod";

export const propertySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  address_line1: z.string().min(5, "Address is required"),
  address_line2: z.string().optional().nullable(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postal_code: z.string().min(2, "Postal code is required"),
  country: z.string().default("United States"),
  type: z.enum([
    "APARTMENT", "HOUSE", "COMMERCIAL", "CONDO",
    "TOWNHOUSE", "MULTI_FAMILY", "LAND", "OTHER",
  ]),
  status: z
    .enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RENOVATION", "OFF_MARKET"])
    .default("AVAILABLE"),
  bedrooms: z.coerce.number().min(0).optional().nullable(),
  bathrooms: z.coerce.number().min(0).optional().nullable(),
  square_feet: z.coerce.number().min(0).optional().nullable(),
  year_built: z.coerce.number().min(1800).max(new Date().getFullYear()).optional().nullable(),
  monthly_rent: z.coerce.number().min(0).optional().nullable(),
  purchase_price: z.coerce.number().min(0).optional().nullable(),
  amenities: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

export const propertyUpdateSchema = propertySchema.partial();
