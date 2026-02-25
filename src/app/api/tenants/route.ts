import { NextRequest } from "next/server";
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
import { tenantSchema } from "@/lib/validations/tenant";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const url = new URL(request.url);
    const { page, limit, offset, search, sortBy, sortOrder } = getPaginationParams(url);

    const statusFilter = url.searchParams.get("status");
    const propertyId = url.searchParams.get("property_id");

    const supabase = await createServerSupabaseClient();

    let query = (supabase
      .from("occupants") as any)
      .select(
        `*,
        property:properties(id, name, address_line1, city, type)`,
        { count: "exact" }
      )
      .eq("organization_id", ctx.organizationId);

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }
    if (statusFilter) query = query.eq("status", statusFilter);
    if (propertyId) query = query.eq("property_id", propertyId);

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
      return badRequest("Insufficient permissions");
    }

    const body = await request.json();
    const parsed = tenantSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    // Validate lease dates
    if (new Date(parsed.data.lease_end) <= new Date(parsed.data.lease_start)) {
      return badRequest("Lease end date must be after lease start date");
    }

    const supabase = await createServerSupabaseClient();

    // Check if property is in same org
    const { data: property } = await (supabase
      .from("properties") as any)
      .select("id, status")
      .eq("id", parsed.data.property_id)
      .eq("organization_id", ctx.organizationId)
      .single();

    if (!property) return badRequest("Property not found");

    const { data, error } = await (supabase
      .from("occupants") as any)
      .insert({
        ...parsed.data,
        organization_id: ctx.organizationId,
        created_by: ctx.user.id,
      })
      .select("*, property:properties(id, name, address_line1, city)")
      .single();

    if (error) return serverError(error);

    // Update property status to OCCUPIED
    await (supabase
      .from("properties") as any)
      .update({ status: "OCCUPIED" })
      .eq("id", parsed.data.property_id);

    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.user.id,
      action: "CREATE",
      entityType: "occupant",
      entityId: data.id,
      changes: parsed.data,
    });

    return created(data);
  } catch (err) {
    return serverError(err);
  }
}
