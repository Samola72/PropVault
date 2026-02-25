"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/lib/auth/actions";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({ resolver: zodResolver(schema) });

  async function onSubmit(data: ForgotForm) {
    setIsLoading(true);
    setError(null);
    const result = await resetPassword(data.email);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setIsLoading(false);
  }

  if (success) {
    return (
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h2>
        <p className="text-gray-500 mb-8">
          We sent you a password reset link. It expires in 1 hour.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset password</h2>
        <p className="text-gray-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="you@company.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending link...
            </>
          ) : (
            "Send reset link"
          )}
        </button>
      </form>
    </div>
  );
}
