import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationName, fullName } = await request.json();

    if (!organizationName || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Check if user already has a profile
    const { data: existingUser } = await adminClient
      .from("users")
      .select("*, organization:organizations(*)")
      .eq("auth_user_id", user.id)
      .single();

    if (existingUser) {
      // User already onboarded
      return NextResponse.json({ 
        success: true, 
        organization: (existingUser as any).organization 
      });
    }

    // Generate subdomain
    const subdomain = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30) + '-' + Date.now();

    // Create organization
    const { data: org, error: orgError } = await adminClient
      .from("organizations")
      .insert({
        name: organizationName,
        subdomain: subdomain,
        plan: "PROFESSIONAL",
      } as any)
      .select()
      .single();

    if (orgError) {
      console.error("Organization creation error:", orgError);
      return NextResponse.json({ error: "Failed to create organization", details: orgError }, { status: 500 });
    }

    // Create user profile
    const { error: userError } = await adminClient
      .from("users")
      .insert({
        auth_user_id: user.id,
        organization_id: (org as any).id,
        email: user.email,
        full_name: fullName,
        role: "ORG_ADMIN",
      } as any);

    if (userError) {
      console.error("User profile creation error:", userError);
      return NextResponse.json({ error: "Failed to create user profile", details: userError }, { status: 500 });
    }

    return NextResponse.json({ success: true, organization: org });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
