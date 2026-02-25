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
import { workOrderSchema } from "@/lib/validations/work-order";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const url = new URL(request.url);
    const { page, limit, offset, search, sortBy, sortOrder } =
      getPaginationParams(url);

    const statusFilter = url.searchParams.get("status");
    const priorityFilter = url.searchParams.get("priority");
    const categoryFilter = url.searchParams.get("category");
    const propertyId = url.searchParams.get("property_id");
    const assignedTo = url.searchParams.get("assigned_to");

    const supabase = await createServerSupabaseClient();

    let query = (supabase
      .from("work_orders") as any)
      .select(
        `*,
        property:properties(id, name, address_line1, city),
        occupant:occupants(id, full_name, email),
        service_provider:service_providers(id, name, phone, email),
        work_order_updates(id, status, message, created_at, user:users(id, full_name, avatar_url))`,
        { count: "exact" }
      )
      .eq("organization_id", ctx.organizationId);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (statusFilter) query = query.eq("status", statusFilter);
    if (priorityFilter) query = query.eq("priority", priorityFilter);
    if (categoryFilter) query = query.eq("category", categoryFilter);
    if (propertyId) query = query.eq("property_id", propertyId);
    if (assignedTo) query = query.eq("assigned_to", assignedTo);

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

    const body = await request.json();
    const parsed = workOrderSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await (supabase
      .from("work_orders") as any)
      .insert({
        ...parsed.data,
        organization_id: ctx.organizationId,
        created_by: ctx.user.id,
        status: parsed.data.assigned_to ? "ASSIGNED" : "OPEN",
      })
      .select(
        `*,
        property:properties(id, name, address_line1),
        service_provider:service_providers(id, name, phone)`
      )
      .single();

    if (error) return serverError(error);

    // Notify assigned provider if applicable
    if (parsed.data.assigned_to) {
      await (supabase.from("notifications") as any).insert({
        organization_id: ctx.organizationId,
        user_id: ctx.user.id,
        type: "WORK_ORDER_CREATED",
        title: "New Work Order Assigned",
        message: `Work order "${parsed.data.title}" has been assigned to you`,
        data: { work_order_id: data.id },
      });
    }

    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.user.id,
      action: "CREATE",
      entityType: "work_order",
      entityId: data.id,
      changes: parsed.data,
    });

    return created(data);
  } catch (err) {
    return serverError(err);
  }
}
