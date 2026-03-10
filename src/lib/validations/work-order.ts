import { z } from "zod";

// Custom refinement to allow empty strings for optional UUID fields
const optionalUuid = z.string().refine(
  (val) => val === "" || z.string().uuid().safeParse(val).success,
  { message: "Invalid UUID" }
).optional();

const optionalString = z.string().optional();

export const workOrderSchema = z.object({
  property_id: z.string().uuid("Invalid property"),
  occupant_id: optionalUuid,
  title: z.string().min(5, "Title must be at least 5 characters").max(500),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum([
    "PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "STRUCTURAL",
    "PEST_CONTROL", "CLEANING", "LANDSCAPING", "SECURITY",
    "PAINTING", "FLOORING", "ROOFING", "OTHER",
  ]),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  estimated_cost: z.number().min(0).optional(),
  due_date: optionalString,
  assigned_to: optionalUuid,
  notes: optionalString,
  internal_notes: optionalString,
});

export const workOrderUpdateSchema = z.object({
  status: z.enum([
    "OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING_PARTS",
    "COMPLETED", "CLOSED", "CANCELLED",
  ]),
  message: z.string().min(1, "Update message is required"),
  actual_cost: z.number().min(0).optional(),
  images: z.array(z.string()).default([]),
});

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;
export type WorkOrderUpdateData = z.infer<typeof workOrderUpdateSchema>;
