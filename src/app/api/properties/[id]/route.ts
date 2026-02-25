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
import { propertyUpdateSchema } from "@/lib/validations/property";

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
      .from("properties") as any)
      .select(
        `*,
        occupants(*),
        work_orders(*, service_provider:service_providers(id, name, phone)),
        documents(*),
        invoices(id, invoice_number, total_amount, status, due_date)`
      )
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .single();

    if (error || !data) return notFound("Property");

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
    const parsed = propertyUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await (supabase
      .from("properties") as any)
      .update(parsed.data)
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .select()
      .single();

    if (error || !data) return notFound("Property");

    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.user.id,
      action: "UPDATE",
      entityType: "property",
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

    const { error } = await (supabase
      .from("properties") as any)
      .delete()
      .eq("id", id)
      .eq("organization_id", ctx.organizationId);

    if (error) return serverError(error);

    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.user.id,
      action: "DELETE",
      entityType: "property",
      entityId: id,
    });

    return success({ id });
  } catch (err) {
    return serverError(err);
  }
}
