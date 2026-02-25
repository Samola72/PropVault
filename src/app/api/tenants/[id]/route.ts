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
import { tenantUpdateSchema } from "@/lib/validations/tenant";

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
      .from("occupants") as any)
      .select(
        `*,
        property:properties(id, name, address_line1, city, state, type),
        work_orders:work_orders(
          id, title, status, priority, category, created_at
        ),
        invoices:invoices(
          id, invoice_number, total_amount, status, due_date, issue_date
        ),
        documents(*)`
      )
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .single();

    if (error || !data) return notFound("Tenant");

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

    const allowedRoles = ["SUPER_ADMIN", "ORG_ADMIN", "PROPERTY_MANAGER"];
    if (!allowedRoles.includes(ctx.user.role)) {
      return NextResponse.json({ error: "Forbidden", data: null }, { status: 403 });
    }

    const body = await request.json();
    const parsed = tenantUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await (supabase
      .from("occupants") as any)
      .update(parsed.data)
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .select("*, property:properties(id, name)")
      .single();

    if (error || !data) return notFound("Tenant");

    // If tenant status changed to INACTIVE, update property
    if (parsed.data.status === "INACTIVE") {
      const { data: remainingTenants } = await (supabase
        .from("occupants") as any)
        .select("id")
        .eq("property_id", data.property_id)
        .eq("status", "ACTIVE");

      if (!remainingTenants || remainingTenants.length === 0) {
        await (supabase
          .from("properties") as any)
          .update({ status: "AVAILABLE" })
          .eq("id", data.property_id);
      }
    }

    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.user.id,
      action: "UPDATE",
      entityType: "occupant",
      entityId: id,
      changes: parsed.data,
    });

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

    // Get tenant before deletion for property update
    const { data: tenant } = await (supabase
      .from("occupants") as any)
      .select("property_id")
      .eq("id", id)
      .single();

    const { error } = await (supabase
      .from("occupants") as any)
      .delete()
      .eq("id", id)
      .eq("organization_id", ctx.organizationId);

    if (error) return serverError(error);

    // Check if property now has no active tenants
    if (tenant) {
      const { data: remaining } = await (supabase
        .from("occupants") as any)
        .select("id")
        .eq("property_id", tenant.property_id)
        .eq("status", "ACTIVE");

      if (!remaining || remaining.length === 0) {
        await (supabase
          .from("properties") as any)
          .update({ status: "AVAILABLE" })
          .eq("id", tenant.property_id);
      }
    }

    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.user.id,
      action: "DELETE",
      entityType: "occupant",
      entityId: id,
    });

    return success({ id });
  } catch (err) {
    return serverError(err);
  }
}
