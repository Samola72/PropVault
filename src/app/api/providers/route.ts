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
import { providerSchema } from "@/lib/validations/provider";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const url = new URL(request.url);
    const { page, limit, offset, search, sortBy, sortOrder } =
      getPaginationParams(url);

    const specialtyFilter = url.searchParams.get("specialty");
    const availabilityFilter = url.searchParams.get("availability_status");
    const verifiedOnly = url.searchParams.get("verified") === "true";

    const supabase = await createServerSupabaseClient();

    let query = (supabase
      .from("service_providers") as any)
      .select("*", { count: "exact" })
      .eq("organization_id", ctx.organizationId)
      .eq("is_active", true);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }
    if (specialtyFilter) {
      query = query.contains("specialties", [specialtyFilter]);
    }
    if (availabilityFilter) {
      query = query.eq("availability_status", availabilityFilter);
    }
    if (verifiedOnly) {
      query = query.eq("is_verified", true);
    }

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
    const parsed = providerSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    const supabase = await createServerSupabaseClient();

    // Check for duplicate email within org
    const { data: existing } = await (supabase
      .from("service_providers") as any)
      .select("id")
      .eq("organization_id", ctx.organizationId)
      .eq("email", parsed.data.email)
      .single();

    if (existing) return badRequest("A provider with this email already exists");

    const { data, error } = await (supabase
      .from("service_providers") as any)
      .insert({
        ...parsed.data,
        organization_id: ctx.organizationId,
      })
      .select()
      .single();

    if (error) return serverError(error);

    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.user.id,
      action: "CREATE",
      entityType: "service_provider",
      entityId: data.id,
    });

    return created(data);
  } catch (err) {
    return serverError(err);
  }
}
