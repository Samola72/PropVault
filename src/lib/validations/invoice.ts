import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1),
  unit_price: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
});

export const invoiceSchema = z.object({
  work_order_id: z.string().uuid().optional().nullable(),
  property_id: z.string().uuid().optional().nullable(),
  occupant_id: z.string().uuid().optional().nullable(),
  service_provider_id: z.string().uuid().optional().nullable(),
  type: z.enum(["RENT", "MAINTENANCE", "DEPOSIT", "UTILITY", "OTHER"]),
  line_items: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required"),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  discount_amount: z.coerce.number().min(0).default(0),
  currency: z.string().default("USD"),
  due_date: z.string().min(1, "Due date is required"),
  notes: z.string().optional().nullable(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
