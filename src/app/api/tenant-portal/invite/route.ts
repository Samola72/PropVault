import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRequestContext } from "@/lib/api/helpers";
import crypto from "crypto";

// POST /api/tenant-portal/invite - Property manager invites tenant to portal
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

    // Only property managers and admins can invite tenants
    if (userProfile.role !== "PROPERTY_MANAGER" && 
        userProfile.role !== "SUPER_ADMIN" && 
        userProfile.role !== "ORG_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Only property managers can invite tenants" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { occupantId } = body;

    if (!occupantId) {
      return NextResponse.json(
        { error: "Occupant ID is required" },
        { status: 400 }
      );
    }

    // Verify occupant exists and belongs to this manager
    const { data: occupant, error: occupantError } = (await supabase
      .from("occupants")
      .select(`
        *,
        property:properties!inner(
          id,
          name,
          manager_id,
          organization_id
        )
      `)
      .eq("id", occupantId)
      .single()) as any;

    if (occupantError || !occupant) {
      return NextResponse.json(
        { error: "Occupant not found" },
        { status: 404 }
      );
    }

    // Verify manager owns this property
    if (occupant.property.manager_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You don't manage this property" },
        { status: 403 }
      );
    }

    // Check if already invited
    if (occupant.portal_enabled) {
      return NextResponse.json(
        { error: "Tenant portal is already enabled for this occupant" },
        { status: 400 }
      );
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString("hex");

    // Update occupant with invitation token
    const { error: updateError } = await (supabase
      .from("occupants") as any)
      .update({
        portal_invitation_token: invitationToken,
        portal_invited_at: new Date().toISOString(),
      })
      .eq("id", occupantId);

    if (updateError) {
      console.error("Error updating occupant:", updateError);
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 }
      );
    }

    // TODO: Send invitation email
    // In a production app, you would send an email here with:
    // const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tenant/accept-invitation?token=${invitationToken}`;
    // await sendEmail(occupant.email, 'Tenant Portal Invitation', invitationUrl);

    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/tenant/accept-invitation?token=${invitationToken}`;

    return NextResponse.json({
      success: true,
      message: "Invitation created successfully",
      invitationUrl,
      invitationToken, // Remove in production, only for testing
    });
  } catch (error) {
    console.error("Error inviting tenant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
