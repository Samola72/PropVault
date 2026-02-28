"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { useCreateInvoice } from "@/hooks/use-invoices";
import { useProperties } from "@/hooks/use-properties";
import { useTenants } from "@/hooks/use-tenants";
import { useWorkOrders } from "@/hooks/use-work-orders";
import { FormField } from "@/components/forms/form-field";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSection } from "@/components/forms/form-section";
import { FormActions } from "@/components/forms/form-actions";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const invoiceSchema = z.object({
  type: z.enum(["RENT", "MAINTENANCE", "UTILITY", "DEPOSIT", "LATE_FEE", "OTHER"]),
  property_id: z.string().uuid("Please select a property"),
  occupant_id: z.string().optional(),
  work_order_id: z.string().optional(),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().min(1, "Due date is required"),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  discount_amount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  currency: z.string().default("USD"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const INVOICE_TYPES = [
  { value: "RENT", label: "Rent" },
  { value: "MAINTENANCE", label: "Maintenance / Repair" },
  { value: "UTILITY", label: "Utility" },
  { value: "DEPOSIT", label: "Security Deposit" },
  { value: "LATE_FEE", label: "Late Fee" },
  { value: "OTHER", label: "Other" },
];

const today = new Date().toISOString().split("T")[0];
const defaultDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPropertyId = searchParams.get("property_id") || "";

  const createInvoice = useCreateInvoice();
  const { data: propertiesData } = useProperties({});
  const { data: tenantsData } = useTenants({ status: "ACTIVE" });
  const { data: workOrdersData } = useWorkOrders({ status: "COMPLETED" });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0, total: 0 },
  ]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      type: "RENT",
      issue_date: today,
      due_date: defaultDue,
      tax_rate: 0,
      discount_amount: 0,
      currency: "USD",
      property_id: defaultPropertyId,
    },
  });

  const taxRate = parseFloat(watch("tax_rate")?.toString() || "0") || 0;
  const discountAmount = parseFloat(watch("discount_amount")?.toString() || "0") || 0;

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - discountAmount;

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "quantity" || field === "unit_price") {
        updated[index].total = Number(updated[index].quantity) * Number(updated[index].unit_price);
      }
      return updated;
    });
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0, total: 0 }]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(data: InvoiceFormData) {
    const validLineItems = lineItems.filter((item) => item.description.trim() && item.total > 0);
    if (validLineItems.length === 0) {
      alert("Please add at least one line item with a description and amount");
      return;
    }

    // Convert empty strings to null for optional UUID fields
    const invoice = await createInvoice.mutateAsync({
      ...data,
      occupant_id: data.occupant_id || null,
      work_order_id: data.work_order_id || null,
      line_items: validLineItems,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      balance: total,
    });
    router.push(`/invoices/${invoice.id}`);
  }

  const propertyOptions = (propertiesData?.data || []).map((p: any) => ({ value: p.id, label: p.name }));
  const tenantOptions = (tenantsData?.data || []).map((t: any) => ({ value: t.id, label: t.full_name }));
  const workOrderOptions = (workOrdersData?.data || []).map((w: any) => ({ value: w.id, label: w.title }));

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title="Create Invoice"
        description="Generate a new invoice for rent, maintenance, or other charges"
        backHref={ROUTES.INVOICES}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title="Invoice Details" description="Basic invoice information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Invoice Type"
              required
              options={INVOICE_TYPES}
              error={errors.type?.message}
              {...register("type")}
            />
            <FormField
              label="Currency"
              defaultValue="USD"
              error={errors.currency?.message}
              {...register("currency")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Issue Date"
              required
              type="date"
              error={errors.issue_date?.message}
              {...register("issue_date")}
            />
            <FormField
              label="Due Date"
              required
              type="date"
              error={errors.due_date?.message}
              {...register("due_date")}
            />
          </div>
        </FormSection>

        <FormSection title="Billing To" description="Property, tenant, and related work order">
          <FormSelect
            label="Property"
            required
            options={propertyOptions}
            placeholder="Select property..."
            error={errors.property_id?.message}
            {...register("property_id")}
          />
          <FormSelect
            label="Tenant (optional)"
            options={tenantOptions}
            placeholder="Select tenant..."
            error={errors.occupant_id?.message}
            {...register("occupant_id")}
          />
          <FormSelect
            label="Related Work Order (optional)"
            options={workOrderOptions}
            placeholder="Link to a completed work order..."
            error={errors.work_order_id?.message}
            {...register("work_order_id")}
          />
        </FormSection>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Line Items</h3>
              <p className="text-sm text-gray-500 mt-0.5">Add charges to this invoice</p>
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />Add Item
            </button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <input
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    placeholder="Description"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                    placeholder="Qty"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(item.total)}</span>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-2 mt-2 mb-3 text-xs text-gray-400 font-medium uppercase">
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-8 text-right text-sm text-gray-500">Subtotal</div>
              <div className="col-span-4 text-right text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5 text-right text-sm text-gray-500">Tax Rate (%)</div>
              <div className="col-span-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  {...register("tax_rate")}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-4 text-right text-sm font-medium text-gray-900">{formatCurrency(taxAmount)}</div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5 text-right text-sm text-gray-500">Discount ($)</div>
              <div className="col-span-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("discount_amount")}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-4 text-right text-sm font-medium text-green-600">-{formatCurrency(discountAmount)}</div>
            </div>
            <div className="grid grid-cols-12 gap-2 pt-2 border-t border-gray-200">
              <div className="col-span-8 text-right text-base font-bold text-gray-900">Total</div>
              <div className="col-span-4 text-right text-base font-bold text-gray-900">{formatCurrency(total)}</div>
            </div>
          </div>
        </div>

        <FormSection title="Notes">
          <FormTextarea
            label="Invoice Notes (optional)"
            placeholder="Payment instructions, bank details, or any other relevant information..."
            error={errors.notes?.message}
            {...register("notes")}
          />
        </FormSection>

        <FormActions
          cancelHref={ROUTES.INVOICES}
          submitLabel="Create Invoice"
          isLoading={createInvoice.isPending}
        />
      </form>
    </div>
  );
}
