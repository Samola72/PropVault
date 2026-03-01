-- ===============================================
-- BATCH 10: Stripe Payment Integration Schema
-- ===============================================
-- Run this in Supabase SQL Editor

-- Add Stripe fields to organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'trialing'
    CHECK (plan_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Index for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_orgs_stripe_customer
  ON organizations (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orgs_stripe_subscription
  ON organizations (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Stripe webhook events log (idempotency)
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,               -- Stripe event ID (evt_...)
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add stripe_payment_intent_id to invoices for payment tracking
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT;

-- Comments for documentation
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID (cus_...)';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Active Stripe subscription ID (sub_...)';
COMMENT ON COLUMN organizations.plan_status IS 'Current subscription status from Stripe';
COMMENT ON TABLE stripe_events IS 'Log of processed Stripe webhook events for idempotency';
