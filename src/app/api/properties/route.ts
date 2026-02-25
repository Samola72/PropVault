import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getRequestContext,
  getPaginationParams,
  unauthorized,
  serverError,
  success,
  created,
  badRequest,
  logAudit,
} from "@/lib/api/helpers";
import { propertySchema } from "@/lib/validations/property";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const { page, limit, offset, search, sortBy, sortOrder } =
      getPaginationParams(new URL(request.url));

    const statusFilter = request.nextUrl.searchParams.get("status");
    const typeFilter = request.nextUrl.searchParams.get("type");

    const supabase = await createServerSupabaseClient();

    let query = (supabase
      .from("properties") as any)
      .select("*, occupants(id, status), work_orders(id, status)", {
        count: "exact",
      })
      .eq("organization_id", ctx.organizationId);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,address_line1.ilike.%${search}%,city.ilike.%${search}%`
      );
    }
    if (statusFilter) query = query.eq("status", statusFilter);
    if (typeFilter) query = query.eq("type", typeFilter);

    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) return serverError(error);

    return success({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const allowedRoles = ["SUPER_ADMIN", "ORG_ADMIN", "PROPERTY_MANAGER"];
    if (!allowedRoles.includes(ctx.user.role)) {
      return NextResponse.json({ error: "Forbidden", data: null }, { status: 403 });
    }

    const body = await request.json();
    const parsed = propertySchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await (supabase
      .from("properties") as any)
      .insert({
        ...parsed.data,
        organization_id: ctx.organizationId,
        created_by: ctx.user.id,
      })
      .select()
      .single();

    if (error) return serverError(error);

    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.user.id,
      action: "CREATE",
      entityType: "property",
      entityId: data.id,
      changes: parsed.data,
    });

    return created(data);
  } catch (err) {
    return serverError(err);
  }
}
