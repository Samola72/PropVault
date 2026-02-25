import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getRequestContext,
  unauthorized,
  serverError,
  success,
} from "@/lib/api/helpers";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unread") === "true";
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));

    const supabase = await createServerSupabaseClient();

    let query = (supabase
      .from("notifications") as any)
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) query = query.eq("is_read", false);

    const { data, error } = await query;
    if (error) return serverError(error);

    return success(data || []);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const body = await request.json();
    const supabase = await createServerSupabaseClient();

    if (body.action === "MARK_ALL_READ") {
      await (supabase
        .from("notifications") as any)
        .update({ is_read: true })
        .eq("user_id", ctx.user.id)
        .eq("is_read", false);

      return success({ updated: true });
    }

    if (body.id) {
      await (supabase
        .from("notifications") as any)
        .update({ is_read: true })
        .eq("id", body.id)
        .eq("user_id", ctx.user.id);

      return success({ updated: true });
    }

    return success({ updated: false });
  } catch (err) {
    return serverError(err);
  }
}
