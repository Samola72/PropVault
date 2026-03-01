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

-- ===============================================
-- ENABLE RLS ON stripe_events TABLE
-- ===============================================
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Only service role (Stripe webhooks) can insert events
CREATE POLICY stripe_events_insert_service_only
  ON stripe_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Only service role can read/update events
CREATE POLICY stripe_events_select_service_only
  ON stripe_events
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Policy 3: Authenticated users cannot access stripe_events directly
CREATE POLICY stripe_events_deny_authenticated
  ON stripe_events
  FOR ALL
  USING (auth.role() != 'authenticated');ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Add stripe_payment_intent_id to invoices for payment tracking
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT;

-- ===============================================
-- RLS POLICIES FOR organizations (Stripe Fields)
-- ===============================================
-- Assuming organizations table already has RLS enabled
-- These policies ensure users can only access Stripe data for their own organization

-- Policy: Organization members can read their own Stripe subscription info
CREATE POLICY orgs_stripe_select_own
  ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
    OR auth.role() = 'service_role'
  );

-- Policy: Only org owners/admins can update Stripe fields
CREATE POLICY orgs_stripe_update_admin_only
  ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR auth.role() = 'service_role'
  );

-- ===============================================
-- RLS POLICIES FOR invoices (Stripe Payment Fields)
-- ===============================================
-- Assuming invoices table already has RLS enabled
-- These policies ensure users can only see payment links for their invoices

-- Policy: Tenants/Property managers can read stripe_payment_link
CREATE POLICY invoices_stripe_select_own
  ON invoices
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

-- Policy: Only service role (Stripe webhooks) can update payment fields
CREATE POLICY invoices_stripe_update_service_only
  ON invoices
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- ===============================================
-- COMMENTS FOR DOCUMENTATION
-- ===============================================
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID (cus_...) - Protected by RLS';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Active Stripe subscription ID (sub_...) - Protected by RLS';
COMMENT ON COLUMN organizations.plan_status IS 'Current subscription status from Stripe - Protected by RLS';
COMMENT ON COLUMN invoices.stripe_payment_intent_id IS 'Stripe payment intent ID - Updated via webhooks only';
COMMENT ON COLUMN invoices.stripe_payment_link IS 'Payment link for tenants - Protected by RLS';
COMMENT ON TABLE stripe_events IS 'Log of processed Stripe webhook events for idempotency - Service role only';
