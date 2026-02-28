import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, unauthorized } from "@/lib/api/helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const ctx = await getRequestContext();
  if (!ctx) return unauthorized();

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const orgId = ctx.organizationId;

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("invoices")
    .select(`
      invoice_number, type, status, issue_date, due_date,
      total_amount, paid_amount, balance, tax_amount, discount_amount,
      property:properties(name),
      occupant:occupants(full_name)
    `)
    .eq("organization_id", orgId)
    .order("issue_date", { ascending: false });

  if (from) query = query.gte("issue_date", from);
  if (to) query = query.lte("issue_date", to);

  const { data } = await query;

  const rows = [
    ["Invoice #", "Type", "Status", "Property", "Tenant", "Issue Date", "Due Date", "Total", "Paid", "Balance"],
    ...(data || []).map((inv: any) => [
      inv.invoice_number,
      inv.type,
      inv.status,
      inv.property?.name || "",
      inv.occupant?.full_name || "",
      inv.issue_date ? format(new Date(inv.issue_date), "MM/dd/yyyy") : "",
      inv.due_date ? format(new Date(inv.due_date), "MM/dd/yyyy") : "",
      inv.total_amount.toFixed(2),
      inv.paid_amount.toFixed(2),
      inv.balance.toFixed(2),
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="propvault-invoices-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
