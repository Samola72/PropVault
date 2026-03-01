-- =====================================================
-- TENANT PORTAL MVP - Database Schema Updates
-- =====================================================
-- This script adds tenant portal functionality to PropVault
-- Run this after the main SUPABASE_SCHEMA.sql

-- =====================================================
-- 1. Add TENANT Role to user_role enum
-- =====================================================

-- Note: In PostgreSQL, we cannot directly add to existing enum
-- We need to create a new type and migrate
DO $$ 
BEGIN
  -- Check if TENANT value already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'TENANT' 
    AND enumtypid = 'user_role'::regtype
  ) THEN
    ALTER TYPE user_role ADD VALUE 'TENANT';
  END IF;
END $$;

-- =====================================================
-- 2. Add Portal Settings to Occupants Table
-- =====================================================

-- Add tenant portal columns to occupants table
ALTER TABLE occupants 
ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS portal_invited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS portal_last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS portal_invitation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS portal_user_id UUID REFERENCES users(id);

-- Create index for portal lookups
CREATE INDEX IF NOT EXISTS idx_occupants_portal_user ON occupants(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_occupants_portal_token ON occupants(portal_invitation_token);
CREATE INDEX IF NOT EXISTS idx_occupants_portal_enabled ON occupants(portal_enabled);

-- =====================================================
-- 3. Update Work Orders for Tenant Submission
-- =====================================================

-- Add tenant-specific columns to work_orders
ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS submitted_by_tenant BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tenant_notes TEXT;

-- Create index for tenant work orders
CREATE INDEX IF NOT EXISTS idx_work_orders_submitted_by_tenant ON work_orders(submitted_by_tenant);

-- =====================================================
-- 4. RLS Policies for Tenant Access
-- =====================================================

-- Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS tenant_view_own_occupant ON occupants;
DROP POLICY IF EXISTS tenant_update_own_profile ON occupants;
DROP POLICY IF EXISTS tenant_view_own_property ON properties;
DROP POLICY IF EXISTS tenant_view_own_work_orders ON work_orders;
DROP POLICY IF EXISTS tenant_create_work_orders ON work_orders;
DROP POLICY IF EXISTS tenant_view_own_messages ON messages;
DROP POLICY IF EXISTS tenant_create_messages ON messages;

-- Policy: Tenants can view their own occupant record
CREATE POLICY tenant_view_own_occupant ON occupants
  FOR SELECT
  TO authenticated
  USING (
    portal_user_id = auth.uid()
    AND portal_enabled = true
  );

-- Policy: Tenants can update their own profile (limited fields)
CREATE POLICY tenant_update_own_profile ON occupants
  FOR UPDATE
  TO authenticated
  USING (portal_user_id = auth.uid() AND portal_enabled = true)
  WITH CHECK (portal_user_id = auth.uid() AND portal_enabled = true);

-- Policy: Tenants can view their property details
CREATE POLICY tenant_view_own_property ON properties
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT property_id 
      FROM occupants 
      WHERE portal_user_id = auth.uid() 
      AND portal_enabled = true
      AND status = 'ACTIVE'
    )
  );

-- Policy: Tenants can view their own work orders
CREATE POLICY tenant_view_own_work_orders ON work_orders
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT property_id 
      FROM occupants 
      WHERE portal_user_id = auth.uid() 
      AND portal_enabled = true
      AND status = 'ACTIVE'
    )
  );

-- Policy: Tenants can create work orders for their property
CREATE POLICY tenant_create_work_orders ON work_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT property_id 
      FROM occupants 
      WHERE portal_user_id = auth.uid() 
      AND portal_enabled = true
      AND status = 'ACTIVE'
    )
  );

-- Policy: Tenants can view messages related to their property
CREATE POLICY tenant_view_own_messages ON messages
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT property_id 
      FROM occupants 
      WHERE portal_user_id = auth.uid() 
      AND portal_enabled = true
      AND status = 'ACTIVE'
    )
    OR
    recipient_id IN (
      SELECT portal_user_id 
      FROM occupants 
      WHERE portal_user_id = auth.uid() 
      AND portal_enabled = true
    )
  );

-- Policy: Tenants can create messages to property manager
CREATE POLICY tenant_create_messages ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT property_id 
      FROM occupants 
      WHERE portal_user_id = auth.uid() 
      AND portal_enabled = true
      AND status = 'ACTIVE'
    )
  );

-- =====================================================
-- 5. Helper Functions
-- =====================================================

-- Function to check if user is a tenant
CREATE OR REPLACE FUNCTION is_tenant(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users u
    WHERE u.id = user_id 
    AND u.role = 'TENANT'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tenant's property manager
CREATE OR REPLACE FUNCTION get_tenant_property_manager(tenant_user_id UUID)
RETURNS UUID AS $$
DECLARE
  manager_id UUID;
BEGIN
  SELECT p.manager_id INTO manager_id
  FROM occupants o
  JOIN properties p ON p.id = o.property_id
  WHERE o.portal_user_id = tenant_user_id
  AND o.portal_enabled = true
  AND o.status = 'ACTIVE'
  LIMIT 1;
  
  RETURN manager_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tenant's active occupancy
CREATE OR REPLACE FUNCTION get_tenant_occupancy(tenant_user_id UUID)
RETURNS TABLE (
  occupant_id UUID,
  property_id UUID,
  unit_number TEXT,
  move_in_date DATE,
  lease_end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.property_id,
    o.unit_number,
    o.move_in_date,
    o.lease_end_date
  FROM occupants o
  WHERE o.portal_user_id = tenant_user_id
  AND o.portal_enabled = true
  AND o.status = 'ACTIVE'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Create Tenant Portal Activity Table (Optional)
-- =====================================================

-- Track tenant portal activity for analytics
CREATE TABLE IF NOT EXISTS tenant_portal_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_user_id UUID REFERENCES users(id) NOT NULL,
  activity_type TEXT NOT NULL, -- 'login', 'work_order_created', 'message_sent', etc.
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_activity_user ON tenant_portal_activity(tenant_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_activity_type ON tenant_portal_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_tenant_activity_created ON tenant_portal_activity(created_at);

-- RLS for tenant_portal_activity
ALTER TABLE tenant_portal_activity ENABLE ROW LEVEL SECURITY;

-- Only managers can view activity
CREATE POLICY manager_view_tenant_activity ON tenant_portal_activity
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('PROPERTY_MANAGER', 'SUPER_ADMIN', 'ORG_ADMIN')
    )
  );

-- System can insert activity
CREATE POLICY system_insert_tenant_activity ON tenant_portal_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- 7. Update Messages Table for Tenant Context
-- =====================================================

-- Add tenant context to messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_tenant_message BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(is_tenant_message);

-- =====================================================
-- DEPLOYMENT NOTES
-- =====================================================

-- To deploy this schema:
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify all policies are created: 
--    SELECT * FROM pg_policies WHERE schemaname = 'public' AND policyname LIKE 'tenant%';
-- 3. Test tenant access with a test account
-- 4. Monitor RLS policy performance

-- To rollback (if needed):
-- 1. Disable tenant portal on all occupants: UPDATE occupants SET portal_enabled = false;
-- 2. Drop tenant policies: DROP POLICY IF EXISTS tenant_* ON *;
-- 3. Remove tenant users: DELETE FROM users WHERE role = 'TENANT';

-- =====================================================
-- END OF TENANT PORTAL SCHEMA
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Tenant Portal schema installed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy API routes for tenant portal';
  RAISE NOTICE '2. Create tenant portal UI components';
  RAISE NOTICE '3. Test invitation flow';
END $$;
