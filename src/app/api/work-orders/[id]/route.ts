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
import { workOrderUpdateSchema } from "@/lib/validations/work-order";

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
      .from("work_orders") as any)
      .select(
        `*,
        property:properties(id, name, address_line1, city, state),
        occupant:occupants(id, full_name, email, phone),
        service_provider:service_providers(id, name, company_name, phone, email, rating),
        work_order_updates(
          *,
          user:users(id, full_name, avatar_url, role)
        ),
        documents(*),
        invoices(id, invoice_number, total_amount, status)`
      )
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .order("created_at", { referencedTable: "work_order_updates", ascending: true })
      .single();

    if (error || !data) return notFound("Work Order");

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

    const body = await request.json();
    const supabase = await createServerSupabaseClient();

    // If this is a status update with message
    if (body.status && body.message) {
      const parsed = workOrderUpdateSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error.issues[0].message);

      // Add update log
      await (supabase.from("work_order_updates") as any).insert({
        work_order_id: id,
        user_id: ctx.user.id,
        status: parsed.data.status,
        message: parsed.data.message,
        images: parsed.data.images,
      });

      // Update work order
      const updates: Record<string, unknown> = {
        status: parsed.data.status,
      };

      if (parsed.data.actual_cost !== undefined) {
        updates.actual_cost = parsed.data.actual_cost;
      }

      if (parsed.data.status === "COMPLETED") {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await (supabase
        .from("work_orders") as any)
        .update(updates)
        .eq("id", id)
        .eq("organization_id", ctx.organizationId)
        .select()
        .single();

      if (error || !data) return notFound("Work Order");

      // Send notification
      await (supabase.from("notifications") as any).insert({
        organization_id: ctx.organizationId,
        user_id: ctx.user.id,
        type: "WORK_ORDER_UPDATED",
        title: `Work Order ${parsed.data.status.replace("_", " ")}`,
        message: parsed.data.message,
        data: { work_order_id: id },
      });

      await logAudit({
        organizationId: ctx.organizationId,
        userId: ctx.user.id,
        action: "STATUS_UPDATE",
        entityType: "work_order",
        entityId: id,
        changes: { status: parsed.data.status },
      });

      return success(data);
    }

    // General field update
    const { data, error } = await (supabase
      .from("work_orders") as any)
      .update(body)
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .select()
      .single();

    if (error || !data) return notFound("Work Order");

    return success(data);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const adminRoles = ["SUPER_ADMIN", "ORG_ADMIN"];
    if (!adminRoles.includes(ctx.user.role)) {
      return NextResponse.json({ error: "Forbidden", data: null }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await (supabase
      .from("work_orders") as any)
      .delete()
      .eq("id", id)
      .eq("organization_id", ctx.organizationId);

    if (error) return serverError(error);

    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.user.id,
      action: "DELETE",
      entityType: "work_order",
      entityId: id,
    });

    return success({ id });
  } catch (err) {
    return serverError(err);
  }
}
