export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface FilterParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
}

export interface DashboardStats {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  maintenanceProperties: number;
  openWorkOrders: number;
  inProgressWorkOrders: number;
  overdueWorkOrders: number;
  activeTenants: number;
  monthlyRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
}
