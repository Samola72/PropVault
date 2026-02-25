import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getRequestContext,
  unauthorized,
  notFound,
  serverError,
  success,
  badRequest,
  logAudit,
} from "@/lib/api/helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const supabase = await createServerSupabaseClient();

    const { data, error } = await (supabase
      .from("invoices") as any)
      .select(
        `*,
        property:properties(id, name, address_line1, city, state),
        work_order:work_orders(id, title, category, status),
        occupant:occupants(id, full_name, email, phone),
        service_provider:service_providers(id, name, email, phone)`
      )
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .single();

    if (error || !data) return notFound("Invoice");
    return success(data);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const allowedRoles = ["SUPER_ADMIN", "ORG_ADMIN", "PROPERTY_MANAGER", "ACCOUNTANT"];
    if (!allowedRoles.includes(ctx.user.role)) {
      return NextResponse.json({ error: "Forbidden", data: null }, { status: 403 });
    }

    const body = await request.json();
    const supabase = await createServerSupabaseClient();

    // Handle payment recording
    if (body.action === "RECORD_PAYMENT") {
      const { payment_amount, payment_date } = body;
      if (!payment_amount || payment_amount <= 0) {
        return badRequest("Invalid payment amount");
      }

      const { data: invoice } = await (supabase
        .from("invoices") as any)
        .select("total_amount, paid_amount")
        .eq("id", id)
        .single();

      if (!invoice) return notFound("Invoice");

      const newPaidAmount = invoice.paid_amount + payment_amount;
      const newStatus =
        newPaidAmount >= invoice.total_amount
          ? "PAID"
          : newPaidAmount > 0
          ? "PARTIAL"
          : invoice.paid_amount > 0
          ? "PARTIAL"
          : "SENT";

      const { data, error } = await (supabase
        .from("invoices") as any)
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          paid_date: newStatus === "PAID" ? payment_date || new Date().toISOString().substring(0, 10) : null,
        })
        .eq("id", id)
        .eq("organization_id", ctx.organizationId)
        .select()
        .single();

      if (error || !data) return serverError(error);

      await logAudit({
        organizationId: ctx.organizationId,
        userId: ctx.user.id,
        action: "PAYMENT_RECORDED",
        entityType: "invoice",
        entityId: id,
        changes: { payment_amount, new_status: newStatus },
      });

      return success(data);
    }

    // Handle status update (send, cancel, etc.)
    const allowedUpdates = ["status", "notes", "due_date"];
    const filteredBody = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowedUpdates.includes(k))
    );

    const { data, error } = await (supabase
      .from("invoices") as any)
      .update(filteredBody)
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .select()
      .single();

    if (error || !data) return notFound("Invoice");

    return success(data);
  } catch (err) {
    return serverError(err);
  }
}
