import { NextRequest } from "next/server";
import {
  getRequestContext,
  unauthorized,
  badRequest,
  serverError,
  success,
} from "@/lib/api/helpers";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createRentPaymentLink } from "@/lib/stripe/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const ctx = await getRequestContext(supabase);
    if (!ctx) return unauthorized();

    const { invoice_id } = await req.json();
    if (!invoice_id) return badRequest("invoice_id is required");

    // Fetch invoice with occupant
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(
        `
        *,
        occupant:occupants(id, full_name, email),
        property:properties(name)
      `
      )
      .eq("id", invoice_id)
      .eq("organization_id", ctx.organizationId)
      .single();

    if (error || !invoice) return badRequest("Invoice not found");
    if (!invoice.occupant?.email)
      return badRequest("Tenant email is required to send payment link");
    if (invoice.status === "PAID")
      return badRequest("Invoice is already paid");

    const amountCents = Math.round(invoice.balance * 100);
    if (amountCents <= 0) return badRequest("Invoice balance is zero");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const paymentUrl = await createRentPaymentLink({
      amount: amountCents,
      description: `${invoice.type === "RENT" ? "Rent" : "Payment"} — ${invoice.property?.name} — Invoice ${invoice.invoice_number}`,
      tenantEmail: invoice.occupant.email,
      invoiceId: invoice.id,
      organizationId: ctx.organizationId,
      successUrl: `${appUrl}/invoices/${invoice.id}?payment=success`,
    });

    // Save payment link to invoice
    await supabase
      .from("invoices")
      .update({ stripe_payment_link: paymentUrl })
      .eq("id", invoice.id);

    return success({ url: paymentUrl });
  } catch (err: any) {
    return serverError(err.message);
  }
}
