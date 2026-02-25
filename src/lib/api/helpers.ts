import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { User } from "@/types/database";

export interface RequestContext {
  user: User;
  organizationId: string;
}

export async function getRequestContext(): Promise<RequestContext | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return null;

    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .eq("is_active", true)
      .single();

    if (!userProfile) return null;

    const typedProfile = userProfile as any;
    return {
      user: typedProfile as User,
      organizationId: typedProfile.organization_id,
    };
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized", data: null },
    { status: 401 }
  );
}

export function forbidden() {
  return NextResponse.json(
    { error: "Forbidden — insufficient permissions", data: null },
    { status: 403 }
  );
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message, data: null }, { status: 400 });
}

export function notFound(entity = "Resource") {
  return NextResponse.json(
    { error: `${entity} not found`, data: null },
    { status: 404 }
  );
}

export function serverError(error?: unknown) {
  console.error("API error:", error);
  return NextResponse.json(
    { error: "Internal server error", data: null },
    { status: 500 }
  );
}

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ data, error: null }, { status: 201 });
}

export async function logAudit(params: {
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: unknown;
}) {
  try {
    const admin = createAdminClient();
    await (admin.from("audit_logs") as any).insert({
      organization_id: params.organizationId,
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      changes: params.changes as never,
    });
  } catch (err) {
    // Audit log failure should not break the request
    console.error("Audit log error:", err);
  }
}

export function getPaginationParams(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") || "20"))
  );
  const offset = (page - 1) * limit;
  const search = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sortBy") || "created_at";
  const sortOrder = (url.searchParams.get("sortOrder") || "desc") as "asc" | "desc";

  return { page, limit, offset, search, sortBy, sortOrder };
}
