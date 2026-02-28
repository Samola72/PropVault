import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";

export function useAnalytics(months = 12) {
  const orgId = useAuthStore((s) => s.user?.organization_id);

  return useQuery({
    queryKey: ["analytics", orgId, months],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?months=${months}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
    enabled: !!orgId,
    staleTime: 5 * 60_000, // 5 min — analytics data can be slightly stale
  });
}

export function useExportCSV() {
  function download(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return {
    exportInvoices: (from?: string, to?: string) => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      download(`/api/analytics/export/invoices?${params}`, "invoices.csv");
    },
    exportWorkOrders: (from?: string, to?: string) => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      download(`/api/analytics/export/work-orders?${params}`, "work-orders.csv");
    },
    exportProperties: () => {
      download(`/api/analytics/export/properties`, "properties.csv");
    },
  };
}
