import Link from "next/link";
import { Building2, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mb-8">
        <Building2 className="w-10 h-10 text-blue-600" />
      </div>
      <h1 className="text-6xl font-black text-gray-900 mb-4">404</h1>
      <p className="text-xl font-semibold text-gray-700 mb-2">Page not found</p>
      <p className="text-gray-500 text-center mb-10 max-w-sm">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
      >
        <Home className="w-4 h-4" />
        Go to Dashboard
      </Link>
    </div>
  );
}
