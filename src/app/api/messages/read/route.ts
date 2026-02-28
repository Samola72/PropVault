import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRequestContext, unauthorized, success, serverError } from "@/lib/api/helpers";

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const supabase = await createServerSupabaseClient();

    const { message_id } = await req.json();

    const { data, error } = await (supabase as any)
      .from("messages")
      .update({ is_read: true })
      .eq("id", message_id)
      .eq("recipient_id", ctx.user.id)
      .select()
      .single();

    if (error) return serverError(error.message);

    return success(data);
  } catch (err: any) {
    return serverError(err.message);
  }
}
