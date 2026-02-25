export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "PropVault";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  DASHBOARD: "/dashboard",
  PROPERTIES: "/properties",
  PROPERTY_NEW: "/properties/new",
  PROPERTY_DETAIL: (id: string) => `/properties/${id}`,
  WORK_ORDERS: "/work-orders",
  WORK_ORDER_NEW: "/work-orders/new",
  WORK_ORDER_DETAIL: (id: string) => `/work-orders/${id}`,
  TENANTS: "/tenants",
  TENANT_NEW: "/tenants/new",
  TENANT_DETAIL: (id: string) => `/tenants/${id}`,
  PROVIDERS: "/providers",
  PROVIDER_NEW: "/providers/new",
  PROVIDER_DETAIL: (id: string) => `/providers/${id}`,
  INVOICES: "/invoices",
  INVOICE_NEW: "/invoices/new",
  INVOICE_DETAIL: (id: string) => `/invoices/${id}`,
  MESSAGES: "/messages",
  DOCUMENTS: "/documents",
  ANALYTICS: "/analytics",
  SETTINGS: "/settings",
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "CONDO", label: "Condo" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "MULTI_FAMILY", label: "Multi-Family" },
  { value: "LAND", label: "Land" },
  { value: "OTHER", label: "Other" },
] as const;

export const WORK_ORDER_CATEGORIES = [
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "HVAC", label: "HVAC" },
  { value: "APPLIANCE", label: "Appliance" },
  { value: "STRUCTURAL", label: "Structural" },
  { value: "PEST_CONTROL", label: "Pest Control" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "LANDSCAPING", label: "Landscaping" },
  { value: "SECURITY", label: "Security" },
  { value: "PAINTING", label: "Painting" },
  { value: "FLOORING", label: "Flooring" },
  { value: "ROOFING", label: "Roofing" },
  { value: "OTHER", label: "Other" },
] as const;

export const WORK_ORDER_PRIORITIES = [
  { value: "CRITICAL", label: "Critical", color: "red" },
  { value: "HIGH", label: "High", color: "orange" },
  { value: "MEDIUM", label: "Medium", color: "yellow" },
  { value: "LOW", label: "Low", color: "green" },
] as const;

export const USER_ROLES = [
  { value: "ORG_ADMIN", label: "Organization Admin" },
  { value: "PROPERTY_MANAGER", label: "Property Manager" },
  { value: "MAINTENANCE_STAFF", label: "Maintenance Staff" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "VIEWER", label: "Viewer" },
] as const;

export const PERMISSIONS = {
  PROPERTY_CREATE: ["SUPER_ADMIN", "ORG_ADMIN", "PROPERTY_MANAGER"],
  PROPERTY_EDIT: ["SUPER_ADMIN", "ORG_ADMIN", "PROPERTY_MANAGER"],
  PROPERTY_DELETE: ["SUPER_ADMIN", "ORG_ADMIN"],
  WORK_ORDER_CREATE: ["SUPER_ADMIN", "ORG_ADMIN", "PROPERTY_MANAGER", "MAINTENANCE_STAFF"],
  WORK_ORDER_EDIT: ["SUPER_ADMIN", "ORG_ADMIN", "PROPERTY_MANAGER", "MAINTENANCE_STAFF"],
  WORK_ORDER_DELETE: ["SUPER_ADMIN", "ORG_ADMIN"],
  TENANT_CREATE: ["SUPER_ADMIN", "ORG_ADMIN", "PROPERTY_MANAGER"],
  TENANT_EDIT: ["SUPER_ADMIN", "ORG_ADMIN", "PROPERTY_MANAGER"],
  INVOICE_CREATE: ["SUPER_ADMIN", "ORG_ADMIN", "PROPERTY_MANAGER", "ACCOUNTANT"],
  INVOICE_EDIT: ["SUPER_ADMIN", "ORG_ADMIN", "ACCOUNTANT"],
  SETTINGS_EDIT: ["SUPER_ADMIN", "ORG_ADMIN"],
} as const;
