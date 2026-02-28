import { NextRequest } from "next/server";
import {
  getRequestContext,
  unauthorized,
  serverError,
  success,
} from "@/lib/api/helpers";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createPortalSession } from "@/lib/stripe/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const ctx = await getRequestContext(supabase);
    if (!ctx) return unauthorized();

    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", ctx.organizationId)
      .single();

    if (!org?.stripe_customer_id) {
      return serverError("No billing account found. Please subscribe first.");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portalUrl = await createPortalSession(
      org.stripe_customer_id,
      `${appUrl}/settings/billing`
    );

    return success({ url: portalUrl });
  } catch (err: any) {
    return serverError(err.message);
  }
}
