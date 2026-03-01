import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRequestContext } from "@/lib/api/helpers";

// GET /api/tenant-portal/work-orders - Get tenant's work orders
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const context = await getRequestContext();
    
    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { user, userProfile } = context;

    // Only tenants can access this endpoint
    if (userProfile.role !== "TENANT") {
      return NextResponse.json(
        { error: "Unauthorized - Tenant access only" },
        { status: 403 }
      );
    }

    // Get tenant's property
    const { data: occupancy } = (await supabase
      .from("occupants")
      .select("property_id")
      .eq("portal_user_id", user.id)
      .eq("portal_enabled", true)
      .eq("status", "ACTIVE")
      .single()) as any;

    if (!occupancy) {
      return NextResponse.json(
        { error: "No active tenancy found" },
        { status: 404 }
      );
    }

    // Get work orders for this property
    const { data: workOrders, error } = await supabase
      .from("work_orders")
      .select(`
        id,
        title,
        description,
        status,
        priority,
        category,
        created_at,
        updated_at,
        scheduled_date,
        completed_date,
        submitted_by_tenant,
        tenant_notes
      `)
      .eq("property_id", occupancy.property_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching work orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch work orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ workOrders: workOrders || [] });
  } catch (error) {
    console.error("Error in work orders endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tenant-portal/work-orders - Tenant submits a maintenance request
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const context = await getRequestContext();
    
    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { user, userProfile } = context;

    // Only tenants can access this endpoint
    if (userProfile.role !== "TENANT") {
      return NextResponse.json(
        { error: "Unauthorized - Tenant access only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, category, priority, tenantNotes } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Get tenant's occupancy
    const { data: occupancy, error: occupancyError } = (await supabase
      .from("occupants")
      .select(`
        id,
        property_id,
        property:properties!inner(
          organization_id,
          manager_id
        )
      `)
      .eq("portal_user_id", user.id)
      .eq("portal_enabled", true)
      .eq("status", "ACTIVE")
      .single()) as any;

    if (occupancyError || !occupancy) {
      return NextResponse.json(
        { error: "No active tenancy found" },
        { status: 404 }
      );
    }

    // Create work order
    const { data: workOrder, error: workOrderError } = await (supabase
      .from("work_orders") as any)
      .insert({
        property_id: occupancy.property_id,
        organization_id: occupancy.property.organization_id,
        title,
        description,
        category: category || "MAINTENANCE",
        priority: priority || "MEDIUM",
        status: "PENDING",
        submitted_by_tenant: true,
        tenant_notes: tenantNotes,
        created_by: user.id,
      })
      .select()
      .single();

    if (workOrderError || !workOrder) {
      console.error("Error creating work order:", workOrderError);
      return NextResponse.json(
        { error: "Failed to create work order" },
        { status: 500 }
      );
    }

    // Log activity
    await (supabase.from("tenant_portal_activity") as any).insert({
      tenant_user_id: user.id,
      activity_type: "work_order_created",
      activity_data: {
        work_order_id: workOrder.id,
        property_id: occupancy.property_id,
        title,
        category,
        priority,
      },
    });

    // TODO: Send notification to property manager
    // Create notification for property manager
    await (supabase.from("notifications") as any).insert({
      user_id: occupancy.property.manager_id,
      type: "WORK_ORDER_CREATED",
      title: "New Maintenance Request from Tenant",
      message: `${userProfile.full_name} submitted a maintenance request: ${title}`,
      link: `/work-orders/${workOrder.id}`,
    });

    return NextResponse.json({
      success: true,
      workOrder,
      message: "Maintenance request submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting work order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
