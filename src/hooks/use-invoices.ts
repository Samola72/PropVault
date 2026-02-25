"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { Invoice, FilterParams } from "@/types";

const BASE = "/api/invoices";

async function fetchInvoices(
  params: FilterParams & {
    property_id?: string;
    overdue?: boolean;
  } = {}
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) query.set(k, String(v));
  });
  const res = await fetch(`${BASE}?${query}`);
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return (await res.json()).data;
}

async function fetchInvoice(id: string) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Invoice not found");
  return (await res.json()).data;
}

async function createInvoice(data: Partial<Invoice>) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create invoice");
  }
  return (await res.json()).data;
}

async function updateInvoice({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown>;
}) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update invoice");
  }
  return (await res.json()).data;
}

async function recordPayment({
  id,
  amount,
  date,
}: {
  id: string;
  amount: number;
  date?: string;
}) {
  return updateInvoice({
    id,
    data: {
      action: "RECORD_PAYMENT",
      payment_amount: amount,
      payment_date: date,
    },
  });
}

export function useInvoices(
  params?: FilterParams & { property_id?: string; overdue?: boolean }
) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => fetchInvoices(params),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => fetchInvoice(id),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateInvoice,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment recorded successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
