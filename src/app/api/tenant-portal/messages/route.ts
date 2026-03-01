import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRequestContext } from "@/lib/api/helpers";

// GET /api/tenant-portal/messages - Get tenant's messages
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

    // Get messages related to this property
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
        subject,
        content,
        is_read,
        created_at,
        sender:users!messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        recipient:users!messages_recipient_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("property_id", occupancy.property_id)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Error in messages endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tenant-portal/messages - Tenant sends message to property manager
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
    const { subject, content } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Subject and content are required" },
        { status: 400 }
      );
    }

    // Get tenant's occupancy and property manager
    const { data: occupancy, error: occupancyError } = (await supabase
      .from("occupants")
      .select(`
        id,
        property_id,
        property:properties!inner(
          id,
          manager_id,
          organization_id
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

    // Create message
    const { data: message, error: messageError } = await (supabase
      .from("messages") as any)
      .insert({
        sender_id: user.id,
        recipient_id: occupancy.property.manager_id,
        property_id: occupancy.property_id,
        organization_id: occupancy.property.organization_id,
        subject,
        content,
        is_tenant_message: true,
        is_read: false,
      })
      .select(`
        id,
        subject,
        content,
        created_at,
        sender:users!messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (messageError || !message) {
      console.error("Error creating message:", messageError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // Log activity
    await (supabase.from("tenant_portal_activity") as any).insert({
      tenant_user_id: user.id,
      activity_type: "message_sent",
      activity_data: {
        message_id: message.id,
        property_id: occupancy.property_id,
        subject,
      },
    });

    // Create notification for property manager
    await (supabase.from("notifications") as any).insert({
      user_id: occupancy.property.manager_id,
      type: "MESSAGE_RECEIVED",
      title: "New Message from Tenant",
      message: `${userProfile.full_name}: ${subject}`,
      link: `/messages`,
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
