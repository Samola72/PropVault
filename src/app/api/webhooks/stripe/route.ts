import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

// Stripe requires raw body for signature verification
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency check — skip if already processed
  const { data: existingEvent } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .single();

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Log event
  await (supabase as any).from("stripe_events").insert({
    id: event.id,
    type: event.type,
    data: event.data as any,
  });

  try {
    switch (event.type) {
      // ─── Subscription Events ───────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, sub);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, sub);
        break;
      }

      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        // Notify org that trial is ending soon (3 days)
        const orgId = sub.metadata?.organization_id;
        if (orgId) {
          await createSystemNotification(
            supabase,
            orgId,
            "Trial Ending Soon",
            "Your 14-day free trial ends in 3 days. Add a payment method to keep your account active.",
            "GENERAL"
          );
        }
        break;
      }

      // ─── Payment Events ────────────────────────────────────
      case "invoice.payment_succeeded": {
        const inv = event.data.object as Stripe.Invoice;
        // Update subscription billing period in org
        if ((inv as any).subscription) {
          const sub = await stripe.subscriptions.retrieve(
            (inv as any).subscription as string
          );
          await handleSubscriptionChange(supabase, sub);
        }
        break;
      }

      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = inv.customer as string;
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();
        if (org) {
          await (supabase as any)
            .from("organizations")
            .update({ plan_status: "past_due" })
            .eq("id", (org as any).id);
          await createSystemNotification(
            supabase,
            (org as any).id,
            "Payment Failed",
            "Your subscription payment failed. Please update your payment method to avoid service interruption.",
            "GENERAL"
          );
        }
        break;
      }

      // ─── One-time Rent Payment ─────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (
          session.metadata?.type === "rent_payment" &&
          session.metadata?.invoice_id
        ) {
          await handleRentPayment(supabase, session);
        }
        break;
      }

      default:
        // Unhandled — that's OK
        break;
    }
  } catch (err: any) {
    console.error(`Error processing webhook ${event.type}:`, err);
    // Return 200 anyway to prevent Stripe retries for non-critical errors
  }

  return NextResponse.json({ received: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleSubscriptionChange(supabase: any, sub: Stripe.Subscription) {
  const orgId = (sub as any).metadata?.organization_id;
  if (!orgId) return;

  const priceId = (sub as any).items.data[0]?.price?.id;
  const planKey = getPlanKeyFromPriceId(priceId);

  await supabase
    .from("organizations")
    .update({
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      plan: planKey.toUpperCase(),
      plan_status: sub.status,
      trial_ends_at: (sub as any).trial_end
        ? new Date((sub as any).trial_end * 1000).toISOString()
        : null,
      current_period_start: new Date(
        (sub as any).current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
      cancel_at_period_end: (sub as any).cancel_at_period_end,
    })
    .eq("id", orgId);
}

async function handleSubscriptionDeleted(
  supabase: any,
  sub: Stripe.Subscription
) {
  const orgId = sub.metadata?.organization_id;
  if (!orgId) return;

  await supabase
    .from("organizations")
    .update({
      plan: "STARTER",
      plan_status: "canceled",
      stripe_subscription_id: null,
      cancel_at_period_end: false,
    })
    .eq("id", orgId);

  await createSystemNotification(
    supabase,
    orgId,
    "Subscription Canceled",
    "Your PropVault subscription has been canceled. Your account has been downgraded to the free tier.",
    "GENERAL"
  );
}

async function handleRentPayment(
  supabase: any,
  session: Stripe.Checkout.Session
) {
  const invoiceId = session.metadata?.invoice_id;
  if (!invoiceId) return;

  const amountPaid = (session.amount_total || 0) / 100; // cents → dollars

  // Record payment on invoice
  const { data: invoice } = await supabase
    .from("invoices")
    .select("paid_amount, total_amount, balance")
    .eq("id", invoiceId)
    .single();

  if (!invoice) return;

  const newPaidAmount = invoice.paid_amount + amountPaid;
  const newBalance = invoice.total_amount - newPaidAmount;
  const newStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

  await supabase
    .from("invoices")
    .update({
      paid_amount: newPaidAmount,
      balance: Math.max(0, newBalance),
      status: newStatus,
      paid_date: newStatus === "PAID" ? new Date().toISOString() : null,
      stripe_payment_intent_id: session.payment_intent as string,
    })
    .eq("id", invoiceId);
}

async function createSystemNotification(
  supabase: any,
  organizationId: string,
  title: string,
  message: string,
  type: string
) {
  // Get all org admins
  const { data: admins } = await supabase
    .from("users")
    .select("id")
    .eq("organization_id", organizationId)
    .in("role", ["ORG_ADMIN", "PROPERTY_MANAGER"]);

  if (!admins?.length) return;

  await supabase.from("notifications").insert(
    admins.map((admin: any) => ({
      user_id: admin.id,
      organization_id: organizationId,
      title,
      message,
      type,
    }))
  );
}

function getPlanKeyFromPriceId(priceId?: string): string {
  if (!priceId) return "starter";
  const env = process.env;
  if (
    [env.STRIPE_PRICE_PRO_MONTHLY, env.STRIPE_PRICE_PRO_YEARLY].includes(
      priceId
    )
  )
    return "pro";
  if (
    [
      env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
      env.STRIPE_PRICE_ENTERPRISE_YEARLY,
    ].includes(priceId)
  )
    return "enterprise";
  return "starter";
}
