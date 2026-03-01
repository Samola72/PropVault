-- ============================================================
-- PROPVAULT - COMPLETE DATABASE SCHEMA
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── ENUMS ────────────────────────────────────────────────────────────────────

CREATE TYPE plan_type AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN', 'ORG_ADMIN', 'PROPERTY_MANAGER',
  'MAINTENANCE_STAFF', 'ACCOUNTANT', 'VIEWER'
);
CREATE TYPE property_type AS ENUM (
  'APARTMENT', 'HOUSE', 'COMMERCIAL', 'CONDO',
  'TOWNHOUSE', 'MULTI_FAMILY', 'LAND', 'OTHER'
);
CREATE TYPE property_status AS ENUM (
  'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RENOVATION', 'OFF_MARKET'
);
CREATE TYPE work_order_priority AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE work_order_status AS ENUM (
  'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_PARTS',
  'COMPLETED', 'CLOSED', 'CANCELLED'
);
CREATE TYPE work_order_category AS ENUM (
  'PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL',
  'PEST_CONTROL', 'CLEANING', 'LANDSCAPING', 'SECURITY',
  'PAINTING', 'FLOORING', 'ROOFING', 'OTHER'
);
CREATE TYPE occupant_status AS ENUM ('ACTIVE', 'INACTIVE', 'EVICTION', 'PENDING');
CREATE TYPE invoice_status AS ENUM (
  'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIAL'
);
CREATE TYPE invoice_type AS ENUM (
  'RENT', 'MAINTENANCE', 'DEPOSIT', 'UTILITY', 'OTHER'
);
CREATE TYPE notification_type AS ENUM (
  'WORK_ORDER_CREATED', 'WORK_ORDER_UPDATED', 'WORK_ORDER_COMPLETED',
  'INVOICE_CREATED', 'INVOICE_PAID', 'INVOICE_OVERDUE',
  'LEASE_EXPIRING', 'MAINTENANCE_SCHEDULED', 'MESSAGE_RECEIVED', 'GENERAL'
);
CREATE TYPE message_type AS ENUM ('DIRECT', 'BROADCAST', 'SYSTEM');
CREATE TYPE availability_status AS ENUM ('AVAILABLE', 'BUSY', 'UNAVAILABLE');
CREATE TYPE document_category AS ENUM (
  'LEASE', 'DEED', 'INSURANCE', 'PERMIT', 'INSPECTION', 'INVOICE', 'OTHER'
);

-- ─── ORGANIZATIONS ───────────────────────────────────────────────────────────

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  settings JSONB DEFAULT '{}',
  plan plan_type DEFAULT 'STARTER',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USERS ────────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(20),
  role user_role DEFAULT 'VIEWER',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- ─── PROPERTIES ──────────────────────────────────────────────────────────────

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address_line1 VARCHAR(500) NOT NULL,
  address_line2 VARCHAR(500),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'United States',
  type property_type NOT NULL,
  status property_status DEFAULT 'AVAILABLE',
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  square_feet INTEGER,
  year_built INTEGER,
  monthly_rent DECIMAL(12,2),
  purchase_price DECIMAL(15,2),
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_organization_id ON properties(organization_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(type);

-- ─── OCCUPANTS (TENANTS) ─────────────────────────────────────────────────────

CREATE TABLE occupants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  national_id VARCHAR(50),
  emergency_contact JSONB,
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  monthly_rent DECIMAL(12,2) NOT NULL,
  security_deposit DECIMAL(12,2) DEFAULT 0,
  status occupant_status DEFAULT 'ACTIVE',
  notes TEXT,
  documents TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_occupants_organization_id ON occupants(organization_id);
CREATE INDEX idx_occupants_property_id ON occupants(property_id);
CREATE INDEX idx_occupants_status ON occupants(status);

-- ─── SERVICE PROVIDERS ───────────────────────────────────────────────────────

CREATE TABLE service_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  specialties work_order_category[] DEFAULT '{}',
  license_number VARCHAR(100),
  insurance_info JSONB,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_jobs INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  availability_status availability_status DEFAULT 'AVAILABLE',
  bank_details JSONB,
  notes TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_providers_organization_id ON service_providers(organization_id);
CREATE INDEX idx_service_providers_availability ON service_providers(availability_status);

-- ─── WORK ORDERS ─────────────────────────────────────────────────────────────

CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  occupant_id UUID REFERENCES occupants(id),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category work_order_category NOT NULL,
  priority work_order_priority DEFAULT 'MEDIUM',
  status work_order_status DEFAULT 'OPEN',
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  images TEXT[] DEFAULT '{}',
  notes TEXT,
  internal_notes TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES service_providers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_orders_organization_id ON work_orders(organization_id);
CREATE INDEX idx_work_orders_property_id ON work_orders(property_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_priority ON work_orders(priority);
CREATE INDEX idx_work_orders_assigned_to ON work_orders(assigned_to);

-- ─── WORK ORDER UPDATES ──────────────────────────────────────────────────────

CREATE TABLE work_order_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  status work_order_status NOT NULL,
  message TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_order_updates_work_order_id ON work_order_updates(work_order_id);

-- ─── INVOICES ────────────────────────────────────────────────────────────────

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  work_order_id UUID REFERENCES work_orders(id),
  property_id UUID REFERENCES properties(id),
  occupant_id UUID REFERENCES occupants(id),
  service_provider_id UUID REFERENCES service_providers(id),
  type invoice_type NOT NULL DEFAULT 'MAINTENANCE',
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  currency VARCHAR(3) DEFAULT 'USD',
  status invoice_status DEFAULT 'DRAFT',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- ─── DOCUMENTS ───────────────────────────────────────────────────────────────

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),
  occupant_id UUID REFERENCES occupants(id),
  work_order_id UUID REFERENCES work_orders(id),
  name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  category document_category DEFAULT 'OTHER',
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_documents_property_id ON documents(property_id);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  work_order_id UUID REFERENCES work_orders(id),
  type message_type DEFAULT 'DIRECT',
  subject VARCHAR(500),
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_organization_id ON messages(organization_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_occupants_updated_at
  BEFORE UPDATE ON occupants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_service_providers_updated_at
  BEFORE UPDATE ON service_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── INVOICE NUMBER GENERATOR ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
  org_prefix TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num
  FROM invoices WHERE organization_id = NEW.organization_id;

  SELECT UPPER(SUBSTRING(subdomain, 1, 3)) INTO org_prefix
  FROM organizations WHERE id = NEW.organization_id;

  NEW.invoice_number = org_prefix || '-INV-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();
