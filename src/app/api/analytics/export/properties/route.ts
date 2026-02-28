import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, unauthorized } from "@/lib/api/helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const ctx = await getRequestContext();
  if (!ctx) return unauthorized();

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("properties")
    .select(`
      name, type, status, address_line1, city, state, postal_code,
      bedrooms, bathrooms, square_feet, year_built, monthly_rent, purchase_price
    `)
    .eq("organization_id", ctx.organizationId)
    .order("name");

  const rows = [
    ["Name", "Type", "Status", "Address", "City", "State", "ZIP", "Beds", "Baths", "Sq Ft", "Year Built", "Monthly Rent", "Purchase Price"],
    ...(data || []).map((p: any) => [
      p.name, p.type, p.status,
      p.address_line1, p.city, p.state, p.postal_code,
      p.bedrooms || "", p.bathrooms || "", p.square_feet || "", p.year_built || "",
      p.monthly_rent?.toFixed(2) || "",
      p.purchase_price?.toFixed(2) || "",
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="propvault-properties-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
