import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, unauthorized } from "@/lib/api/helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { startOfMonth, subMonths, format, eachMonthOfInterval } from "date-fns";

export async function GET(req: NextRequest) {
  const ctx = await getRequestContext();
  if (!ctx) return unauthorized();

  const { searchParams } = new URL(req.url);
  const months = parseInt(searchParams.get("months") || "12");
  const orgId = ctx.organizationId;

  const supabase = await createServerSupabaseClient();
  const now = new Date();
  const startDate = subMonths(startOfMonth(now), months - 1);
  const startISO = startDate.toISOString();

  // Run all queries in parallel
  const [
    propertiesRes,
    invoicesRes,
    workOrdersRes,
    tenantsRes,
    occupancyHistoryRes,
  ] = await Promise.all([
    // All properties with their rent
    supabase
      .from("properties")
      .select("id, name, status, monthly_rent, purchase_price, type")
      .eq("organization_id", orgId),

    // All invoices in range
    supabase
      .from("invoices")
      .select(
        "id, type, status, total_amount, paid_amount, balance, issue_date, due_date, property_id"
      )
      .eq("organization_id", orgId)
      .gte("issue_date", startISO)
      .order("issue_date"),

    // All work orders
    supabase
      .from("work_orders")
      .select("id, status, priority, category, created_at, actual_cost, estimated_cost, property_id")
      .eq("organization_id", orgId)
      .gte("created_at", startISO),

    // All tenants
    supabase
      .from("occupants")
      .select("id, status, lease_start, lease_end, monthly_rent, property_id, created_at")
      .eq("organization_id", orgId),

    // Properties with occupants for occupancy tracking
    supabase
      .from("occupants")
      .select("id, status, lease_start, lease_end, property_id")
      .eq("organization_id", orgId)
      .eq("status", "ACTIVE"),
  ]);

  const properties = (propertiesRes.data || []) as any[];
  const invoices = (invoicesRes.data || []) as any[];
  const workOrders = (workOrdersRes.data || []) as any[];
  const tenants = (tenantsRes.data || []) as any[];
  const activeOccupants = (occupancyHistoryRes.data || []) as any[];

  // ─── 1. Monthly Revenue Chart ───────────────────────────────────────
  const monthRange = eachMonthOfInterval({ start: startDate, end: now });
  const revenueByMonth = monthRange.map((month) => {
    const label = format(month, "MMM yy");
    const monthStr = format(month, "yyyy-MM");
    const monthInvoices = invoices.filter((inv) =>
      inv.issue_date.startsWith(monthStr)
    );
    const collected = monthInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
    const outstanding = monthInvoices.reduce((sum, inv) => sum + inv.balance, 0);
    const total = monthInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    return { month: label, collected, outstanding, total };
  });

  // ─── 2. Occupancy Rate by Month ─────────────────────────────────────
  const totalProperties = properties.length;
  const occupancyByMonth = monthRange.map((month) => {
    const label = format(month, "MMM yy");
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const occupied = activeOccupants.filter((occ) => {
      const leaseStart = new Date(occ.lease_start);
      const leaseEnd = occ.lease_end ? new Date(occ.lease_end) : new Date("2099-12-31");
      return leaseStart <= monthEnd && leaseEnd >= month;
    }).length;
    const rate = totalProperties > 0 ? Math.round((occupied / totalProperties) * 100) : 0;
    return { month: label, occupied, total: totalProperties, rate };
  });

  // ─── 3. Work Orders by Category ─────────────────────────────────────
  const woCategoryMap: Record<string, number> = {};
  workOrders.forEach((wo) => {
    woCategoryMap[wo.category] = (woCategoryMap[wo.category] || 0) + 1;
  });
  const workOrdersByCategory = Object.entries(woCategoryMap)
    .map(([category, count]) => ({ category: category.replace(/_/g, " "), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ─── 4. Work Order Status Breakdown ─────────────────────────────────
  const woStatusMap: Record<string, number> = {};
  workOrders.forEach((wo) => {
    woStatusMap[wo.status] = (woStatusMap[wo.status] || 0) + 1;
  });
  const workOrdersByStatus = Object.entries(woStatusMap).map(([status, count]) => ({
    status: status.replace(/_/g, " "),
    count,
  }));

  // ─── 5. Per-Property Performance ────────────────────────────────────
  const propertyPerformance = properties
    .filter((p) => p.monthly_rent)
    .map((prop) => {
      const propInvoices = invoices.filter((inv) => inv.property_id === prop.id);
      const totalBilled = propInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const totalCollected = propInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
      const totalOutstanding = propInvoices.reduce((sum, inv) => sum + inv.balance, 0);
      const propWOs = workOrders.filter((wo) => wo.property_id === prop.id);
      const maintenanceCost = propWOs.reduce((sum, wo) => sum + (wo.actual_cost || 0), 0);
      const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
      const tenantCount = activeOccupants.filter((occ) => occ.property_id === prop.id).length;
      return {
        id: prop.id,
        name: prop.name.length > 20 ? prop.name.slice(0, 18) + "…" : prop.name,
        fullName: prop.name,
        monthlyRent: prop.monthly_rent || 0,
        totalBilled,
        totalCollected,
        totalOutstanding,
        maintenanceCost,
        collectionRate,
        openWOs: propWOs.filter((wo) => ["OPEN","ASSIGNED","IN_PROGRESS"].includes(wo.status)).length,
        tenantCount,
        status: prop.status,
      };
    })
    .sort((a, b) => b.totalCollected - a.totalCollected)
    .slice(0, 10);

  // ─── 6. Tenant Activity by Month ────────────────────────────────────
  const tenantActivityByMonth = monthRange.map((month) => {
    const label = format(month, "MMM yy");
    const monthStr = format(month, "yyyy-MM");
    const newTenants = tenants.filter((t) =>
      t.created_at?.startsWith(monthStr)
    ).length;
    const departures = tenants.filter((t) =>
      t.lease_end?.startsWith(monthStr) && t.status === "INACTIVE"
    ).length;
    return { month: label, new: newTenants, departed: departures };
  });

  // ─── 7. Summary KPIs ────────────────────────────────────────────────
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0;
  const currentOccupancy = totalProperties > 0
    ? Math.round((properties.filter((p) => p.status === "OCCUPIED").length / totalProperties) * 100)
    : 0;
  const avgMonthlyRevenue = revenueByMonth.length > 0
    ? Math.round(revenueByMonth.reduce((sum, m) => sum + m.collected, 0) / revenueByMonth.length)
    : 0;
  const totalMaintenanceCost = workOrders.reduce((sum, wo) => sum + (wo.actual_cost || 0), 0);
  const openWorkOrders = workOrders.filter((wo) => ["OPEN","ASSIGNED","IN_PROGRESS"].includes(wo.status)).length;

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalOutstanding,
      totalBilled,
      collectionRate,
      currentOccupancy,
      avgMonthlyRevenue,
      totalMaintenanceCost,
      openWorkOrders,
      totalProperties,
      activeTenants: tenants.filter((t) => t.status === "ACTIVE").length,
    },
    revenueByMonth,
    occupancyByMonth,
    workOrdersByCategory,
    workOrdersByStatus,
    propertyPerformance,
    tenantActivityByMonth,
  });
}
