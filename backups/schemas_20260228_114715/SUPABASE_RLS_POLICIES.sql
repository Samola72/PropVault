-- ============================================================
-- PROPVAULT - ROW LEVEL SECURITY POLICIES
-- Run this script AFTER the SUPABASE_SCHEMA.sql
-- ============================================================

-- ─── ENABLE RLS ON ALL TABLES ─────────────────────────────────────────────────

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupants ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── HELPER FUNCTION: Get current user's organization_id ──────────────────────

CREATE OR REPLACE FUNCTION get_current_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── HELPER FUNCTION: Get current user's role ─────────────────────────────────

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── ORGANIZATIONS POLICIES ───────────────────────────────────────────────────

CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = get_current_user_org_id());

CREATE POLICY "Org admins can update their organization"
  ON organizations FOR UPDATE
  USING (id = get_current_user_org_id() AND get_current_user_role() IN ('SUPER_ADMIN', 'ORG_ADMIN'));

-- ─── USERS POLICIES ──────────────────────────────────────────────────────────

CREATE POLICY "Users can view members of their organization"
  ON users FOR SELECT
  USING (organization_id = get_current_user_org_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can manage users in their org"
  ON users FOR ALL
  USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('SUPER_ADMIN', 'ORG_ADMIN')
  );

-- ─── PROPERTIES POLICIES ─────────────────────────────────────────────────────

CREATE POLICY "Org members can view properties"
  ON properties FOR SELECT
  USING (organization_id = get_current_user_org_id());

CREATE POLICY "Managers can manage properties"
  ON properties FOR ALL
  USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('SUPER_ADMIN', 'ORG_ADMIN', 'PROPERTY_MANAGER')
  );

-- ─── OCCUPANTS POLICIES ──────────────────────────────────────────────────────

CREATE POLICY "Org members can view occupants"
  ON occupants FOR SELECT
  USING (organization_id = get_current_user_org_id());

CREATE POLICY "Managers can manage occupants"
  ON occupants FOR ALL
  USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('SUPER_ADMIN', 'ORG_ADMIN', 'PROPERTY_MANAGER')
  );

-- ─── WORK ORDERS POLICIES ────────────────────────────────────────────────────

CREATE POLICY "Org members can view work orders"
  ON work_orders FOR SELECT
  USING (organization_id = get_current_user_org_id());

CREATE POLICY "Members can create work orders"
  ON work_orders FOR INSERT
  WITH CHECK (organization_id = get_current_user_org_id());

CREATE POLICY "Managers and staff can update work orders"
  ON work_orders FOR UPDATE
  USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('SUPER_ADMIN', 'ORG_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_STAFF')
  );

-- ─── WORK ORDER UPDATES POLICIES ─────────────────────────────────────────────

CREATE POLICY "Org members can view work order updates"
  ON work_order_updates FOR SELECT
  USING (
    work_order_id IN (
      SELECT id FROM work_orders WHERE organization_id = get_current_user_org_id()
    )
  );

CREATE POLICY "Members can add work order updates"
  ON work_order_updates FOR INSERT
  WITH CHECK (
    work_order_id IN (
      SELECT id FROM work_orders WHERE organization_id = get_current_user_org_id()
    )
  );

-- ─── SERVICE PROVIDERS POLICIES ──────────────────────────────────────────────

CREATE POLICY "Org members can view service providers"
  ON service_providers FOR SELECT
  USING (organization_id = get_current_user_org_id());

CREATE POLICY "Managers can manage service providers"
  ON service_providers FOR ALL
  USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('SUPER_ADMIN', 'ORG_ADMIN', 'PROPERTY_MANAGER')
  );

-- ─── INVOICES POLICIES ────────────────────────────────────────────────────────

CREATE POLICY "Org members can view invoices"
  ON invoices FOR SELECT
  USING (organization_id = get_current_user_org_id());

CREATE POLICY "Finance and managers can manage invoices"
  ON invoices FOR ALL
  USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('SUPER_ADMIN', 'ORG_ADMIN', 'PROPERTY_MANAGER', 'ACCOUNTANT')
  );

-- ─── DOCUMENTS POLICIES ──────────────────────────────────────────────────────

CREATE POLICY "Org members can view documents"
  ON documents FOR SELECT
  USING (organization_id = get_current_user_org_id());

CREATE POLICY "Org members can upload documents"
  ON documents FOR INSERT
  WITH CHECK (organization_id = get_current_user_org_id());

CREATE POLICY "Uploaders and admins can delete documents"
  ON documents FOR DELETE
  USING (
    organization_id = get_current_user_org_id()
    AND (
      uploaded_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR get_current_user_role() IN ('SUPER_ADMIN', 'ORG_ADMIN')
    )
  );

-- ─── MESSAGES POLICIES ────────────────────────────────────────────────────────

CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  USING (
    organization_id = get_current_user_org_id()
    AND (
      sender_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR recipient_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR type = 'BROADCAST'
    )
  );

CREATE POLICY "Users can send messages in their org"
  ON messages FOR INSERT
  WITH CHECK (organization_id = get_current_user_org_id());

-- ─── NOTIFICATIONS POLICIES ───────────────────────────────────────────────────

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- ─── AUDIT LOGS POLICIES ─────────────────────────────────────────────────────

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('SUPER_ADMIN', 'ORG_ADMIN')
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (organization_id = get_current_user_org_id());

-- ─── ENABLE REALTIME ─────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE work_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE work_order_updates;
