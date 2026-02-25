export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Plan = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export type UserRole =
  | "SUPER_ADMIN"
  | "ORG_ADMIN"
  | "PROPERTY_MANAGER"
  | "MAINTENANCE_STAFF"
  | "ACCOUNTANT"
  | "VIEWER";

export type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "COMMERCIAL"
  | "CONDO"
  | "TOWNHOUSE"
  | "MULTI_FAMILY"
  | "LAND"
  | "OTHER";

export type PropertyStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "MAINTENANCE"
  | "RENOVATION"
  | "OFF_MARKET";

export type WorkOrderPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type WorkOrderStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "PENDING_PARTS"
  | "COMPLETED"
  | "CLOSED"
  | "CANCELLED";

export type WorkOrderCategory =
  | "PLUMBING"
  | "ELECTRICAL"
  | "HVAC"
  | "APPLIANCE"
  | "STRUCTURAL"
  | "PEST_CONTROL"
  | "CLEANING"
  | "LANDSCAPING"
  | "SECURITY"
  | "PAINTING"
  | "FLOORING"
  | "ROOFING"
  | "OTHER";

export type OccupantStatus = "ACTIVE" | "INACTIVE" | "EVICTION" | "PENDING";

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "PARTIAL";

export type NotificationType =
  | "WORK_ORDER_CREATED"
  | "WORK_ORDER_UPDATED"
  | "WORK_ORDER_COMPLETED"
  | "INVOICE_CREATED"
  | "INVOICE_PAID"
  | "INVOICE_OVERDUE"
  | "LEASE_EXPIRING"
  | "MAINTENANCE_SCHEDULED"
  | "MESSAGE_RECEIVED"
  | "GENERAL";

export type MessageType = "DIRECT" | "BROADCAST" | "SYSTEM";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Organization, "id" | "created_at">>;
      };
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      properties: {
        Row: Property;
        Insert: Omit<Property, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Property, "id" | "created_at">>;
      };
      occupants: {
        Row: Occupant;
        Insert: Omit<Occupant, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Occupant, "id" | "created_at">>;
      };
      work_orders: {
        Row: WorkOrder;
        Insert: Omit<WorkOrder, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<WorkOrder, "id" | "created_at">>;
      };
      service_providers: {
        Row: ServiceProvider;
        Insert: Omit<ServiceProvider, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ServiceProvider, "id" | "created_at">>;
      };
      invoices: {
        Row: Invoice;
        Insert: Omit<Invoice, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Invoice, "id" | "created_at">>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, "id" | "created_at">;
        Update: Partial<Omit<Document, "id" | "created_at">>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at">;
        Update: Partial<Omit<Message, "id">>;
      };
      notifications: {
        Row: AppNotification;
        Insert: Omit<AppNotification, "id" | "created_at">;
        Update: Partial<Omit<AppNotification, "id">>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "timestamp">;
        Update: never;
      };
    };
  };
}

export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  primary_color: string;
  settings: Json;
  plan: Plan;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_user_id: string;
  organization_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Property {
  id: string;
  organization_id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  type: PropertyType;
  status: PropertyStatus;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  year_built: number | null;
  monthly_rent: number | null;
  purchase_price: number | null;
  images: string[];
  amenities: string[];
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  organization?: Organization;
  occupants?: Occupant[];
  work_orders?: WorkOrder[];
}

export interface Occupant {
  id: string;
  organization_id: string;
  property_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  national_id: string | null;
  emergency_contact: Json | null;
  lease_start: string;
  lease_end: string;
  monthly_rent: number;
  security_deposit: number;
  status: OccupantStatus;
  notes: string | null;
  documents: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  property?: Property;
}

export interface WorkOrder {
  id: string;
  organization_id: string;
  property_id: string;
  occupant_id: string | null;
  title: string;
  description: string;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  estimated_cost: number | null;
  actual_cost: number | null;
  images: string[];
  notes: string | null;
  internal_notes: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  property?: Property;
  occupant?: Occupant;
  service_provider?: ServiceProvider;
  work_order_updates?: WorkOrderUpdate[];
}

export interface WorkOrderUpdate {
  id: string;
  work_order_id: string;
  user_id: string;
  status: WorkOrderStatus;
  message: string;
  images: string[];
  created_at: string;
  user?: User;
}

export interface ServiceProvider {
  id: string;
  organization_id: string;
  name: string;
  company_name: string | null;
  email: string;
  phone: string;
  specialties: WorkOrderCategory[];
  license_number: string | null;
  insurance_info: Json | null;
  rating: number;
  total_jobs: number;
  hourly_rate: number | null;
  availability_status: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
  bank_details: Json | null;
  notes: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  work_order_id: string | null;
  property_id: string | null;
  occupant_id: string | null;
  service_provider_id: string | null;
  type: "RENT" | "MAINTENANCE" | "DEPOSIT" | "UTILITY" | "OTHER";
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  currency: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  property?: Property;
  work_order?: WorkOrder;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Document {
  id: string;
  organization_id: string;
  property_id: string | null;
  occupant_id: string | null;
  work_order_id: string | null;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category:
    | "LEASE"
    | "DEED"
    | "INSURANCE"
    | "PERMIT"
    | "INSPECTION"
    | "INVOICE"
    | "OTHER";
  tags: string[];
  uploaded_by: string;
  created_at: string;
}

export interface Message {
  id: string;
  organization_id: string;
  sender_id: string;
  recipient_id: string | null;
  property_id: string | null;
  work_order_id: string | null;
  type: MessageType;
  subject: string | null;
  body: string;
  is_read: boolean;
  attachments: string[];
  created_at: string;
  sender?: User;
  recipient?: User;
}

export interface AppNotification {
  id: string;
  organization_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Json | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}
