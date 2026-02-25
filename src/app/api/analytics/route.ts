import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getRequestContext,
  unauthorized,
  serverError,
  success,
} from "@/lib/api/helpers";

export async function GET(_request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const supabase = await createServerSupabaseClient();
    const orgId = ctx.organizationId;

    // Run all queries in parallel
    const [
      propertiesResult,
      workOrdersResult,
      tenantsResult,
      invoicesResult,
      revenueResult,
    ] = await Promise.all([
      // Property stats
      (supabase
        .from("properties") as any)
        .select("status")
        .eq("organization_id", orgId),

      // Work order stats
      (supabase
        .from("work_orders") as any)
        .select("status, priority")
        .eq("organization_id", orgId),

      // Tenant stats
      (supabase
        .from("occupants") as any)
        .select("status, lease_end, monthly_rent")
        .eq("organization_id", orgId),

      // Invoice stats
      (supabase
        .from("invoices") as any)
        .select("status, total_amount, paid_amount")
        .eq("organization_id", orgId),

      // Monthly revenue (last 6 months)
      (supabase
        .from("invoices") as any)
        .select("total_amount, paid_date, status")
        .eq("organization_id", orgId)
        .eq("status", "PAID")
        .gte("paid_date", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const properties = propertiesResult.data || [];
    const workOrders = workOrdersResult.data || [];
    const tenants = tenantsResult.data || [];
    const invoices = invoicesResult.data || [];
    const revenueData = revenueResult.data || [];

    // Property breakdown
    const propStats = {
      total: properties.length,
      available: properties.filter((p: any) => p.status === "AVAILABLE").length,
      occupied: properties.filter((p: any) => p.status === "OCCUPIED").length,
      maintenance: properties.filter((p: any) => p.status === "MAINTENANCE").length,
      occupancyRate:
        properties.length > 0
          ? Math.round(
              (properties.filter((p: any) => p.status === "OCCUPIED").length /
                properties.length) *
                100
            )
          : 0,
    };

    // Work order breakdown
    const woStats = {
      total: workOrders.length,
      open: workOrders.filter((w: any) => w.status === "OPEN").length,
      inProgress: workOrders.filter((w: any) =>
        ["ASSIGNED", "IN_PROGRESS"].includes(w.status)
      ).length,
      completed: workOrders.filter((w: any) => w.status === "COMPLETED").length,
      critical: workOrders.filter((w: any) => w.priority === "CRITICAL").length,
    };

    // Tenant breakdown
    const thirtyDaysFromNow = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const tenantStats = {
      total: tenants.length,
      active: tenants.filter((t: any) => t.status === "ACTIVE").length,
      leasesExpiringSoon: tenants.filter(
        (t: any) => t.lease_end <= thirtyDaysFromNow && t.status === "ACTIVE"
      ).length,
      monthlyRentTotal: tenants
        .filter((t: any) => t.status === "ACTIVE")
        .reduce((sum: number, t: any) => sum + (t.monthly_rent || 0), 0),
    };

    // Invoice/Financial breakdown
    const financeStats = {
      totalInvoices: invoices.length,
      pendingAmount: invoices
        .filter((i: any) => ["SENT", "DRAFT"].includes(i.status))
        .reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0),
      overdueCount: invoices.filter((i: any) => i.status === "OVERDUE").length,
      overdueAmount: invoices
        .filter((i: any) => i.status === "OVERDUE")
        .reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0),
      collectionRate:
        invoices.length > 0
          ? Math.round(
              (invoices.filter((i: any) => i.status === "PAID").length /
                invoices.length) *
                100
            )
          : 0,
    };

    // Monthly revenue chart data
    const monthlyRevenue: Record<string, number> = {};
    revenueData.forEach((inv: any) => {
      if (inv.paid_date) {
        const month = inv.paid_date.substring(0, 7); // YYYY-MM
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + inv.total_amount;
      }
    });

    return success({
      properties: propStats,
      workOrders: woStats,
      tenants: tenantStats,
      finance: financeStats,
      monthlyRevenue: Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    });
  } catch (err) {
    return serverError(err);
  }
}
