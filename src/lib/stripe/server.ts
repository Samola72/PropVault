import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

// Plan configuration
export const PLANS = {
  starter: {
    name: "Starter",
    description: "Perfect for independent landlords",
    maxUnits: 25,
    maxUsers: 3,
    priceMonthly: 29,
    priceYearly: 290,
    priceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    priceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY!,
    features: [
      "Up to 25 units",
      "3 team members",
      "Work order management",
      "Tenant portal",
      "Basic reporting",
    ],
  },
  pro: {
    name: "Pro",
    description: "For growing property management businesses",
    maxUnits: 100,
    maxUsers: 10,
    priceMonthly: 79,
    priceYearly: 790,
    priceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    priceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
    features: [
      "Up to 100 units",
      "10 team members",
      "Advanced analytics",
      "Custom workflows",
      "Priority support",
      "Stripe rent collection",
    ],
  },
  enterprise: {
    name: "Enterprise",
    description: "For large-scale property management",
    maxUnits: Infinity,
    maxUsers: Infinity,
    priceMonthly: 199,
    priceYearly: 1990,
    priceIdMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
    priceIdYearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY!,
    features: [
      "Unlimited units",
      "Unlimited team members",
      "White-label options",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/**
 * Get or create a Stripe customer for an organization.
 */
export async function getOrCreateStripeCustomer(
  organizationId: string,
  email: string,
  name: string,
  existingCustomerId?: string | null
): Promise<string> {
  if (existingCustomerId) {
    return existingCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { organization_id: organizationId },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout session for a subscription.
 */
export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: params.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: params.trialDays,
      metadata: { organization_id: params.organizationId },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  });

  if (!session.url) throw new Error("Failed to create checkout session");
  return session.url;
}

/**
 * Create a Stripe Customer Portal session for managing subscription.
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

/**
 * Create a Stripe Payment Link for one-time rent collection.
 */
export async function createRentPaymentLink(params: {
  amount: number; // in cents
  description: string;
  tenantEmail: string;
  invoiceId: string;
  organizationId: string;
  successUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "us_bank_account"],
    customer_email: params.tenantEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: params.amount,
          product_data: { name: params.description },
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoice_id: params.invoiceId,
      organization_id: params.organizationId,
      type: "rent_payment",
    },
    success_url: params.successUrl,
    cancel_url: params.successUrl,
  });

  if (!session.url) throw new Error("Failed to create payment link");
  return session.url;
}
