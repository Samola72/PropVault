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

const documentSchema = z.object({
  name: z.string().min(1),
  file_url: z.string().url(),
  file_type: z.string(),
  file_size: z.number(),
  category: z.string().min(1),
  description: z.string().optional().nullable(),
  property_id: z.string().uuid().optional().nullable(),
  occupant_id: z.string().uuid().optional().nullable(),
  work_order_id: z.string().uuid().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const url = new URL(request.url);
    const categoryFilter = url.searchParams.get("category");
    const propertyId = url.searchParams.get("property_id");
    const occupantId = url.searchParams.get("occupant_id");
    const workOrderId = url.searchParams.get("work_order_id");
    const search = url.searchParams.get("search");

    const supabase = await createServerSupabaseClient();

    let query = (supabase
      .from("documents") as any)
      .select(
        `*,
        uploaded_by_user:users!documents_uploaded_by_fkey(id, full_name, avatar_url),
        property:properties(id, name),
        occupant:occupants(id, full_name)`
      )
      .eq("organization_id", ctx.organizationId)
      .order("created_at", { ascending: false });

    if (search) query = query.ilike("name", `%${search}%`);
    if (categoryFilter) query = query.eq("category", categoryFilter);
    if (propertyId) query = query.eq("property_id", propertyId);
    if (occupantId) query = query.eq("occupant_id", occupantId);
    if (workOrderId) query = query.eq("work_order_id", workOrderId);

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
    const parsed = documentSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    const supabase = await createServerSupabaseClient();

    const { data, error } = await (supabase
      .from("documents") as any)
      .insert({
        ...parsed.data,
        organization_id: ctx.organizationId,
        uploaded_by: ctx.user.id,
      })
      .select()
      .single();

    if (error) return serverError(error);
    return created(data);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return badRequest("Document ID required");

    const supabase = await createServerSupabaseClient();

    // Get doc to delete from storage
    const { data: doc } = await (supabase
      .from("documents") as any)
      .select("file_url, uploaded_by")
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .single();

    if (!doc) return badRequest("Document not found");

    // Only uploader or admin can delete
    const adminRoles = ["SUPER_ADMIN", "ORG_ADMIN"];
    if (doc.uploaded_by !== ctx.user.id && !adminRoles.includes(ctx.user.role)) {
      return badRequest("Insufficient permissions");
    }

    const { error } = await (supabase
      .from("documents") as any)
      .delete()
      .eq("id", id)
      .eq("organization_id", ctx.organizationId);

    if (error) return serverError(error);

    // Delete file from storage
    const filePath = doc.file_url.split("/storage/v1/object/public/documents/")[1];
    if (filePath) {
      await supabase.storage.from("documents").remove([filePath]);
    }

    return success({ id });
  } catch (err) {
    return serverError(err);
  }
}
