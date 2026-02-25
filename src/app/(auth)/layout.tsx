import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PropVault — Sign In",
  description: "Property Management Platform",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Branding panel */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-12 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-16">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.999.999 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13z" />
            </svg>
          </div>
          <span className="text-2xl font-bold">PropVault</span>
        </div>

        {/* Hero text */}
        <div className="relative flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-bold leading-tight mb-6">
            Property Management,
            <br />
            <span className="text-blue-300">Simplified.</span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed mb-12">
            Manage properties, tenants, work orders, and service providers
            from one powerful platform.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: "2,000+", label: "Properties managed" },
              { value: "98%", label: "Uptime guaranteed" },
              { value: "24/7", label: "Support available" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-blue-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-blue-300 text-sm">
          © {new Date().getFullYear()} PropVault. All rights reserved.
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.999.999 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13z" />
              </svg>
            </div>
            <span className="text-xl font-bold">PropVault</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
