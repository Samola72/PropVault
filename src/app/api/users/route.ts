import { getRequestContext, unauthorized, success, serverError } from "@/lib/api/helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, avatar_url")
      .eq("organization_id", ctx.organizationId)
      .neq("id", ctx.user.id) // Exclude self
      .order("full_name");

    if (error) return serverError(error.message);

    return success(data || []);
  } catch (err: any) {
    return serverError(err.message);
  }
}
