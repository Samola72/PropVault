import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { PLANS, type PlanKey } from "@/lib/stripe/server";

// Re-export PLANS for use in client components
export { PLANS };
export type { PlanKey };

export interface BillingStatus {
  plan: string;
  planStatus: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
  hasSubscription: boolean;
  hasCustomer: boolean;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  stripePriceId: string | null;
  usage: {
    properties: number;
    maxProperties: number | null;
    users: number;
    maxUsers: number | null;
  };
}

export function useBillingStatus() {
  return useQuery<BillingStatus>({
    queryKey: ["billing-status"],
    queryFn: async () => {
      const res = await fetch("/api/billing/status");
      if (!res.ok) throw new Error("Failed to load billing status");
      return (await res.json()).data;
    },
    staleTime: 30_000,
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async ({
      planKey,
      interval,
    }: {
      planKey: PlanKey;
      interval: "monthly" | "yearly";
    }) => {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, interval }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Checkout failed");
      }
      const data = await res.json();
      // Redirect to Stripe Checkout
      window.location.href = data.data.url;
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCustomerPortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to open billing portal");
      }
      const data = await res.json();
      window.location.href = data.data.url;
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSendRentPaymentLink() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await fetch("/api/billing/rent-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create payment link");
      }
      return (await res.json()).data;
    },
    onSuccess: (data) => {
      toast.success("Payment link created!");
      // Copy to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data.url);
        toast.success("Link copied to clipboard", { duration: 3000 });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
