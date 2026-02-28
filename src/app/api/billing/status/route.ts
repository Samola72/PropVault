import {
  getRequestContext,
  unauthorized,
  serverError,
  success,
} from "@/lib/api/helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/stripe/server";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const supabase = await createServerSupabaseClient();

    const { data: org, error } = await supabase
      .from("organizations")
      .select(
        `
        plan,
        plan_status,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        trial_ends_at,
        current_period_start,
        current_period_end,
        cancel_at_period_end
      `
      )
      .eq("id", ctx.organizationId)
      .single();

    if (error || !org) return serverError("Organization not found");

    // Get usage stats
    const [propertiesRes, usersRes] = await Promise.all([
      supabase
        .from("properties")
        .select("id", { count: "exact" })
        .eq("organization_id", ctx.organizationId),
      supabase
        .from("users")
        .select("id", { count: "exact" })
        .eq("organization_id", ctx.organizationId),
    ]);

    const currentPlanKey = ((org as any).plan?.toLowerCase() ||
      "starter") as keyof typeof PLANS;
    const currentPlan = PLANS[currentPlanKey] || PLANS.starter;

    return success({
      plan: (org as any).plan || "STARTER",
      planStatus: (org as any).plan_status || "trialing",
      hasSubscription: !!(org as any).stripe_subscription_id,
      hasCustomer: !!(org as any).stripe_customer_id,
      currentPeriodEnd: (org as any).current_period_end,
      trialEndsAt: (org as any).trial_ends_at,
      cancelAtPeriodEnd: (org as any).cancel_at_period_end || false,
      stripePriceId: (org as any).stripe_price_id,
      usage: {
        properties: propertiesRes.count || 0,
        maxProperties:
          currentPlan.maxUnits === Infinity ? null : currentPlan.maxUnits,
        users: usersRes.count || 0,
        maxUsers:
          currentPlan.maxUsers === Infinity ? null : currentPlan.maxUsers,
      },
    });
  } catch (err: any) {
    return serverError(err.message);
  }
}
