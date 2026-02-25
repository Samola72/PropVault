"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export interface AuthResult {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function signUp(formData: {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
}): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
        },
      },
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: "Failed to create account" };
    }

    // 2. Create organization
    const subdomain = slugify(formData.organizationName);
    const { data: org, error: orgError } = await (adminClient
      .from("organizations") as any)
      .insert({
        name: formData.organizationName,
        subdomain: `${subdomain}-${Date.now()}`,
        plan: "STARTER",
      })
      .select()
      .single();

    if (orgError) {
      return { error: "Failed to create organization. Try a different name." };
    }

    // 3. Create user profile
    const { error: userError } = await (adminClient.from("users") as any).insert({
      auth_user_id: authData.user.id,
      organization_id: org.id,
      email: formData.email,
      full_name: formData.fullName,
      role: "ORG_ADMIN",
    });

    if (userError) {
      return { error: "Failed to create user profile" };
    }

    return { success: true, message: "Account created! Please check your email to verify." };
  } catch (err) {
    console.error("SignUp error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function signIn(formData: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Update last login
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const adminClient = createAdminClient();
    await (adminClient
      .from("users") as any)
      .update({ last_login: new Date().toISOString() })
      .eq("auth_user_id", user.id);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    message: "Check your email for a password reset link",
  };
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
