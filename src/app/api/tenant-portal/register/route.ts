import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// POST /api/tenant-portal/register - Tenant accepts invitation and creates account
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { token, email, password, firstName, lastName } = body;

    if (!token || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Verify invitation token
    const { data: occupant, error: occupantError } = (await supabase
      .from("occupants")
      .select(`
        *,
        property:properties!inner(
          id,
          name,
          address,
          city,
          state,
          manager_id,
          organization_id
        )
      `)
      .eq("portal_invitation_token", token)
      .eq("portal_enabled", false)
      .single()) as any;

    if (occupantError || !occupant) {
      return NextResponse.json(
        { error: "Invalid or expired invitation token" },
        { status: 400 }
      );
    }

    // Verify email matches
    if (occupant.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email does not match invitation" },
        { status: 400 }
      );
    }

    // Create auth user (using admin client)
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for invited tenants
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: "TENANT",
      },
    });

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      return NextResponse.json(
        { error: "Failed to create account. Email may already be in use." },
        { status: 400 }
      );
    }

    // Create user profile
    const { error: userError } = await (supabase
      .from("users") as any)
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role: "TENANT",
        organization_id: occupant.property.organization_id,
        auth_user_id: authData.user.id,
      });

    if (userError) {
      console.error("Error creating user profile:", userError);
      // Clean up auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    // Update occupant with portal user and enable portal
    const { error: updateError } = await (supabase
      .from("occupants") as any)
      .update({
        portal_user_id: authData.user.id,
        portal_enabled: true,
        portal_invitation_token: null, // Clear token after use
      })
      .eq("id", occupant.id);

    if (updateError) {
      console.error("Error updating occupant:", updateError);
      return NextResponse.json(
        { error: "Failed to activate portal access" },
        { status: 500 }
      );
    }

    // Log activity
    await (supabase.from("tenant_portal_activity") as any).insert({
      tenant_user_id: authData.user.id,
      activity_type: "registration_completed",
      activity_data: {
        occupant_id: occupant.id,
        property_id: occupant.property_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: authData.user.id,
        email,
        firstName,
        lastName,
      },
    });
  } catch (error) {
    console.error("Error registering tenant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
