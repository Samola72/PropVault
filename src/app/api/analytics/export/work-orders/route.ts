import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, unauthorized } from "@/lib/api/helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const ctx = await getRequestContext();
  if (!ctx) return unauthorized();

  const orgId = ctx.organizationId;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("work_orders")
    .select(`
      title, status, priority, category, created_at, due_date, completed_at,
      estimated_cost, actual_cost,
      property:properties(name),
      occupant:occupants(full_name),
      service_provider:service_providers(name)
    `)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data } = await query;

  const rows = [
    ["Title", "Status", "Priority", "Category", "Property", "Tenant", "Provider", "Created", "Due", "Completed", "Est. Cost", "Actual Cost"],
    ...(data || []).map((wo: any) => [
      wo.title,
      wo.status,
      wo.priority,
      wo.category,
      wo.property?.name || "",
      wo.occupant?.full_name || "",
      wo.service_provider?.name || "",
      wo.created_at ? format(new Date(wo.created_at), "MM/dd/yyyy") : "",
      wo.due_date ? format(new Date(wo.due_date), "MM/dd/yyyy") : "",
      wo.completed_at ? format(new Date(wo.completed_at), "MM/dd/yyyy") : "",
      wo.estimated_cost?.toFixed(2) || "0.00",
      wo.actual_cost?.toFixed(2) || "0.00",
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="propvault-work-orders-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
