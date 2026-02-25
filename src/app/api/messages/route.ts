import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getRequestContext,
  unauthorized,
  serverError,
  success,
  created,
  badRequest,
} from "@/lib/api/helpers";
import { z } from "zod";

const messageSchema = z.object({
  recipient_id: z.string().uuid().optional().nullable(),
  property_id: z.string().uuid().optional().nullable(),
  work_order_id: z.string().uuid().optional().nullable(),
  type: z.enum(["DIRECT", "BROADCAST", "SYSTEM"]).default("DIRECT"),
  subject: z.string().optional().nullable(),
  body: z.string().min(1, "Message body is required"),
  attachments: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const url = new URL(request.url);
    const thread = url.searchParams.get("thread");
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "30"));

    const supabase = await createServerSupabaseClient();

    let query = (supabase
      .from("messages") as any)
      .select(
        `*,
        sender:users!messages_sender_id_fkey(id, full_name, avatar_url, role),
        recipient:users!messages_recipient_id_fkey(id, full_name, avatar_url, role)`
      )
      .eq("organization_id", ctx.organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (thread === "inbox") {
      query = query.eq("recipient_id", ctx.user.id);
    } else if (thread === "sent") {
      query = query.eq("sender_id", ctx.user.id);
    } else {
      query = query.or(
        `sender_id.eq.${ctx.user.id},recipient_id.eq.${ctx.user.id},type.eq.BROADCAST`
      );
    }

    const { data, error } = await query;
    if (error) return serverError(error);

    return success(data || []);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    const supabase = await createServerSupabaseClient();

    const { data, error } = await (supabase
      .from("messages") as any)
      .insert({
        ...parsed.data,
        organization_id: ctx.organizationId,
        sender_id: ctx.user.id,
      })
      .select(
        `*,
        sender:users!messages_sender_id_fkey(id, full_name, avatar_url),
        recipient:users!messages_recipient_id_fkey(id, full_name, avatar_url)`
      )
      .single();

    if (error) return serverError(error);

    // Create notification for recipient
    if (parsed.data.recipient_id) {
      await (supabase.from("notifications") as any).insert({
        organization_id: ctx.organizationId,
        user_id: parsed.data.recipient_id,
        type: "MESSAGE_RECEIVED",
        title: "New Message",
        message: `${ctx.user.full_name}: ${parsed.data.body.substring(0, 100)}`,
        data: { message_id: data.id },
      });
    }

    return created(data);
  } catch (err) {
    return serverError(err);
  }
}
