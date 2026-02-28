import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  total: z.number().min(0),
});

export const invoiceSchema = z.object({
  type: z.enum(["RENT", "MAINTENANCE", "DEPOSIT", "UTILITY", "OTHER"]),
  property_id: z.string().uuid("Please select a property"),
  occupant_id: z.string().optional(),
  work_order_id: z.string().optional(),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().min(1, "Due date is required"),
  line_items: z.array(lineItemSchema).min(1, "At least one line item is required"),
  tax_rate: z.number().min(0).max(100),
  discount_amount: z.number().min(0),
  notes: z.string().optional(),
  currency: z.string(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
