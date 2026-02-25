import { z } from "zod";

export const workOrderSchema = z.object({
  property_id: z.string().uuid("Invalid property"),
  occupant_id: z.string().uuid().optional().nullable(),
  title: z.string().min(5, "Title must be at least 5 characters").max(500),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum([
    "PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "STRUCTURAL",
    "PEST_CONTROL", "CLEANING", "LANDSCAPING", "SECURITY",
    "PAINTING", "FLOORING", "ROOFING", "OTHER",
  ]),
  priority: z
    .enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
    .default("MEDIUM"),
  estimated_cost: z.coerce.number().min(0).optional().nullable(),
  due_date: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
});

export const workOrderUpdateSchema = z.object({
  status: z.enum([
    "OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING_PARTS",
    "COMPLETED", "CLOSED", "CANCELLED",
  ]),
  message: z.string().min(1, "Update message is required"),
  actual_cost: z.coerce.number().min(0).optional().nullable(),
  images: z.array(z.string()).default([]),
});

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;
export type WorkOrderUpdateData = z.infer<typeof workOrderUpdateSchema>;
