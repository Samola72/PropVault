import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getRequestContext,
  unauthorized,
  serverError,
  success,
} from "@/lib/api/helpers";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return unauthorized();

    const supabase = await createServerSupabaseClient();

    // Get total properties
    const { count: totalProperties } = await (supabase
      .from("properties") as any)
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId);

    // Get active work orders (not completed, closed, or cancelled)
    const { count: activeWorkOrders } = await (supabase
      .from("work_orders") as any)
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .not("status", "in", '("COMPLETED","CLOSED","CANCELLED")');

    // Get total tenants
    const { count: totalTenants } = await (supabase
      .from("occupants") as any)
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .eq("status", "ACTIVE");

    // Get pending invoices total
    const { data: pendingInvoices } = await (supabase
      .from("invoices") as any)
      .select("balance")
      .eq("organization_id", ctx.organizationId)
      .in("status", ["DRAFT", "SENT", "OVERDUE"]);

    const pendingInvoicesTotal = (pendingInvoices || []).reduce(
      (sum: number, inv: any) => sum + (inv.balance || 0),
      0
    );

    // Get recent activity (last 5 items)
    const { data: recentWorkOrders } = await (supabase
      .from("work_orders") as any)
      .select("id, title, status, created_at, priority")
      .eq("organization_id", ctx.organizationId)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recentInvoices } = await (supabase
      .from("invoices") as any)
      .select("id, invoice_number, status, created_at, total_amount")
      .eq("organization_id", ctx.organizationId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Calculate change percentages (comparing to last month - simplified)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: propertiesLastMonth } = await (supabase
      .from("properties") as any)
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .lt("created_at", thirtyDaysAgo.toISOString());

    const { count: workOrdersLastMonth } = await (supabase
      .from("work_orders") as any)
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .not("status", "in", '("COMPLETED","CLOSED","CANCELLED")')
      .lt("created_at", thirtyDaysAgo.toISOString());

    const propertiesChange = propertiesLastMonth
      ? ((((totalProperties || 0) - propertiesLastMonth) / propertiesLastMonth) * 100)
      : 0;

    const workOrdersChange = workOrdersLastMonth
      ? ((((activeWorkOrders || 0) - workOrdersLastMonth) / workOrdersLastMonth) * 100)
      : 0;

    return success({
      stats: {
        totalProperties: totalProperties || 0,
        propertiesChange: Math.round(propertiesChange),
        activeWorkOrders: activeWorkOrders || 0,
        workOrdersChange: Math.round(workOrdersChange),
        totalTenants: totalTenants || 0,
        tenantsChange: 0, // Simplified for now
        pendingInvoices: pendingInvoicesTotal,
        pendingInvoicesChange: 0, // Simplified for now
      },
      recentActivity: [
        ...(recentWorkOrders || []).map((wo: any) => ({
          id: wo.id,
          type: "work_order",
          title: wo.title,
          status: wo.status,
          priority: wo.priority,
          created_at: wo.created_at,
        })),
        ...(recentInvoices || []).map((inv: any) => ({
          id: inv.id,
          type: "invoice",
          title: `Invoice #${inv.invoice_number}`,
          status: inv.status,
          amount: inv.total_amount,
          created_at: inv.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10),
    });
  } catch (err) {
    return serverError(err);
  }
}
