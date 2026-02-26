"use client";

import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth/actions";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        console.log("Loading user...");
        const supabase = getSupabaseClient();
        console.log("Supabase client created");
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log("User data:", user);
        console.log("Error:", error);
        setUser(user);
      } catch (err) {
        console.error("Error loading user:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🎉 Welcome to PropVault!
              </h1>
              <p className="text-gray-500">
                Authentication is working perfectly!
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              Sign Out
            </button>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">
              👤 Your Account
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-blue-700">Email:</span>{" "}
                <span className="text-blue-900">{user.email}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">User ID:</span>{" "}
                <span className="text-blue-900 font-mono text-xs">{user.id}</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Email Confirmed:</span>{" "}
                <span className="text-blue-900">
                  {user.email_confirmed_at ? "✅ Yes" : "❌ No"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
            <h2 className="text-xl font-bold mb-3">✅ Batch 02 Complete!</h2>
            <p className="mb-4 leading-relaxed">
              Your authentication system is fully functional with:
            </p>
            <ul className="space-y-2 text-sm">
              <li>✅ User registration with email verification</li>
              <li>✅ Login with session management</li>
              <li>✅ Password reset flow</li>
              <li>✅ Sign out functionality</li>
              <li>✅ Protected routes with middleware</li>
              <li>✅ Secure cookie-based sessions</li>
            </ul>
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="font-semibold mb-2">🚀 Ready for Batch 03:</p>
              <p className="text-sm text-blue-100">
                Dashboard layout with sidebar, Properties management, Work orders, Tenants, and more!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
