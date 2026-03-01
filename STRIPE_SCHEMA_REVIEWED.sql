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

-- ⚠️ IMPORTANT: stripe_events is for webhook logging only
-- No authenticated users should access this table directly
-- Service role bypasses RLS, so webhooks will work
-- No policies needed - RLS enabled with no policies = no access for authenticated users

-- Add stripe_payment_intent_id to invoices for payment tracking
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT;

-- ===============================================
-- RLS NOTES FOR organizations & invoices
-- ===============================================
-- ⚠️ IMPORTANT: Do NOT add separate RLS policies for Stripe columns!
-- RLS works at the TABLE level, not COLUMN level in Supabase.
--
-- Your existing RLS policies on organizations and invoices tables
-- already control access. The new Stripe columns are automatically
-- protected by those existing policies.
--
-- For example:
-- - If a user can SELECT from organizations, they can see ALL columns
-- - If a user can UPDATE organizations, they can update ALL columns
--
-- Column-level security would require views or custom functions.
-- For this use case, the existing table-level RLS is sufficient.

-- ===============================================
-- COMMENTS FOR DOCUMENTATION
-- ===============================================
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID (cus_...) - Protected by existing organizations RLS policies';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Active Stripe subscription ID (sub_...) - Protected by existing organizations RLS policies';
COMMENT ON COLUMN organizations.plan_status IS 'Current subscription status from Stripe - Protected by existing organizations RLS policies';
COMMENT ON COLUMN invoices.stripe_payment_intent_id IS 'Stripe payment intent ID - Updated via API/webhooks, protected by existing invoices RLS';
COMMENT ON COLUMN invoices.stripe_payment_link IS 'Payment link for tenants - Protected by existing invoices RLS policies';
COMMENT ON TABLE stripe_events IS 'Log of processed Stripe webhook events for idempotency - Service role bypasses RLS, authenticated users blocked';

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================
-- Run these after deployment to verify setup:

-- 1. Check organizations columns were added:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'organizations' AND column_name LIKE 'stripe%';

-- 2. Check invoices columns were added:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'invoices' AND column_name LIKE 'stripe%';

-- 3. Verify stripe_events table has RLS enabled with no policies:
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE tablename = 'stripe_events';
-- (Should return 0 rows - no policies means no access for authenticated users)

-- 4. Check stripe_events RLS is enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'stripe_events';
-- (rowsecurity should be true)

-- ===============================================
-- SUCCESS MESSAGE
-- ===============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Stripe schema deployed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added to organizations table:';
  RAISE NOTICE '  - stripe_customer_id';
  RAISE NOTICE '  - stripe_subscription_id';
  RAISE NOTICE '  - stripe_price_id';
  RAISE NOTICE '  - plan_status';
  RAISE NOTICE '  - trial_ends_at';
  RAISE NOTICE '  - current_period_start';
  RAISE NOTICE '  - current_period_end';
  RAISE NOTICE '  - cancel_at_period_end';
  RAISE NOTICE '';
  RAISE NOTICE 'Added to invoices table:';
  RAISE NOTICE '  - stripe_payment_intent_id';
  RAISE NOTICE '  - stripe_payment_link';
  RAISE NOTICE '';
  RAISE NOTICE 'Created stripe_events table with RLS enabled';
  RAISE NOTICE '';
  RAISE NOTICE '📝 All Stripe columns are protected by your existing RLS policies!';
  RAISE NOTICE '🔒 stripe_events table is service-role only (no authenticated access)';
END $$;
