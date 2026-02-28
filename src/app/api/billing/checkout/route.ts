import { NextRequest } from "next/server";
import {
  getRequestContext,
  unauthorized,
  badRequest,
  serverError,
  success,
} from "@/lib/api/helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  PLANS,
  getOrCreateStripeCustomer,
  createCheckoutSession,
  type PlanKey,
} from "@/lib/stripe/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const ctx = await getRequestContext(supabase);
    if (!ctx) return unauthorized();

    const { planKey, interval } = (await req.json()) as {
      planKey: PlanKey;
      interval: "monthly" | "yearly";
    };

    if (!planKey || !PLANS[planKey]) {
      return badRequest("Invalid plan");
    }

    // Fetch org details
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("id, name, stripe_customer_id")
      .eq("id", ctx.organizationId)
      .single();

    if (orgErr || !org) return serverError("Organization not found");

    // Fetch user email for customer creation
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", ctx.user.id)
      .single();

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      (org as any).id,
      (user as any)?.email || ctx.user.email || "",
      (org as any).name,
      (org as any).stripe_customer_id
    );

    // Save customer ID if newly created
    if (!(org as any).stripe_customer_id) {
      await (supabase as any)
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", (org as any).id);
    }

    const plan = PLANS[planKey];
    const priceId =
      interval === "yearly" ? plan.priceIdYearly : plan.priceIdMonthly;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutUrl = await createCheckoutSession({
      customerId,
      priceId,
      organizationId: (org as any).id,
      successUrl: `${appUrl}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/settings/billing?canceled=true`,
      trialDays: 14,
    });

    return success({ url: checkoutUrl });
  } catch (err: any) {
    return serverError(err.message);
  }
}
