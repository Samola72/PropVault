"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Zap,
  Check,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Building2,
  ArrowRight,
  Star,
} from "lucide-react";
import {
  useBillingStatus,
  useCheckout,
  useCustomerPortal,
  PLANS,
  type PlanKey,
} from "@/hooks/use-billing";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  trialing: { label: "Trial", color: "bg-blue-100 text-blue-700", icon: Clock },
  past_due: {
    label: "Past Due",
    color: "bg-red-100 text-red-700",
    icon: AlertCircle,
  },
  canceled: {
    label: "Canceled",
    color: "bg-gray-100 text-gray-700",
    icon: AlertCircle,
  },
  unpaid: {
    label: "Unpaid",
    color: "bg-red-100 text-red-700",
    icon: AlertCircle,
  },
};

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const { data: billing, isLoading } = useBillingStatus();
  const checkout = useCheckout();
  const portal = useCustomerPortal();

  // Handle redirect from Stripe
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription activated! Welcome to PropVault.");
    }
    if (searchParams.get("canceled") === "true") {
      toast("Checkout canceled — no charges made.", { icon: "ℹ️" });
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const currentPlanKey = (billing?.plan?.toLowerCase() ||
    "starter") as PlanKey;
  const statusConfig = STATUS_CONFIG[billing?.planStatus || "trialing"];
  const StatusIcon = statusConfig?.icon || Clock;

  return (
    <div className="max-w-5xl animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Billing & Subscription
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your PropVault subscription and payment method
        </p>
      </div>

      {/* Current Subscription Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {PLANS[currentPlanKey]?.name || "Starter"} Plan
                </h3>
                {statusConfig && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                      statusConfig.color
                    )}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {billing?.planStatus === "trialing" && billing.trialEndsAt
                  ? `Trial ends ${formatDate(billing.trialEndsAt)}`
                  : billing?.currentPeriodEnd
                    ? `Next billing date: ${formatDate(billing.currentPeriodEnd)}`
                    : "No active subscription"}
              </p>
              {billing?.cancelAtPeriodEnd && (
                <p className="text-sm text-orange-600 font-medium mt-1">
                  ⚠️ Cancels at end of billing period
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {billing?.hasSubscription ? (
              <button
                onClick={() => portal.mutate()}
                disabled={portal.isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ExternalLink className="w-4 h-4" />
                {portal.isPending ? "Opening..." : "Manage Subscription"}
              </button>
            ) : (
              <div className="text-sm text-gray-500 italic">
                Subscribe below to activate
              </div>
            )}
          </div>
        </div>

        {/* Usage Stats */}
        {billing?.usage && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Current Usage
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* Properties */}
              <UsageMeter
                icon={Building2}
                label="Properties"
                current={billing.usage.properties}
                max={billing.usage.maxProperties}
                color="blue"
              />
              {/* Users */}
              <UsageMeter
                icon={Users}
                label="Team Members"
                current={billing.usage.users}
                max={billing.usage.maxUsers}
                color="purple"
              />
            </div>
          </div>
        )}
      </div>

      {/* Alert for past due / trial ending */}
      {billing?.planStatus === "past_due" && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Payment Failed</p>
            <p className="text-sm text-red-600 mt-0.5">
              Your last payment failed. Please update your payment method to
              keep your account active.
            </p>
            <button
              onClick={() => portal.mutate()}
              className="mt-2 text-sm font-semibold text-red-700 underline hover:no-underline"
            >
              Update payment method →
            </button>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Choose a Plan
            </h3>
            <p className="text-sm text-gray-500">
              All plans include a 14-day free trial
            </p>
          </div>

          {/* Billing interval toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            {(["monthly", "yearly"] as const).map((interval) => (
              <button
                key={interval}
                onClick={() => setBillingInterval(interval)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition",
                  billingInterval === interval
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {interval === "monthly" ? "Monthly" : "Yearly"}
                {interval === "yearly" && (
                  <span className="ml-1.5 text-xs text-green-600 font-semibold">
                    –17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(
            Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]
          ).map(([planKey, plan]) => {
            const isCurrentPlan = currentPlanKey === planKey;
            const isPro = planKey === "pro";
            const price =
              billingInterval === "monthly"
                ? plan.priceMonthly
                : Math.round(plan.priceYearly / 12);

            return (
              <div
                key={planKey}
                className={cn(
                  "relative rounded-2xl border-2 p-5 flex flex-col transition",
                  isPro
                    ? "border-blue-500 bg-blue-50"
                    : isCurrentPlan
                      ? "border-green-200 bg-green-50"
                      : "border-gray-100 bg-white"
                )}
              >
                {/* Popular badge */}
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                      <Star className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900">
                    {plan.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">
                      ${price}
                    </span>
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                  {billingInterval === "yearly" && (
                    <p className="text-xs text-green-600 font-medium mt-0.5">
                      ${plan.priceYearly}/year — saves $
                      {plan.priceMonthly * 12 - plan.priceYearly}
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan && billing?.hasSubscription ? (
                  <div className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-green-700 bg-green-100 rounded-xl">
                    <CheckCircle className="w-4 h-4" />
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      checkout.mutate({
                        planKey,
                        interval: billingInterval,
                      })
                    }
                    disabled={checkout.isPending}
                    className={cn(
                      "w-full py-2.5 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50",
                      isPro
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700"
                    )}
                  >
                    {checkout.isPending ? "Redirecting..." : "Start Free Trial"}
                    {!checkout.isPending && <ArrowRight className="w-4 h-4" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          All plans include SSL security, daily backups, and 99.9% uptime SLA.
          Cancel anytime — no long-term contracts.
        </p>
      </div>
    </div>
  );
}

// ─── Usage Meter Component ────────────────────────────────────────────────────
function UsageMeter({
  icon: Icon,
  label,
  current,
  max,
  color,
}: {
  icon: React.ElementType;
  label: string;
  current: number;
  max: number | null;
  color: "blue" | "purple";
}) {
  const pct = max ? Math.min(100, (current / max) * 100) : 0;
  const isNearLimit = max && pct >= 80;
  const isAtLimit = max && pct >= 100;

  const colorMap = {
    blue: {
      bar: isAtLimit
        ? "bg-red-500"
        : isNearLimit
          ? "bg-orange-400"
          : "bg-blue-500",
      icon: "text-blue-600 bg-blue-50",
    },
    purple: {
      bar: isAtLimit
        ? "bg-red-500"
        : isNearLimit
          ? "bg-orange-400"
          : "bg-purple-500",
      icon: "text-purple-600 bg-purple-50",
    },
  };

  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            colorMap[color].icon
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-gray-900">{current}</span>
        <span className="text-sm text-gray-500">/ {max ? max : "∞"}</span>
      </div>
      {max && (
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              colorMap[color].bar
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {isAtLimit && (
        <p className="text-xs text-red-600 font-medium mt-1.5">
          Limit reached — upgrade to add more
        </p>
      )}
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-orange-600 mt-1.5">Approaching limit</p>
      )}
    </div>
  );
}
