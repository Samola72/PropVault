"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Building2, Wrench, DollarSign,
  Edit, Trash2, CheckCircle2, Send, Printer, Link2
} from "lucide-react";
import { useInvoice } from "@/hooks/use-invoices";
import { useSendRentPaymentLink } from "@/hooks/use-billing";
import { DetailHeader } from "@/components/shared/detail-header";
import { InfoCard, InfoRow } from "@/components/shared/info-row";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: invoice, isLoading } = useInvoice(id);
  const sendPaymentLink = useSendRentPaymentLink();

  if (isLoading) {
    return <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>;
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Invoice not found</p>
        <Link href={ROUTES.INVOICES} className="text-blue-600 text-sm hover:underline mt-2 inline-block">Back to invoices</Link>
      </div>
    );
  }

  const lineItems = invoice.line_items || [];
  const isPaid = invoice.status === "PAID";
  const isCancelled = invoice.status === "CANCELLED";
  const isDraft = invoice.status === "DRAFT";

  return (
    <div className="animate-fade-in">
      <DetailHeader
        title={`Invoice ${invoice.invoice_number}`}
        subtitle={`Created ${formatDate(invoice.created_at)}`}
        backHref={ROUTES.INVOICES}
        backLabel="Invoices"
        badge={<StatusBadge status={invoice.status} />}
        actions={[
          ...(!isPaid && !isCancelled
            ? [
                {
                  label: sendPaymentLink.isPending
                    ? "Generating..."
                    : "Send Payment Link",
                  icon: <Link2 className="w-4 h-4" />,
                  onClick: () => sendPaymentLink.mutate(id),
                },
              ]
            : []),
          {
            label: "Print",
            icon: <Printer className="w-4 h-4" />,
            onClick: () => window.print(),
          },
          {
            label: "Edit",
            icon: <Edit className="w-4 h-4" />,
            onClick: () => router.push(`/invoices/${id}/edit`),
          },
        ]}
      />

      {/* Record Payment Panel */}
      {paymentOpen && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 animate-fade-in">
          <h3 className="text-sm font-semibold text-green-900 mb-4">Record Payment</h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-green-800 mb-1.5">
                Payment Amount (Balance: {formatCurrency(invoice.balance)})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={invoice.balance.toString()}
                  step="0.01"
                  className="w-full pl-7 pr-3 py-2.5 border border-green-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <button
              onClick={() => setPaymentOpen(false)}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Record
            </button>
            <button
              onClick={() => setPaymentOpen(false)}
              className="px-4 py-2.5 text-green-700 text-sm font-medium hover:bg-green-100 rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Line Items */}
          <InfoCard title="Line Items">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Description", "Qty", "Unit Price", "Total"].map(h => (
                      <th key={h} className={`py-3 text-xs font-semibold text-gray-500 uppercase ${h === "Description" ? "text-left" : "text-right"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lineItems.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="py-3.5 text-sm text-gray-800">{item.description}</td>
                      <td className="py-3.5 text-sm text-gray-600 text-right">{item.quantity}</td>
                      <td className="py-3.5 text-sm text-gray-600 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3.5 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                  <span className="text-gray-900">{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(invoice.total_amount)}</span>
              </div>
              {invoice.paid_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-green-600">-{formatCurrency(invoice.paid_amount)}</span>
                </div>
              )}
              {invoice.balance > 0 && (
                <div className="flex justify-between text-base font-bold text-red-600 pt-2 border-t border-gray-100">
                  <span>Balance Due</span>
                  <span>{formatCurrency(invoice.balance)}</span>
                </div>
              )}
            </div>
          </InfoCard>

          {invoice.notes && (
            <InfoCard title="Notes">
              <p className="text-sm text-gray-600 leading-relaxed">{invoice.notes}</p>
            </InfoCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <InfoCard title="Invoice Details">
            <InfoRow label="Invoice #" value={<span className="font-mono">{invoice.invoice_number}</span>} />
            <InfoRow label="Type" value={invoice.type} />
            <InfoRow label="Currency" value={invoice.currency} />
            <InfoRow label="Issue Date" value={formatDate(invoice.issue_date)} />
            <InfoRow label="Due Date" value={
              <span className={new Date(invoice.due_date) < new Date() && !isPaid ? "text-red-600 font-semibold" : ""}>
                {formatDate(invoice.due_date)}
              </span>
            } />
            {invoice.paid_date && <InfoRow label="Paid Date" value={formatDate(invoice.paid_date)} />}
          </InfoCard>

          {invoice.property && (
            <InfoCard title="Property">
              <Link href={`/properties/${invoice.property.id}`} className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600 group-hover:underline">{invoice.property.name}</p>
                </div>
              </Link>
            </InfoCard>
          )}

          {invoice.work_order && (
            <InfoCard title="Related Work Order">
              <Link href={`/work-orders/${invoice.work_order.id}`} className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-600 group-hover:underline truncate">{invoice.work_order.title}</p>
                  <p className="text-xs text-gray-500 capitalize">{invoice.work_order.category?.replace("_", " ")}</p>
                </div>
              </Link>
            </InfoCard>
          )}

          {/* Payment Summary */}
          <InfoCard title="Payment Summary">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Paid</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(invoice.paid_amount)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{
                    width: invoice.total_amount > 0
                      ? `${Math.min(100, (invoice.paid_amount / invoice.total_amount) * 100)}%`
                      : "0%"
                  }}
                />
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Balance</span>
                <span className={`text-sm font-bold ${invoice.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(invoice.balance)}
                </span>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
