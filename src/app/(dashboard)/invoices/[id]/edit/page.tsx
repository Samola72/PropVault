"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInvoice, useUpdateInvoice } from "@/hooks/use-invoices";
import { FormField } from "@/components/forms/form-field";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSection } from "@/components/forms/form-section";
import { FormActions } from "@/components/forms/form-actions";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/lib/constants";

const invoiceSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "PARTIAL", "CANCELLED"]),
  due_date: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PARTIAL", label: "Partially Paid" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: invoice, isLoading } = useInvoice(id);
  const updateInvoice = useUpdateInvoice();

  const { register, handleSubmit, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    values: invoice ? {
      status: invoice.status,
      due_date: invoice.due_date?.split("T")[0] || "",
      notes: invoice.notes || "",
    } : undefined,
  });

  async function onSubmit(data: InvoiceFormData) {
    await updateInvoice.mutateAsync({ id, data });
    router.push(`/invoices/${id}`);
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title={`Edit Invoice ${invoice.invoice_number}`}
        description="Update invoice status and details"
        backHref={`/invoices/${id}`}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title="Invoice Status" description="Update the invoice status and due date">
          <FormSelect
            label="Status"
            required
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            {...register("status")}
          />
          <FormField
            label="Due Date"
            required
            type="date"
            error={errors.due_date?.message}
            {...register("due_date")}
          />
        </FormSection>

        <FormSection title="Notes">
          <FormTextarea
            label="Invoice Notes (optional)"
            placeholder="Payment instructions or any other relevant information..."
            error={errors.notes?.message}
            {...register("notes")}
          />
        </FormSection>

        <FormActions
          cancelHref={`/invoices/${id}`}
          submitLabel="Update Invoice"
          isLoading={updateInvoice.isPending}
        />
      </form>
    </div>
  );
}
