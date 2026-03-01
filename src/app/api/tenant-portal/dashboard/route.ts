import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRequestContext } from "@/lib/api/helpers";

// GET /api/tenant-portal/dashboard - Get tenant dashboard data
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

    // Get tenant's occupancy info
    const { data: occupancy, error: occupancyError } = (await supabase
      .from("occupants")
      .select(`
        id,
        property_id,
        unit_number,
        move_in_date,
        lease_end_date,
        rent_amount,
        status,
        portal_last_login,
        property:properties!inner(
          id,
          name,
          address,
          city,
          state,
          zip_code,
          property_type,
          manager:users!properties_manager_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          )
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

    // Update last login
    await (supabase
      .from("occupants") as any)
      .update({ portal_last_login: new Date().toISOString() })
      .eq("id", occupancy.id);

    // Get recent work orders
    const { data: workOrders, error: workOrdersError } = await supabase
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
        submitted_by_tenant
      `)
      .eq("property_id", occupancy.property_id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (workOrdersError) {
      console.error("Error fetching work orders:", workOrdersError);
    }

    // Get unread messages count
    const { count: unreadCount, error: messagesError } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("property_id", occupancy.property_id)
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    if (messagesError) {
      console.error("Error fetching messages count:", messagesError);
    }

    // Get recent activity
    const { data: activity, error: activityError } = await supabase
      .from("tenant_portal_activity")
      .select("*")
      .eq("tenant_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (activityError) {
      console.error("Error fetching activity:", activityError);
    }

    // Log dashboard access
    await (supabase.from("tenant_portal_activity") as any).insert({
      tenant_user_id: user.id,
      activity_type: "dashboard_viewed",
      activity_data: {
        occupant_id: occupancy.id,
        property_id: occupancy.property_id,
      },
    });

    return NextResponse.json({
      occupancy: {
        id: occupancy.id,
        unitNumber: occupancy.unit_number,
        moveInDate: occupancy.move_in_date,
        leaseEndDate: occupancy.lease_end_date,
        rentAmount: occupancy.rent_amount,
        status: occupancy.status,
      },
      property: {
        id: occupancy.property.id,
        name: occupancy.property.name,
        address: occupancy.property.address,
        city: occupancy.property.city,
        state: occupancy.property.state,
        zipCode: occupancy.property.zip_code,
        type: occupancy.property.property_type,
      },
      manager: occupancy.property.manager ? {
        id: occupancy.property.manager.id,
        firstName: occupancy.property.manager.first_name,
        lastName: occupancy.property.manager.last_name,
        email: occupancy.property.manager.email,
        phone: occupancy.property.manager.phone,
      } : null,
      workOrders: workOrders || [],
      unreadMessages: unreadCount || 0,
      recentActivity: activity || [],
    });
  } catch (error) {
    console.error("Error fetching tenant dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
