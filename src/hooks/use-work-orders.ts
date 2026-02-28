"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const BASE = "/api/work-orders";

interface FilterParams {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  property_id?: string;
  assigned_to?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

async function fetchWorkOrders(params: FilterParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) query.set(k, String(v));
  });
  const res = await fetch(`${BASE}?${query}`);
  if (!res.ok) throw new Error("Failed to fetch work orders");
  return (await res.json()).data;
}

async function fetchWorkOrder(id: string) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Work order not found");
  return (await res.json()).data;
}

async function createWorkOrder(data: Record<string, any>) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create work order");
  }
  return (await res.json()).data;
}

async function updateWorkOrder({ id, data }: { id: string; data: Record<string, unknown> }) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update work order");
  }
  return (await res.json()).data;
}

export function useWorkOrders(params?: FilterParams) {
  return useQuery({
    queryKey: ["work-orders", params],
    queryFn: () => fetchWorkOrders(params),
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ["work-orders", id],
    queryFn: () => fetchWorkOrder(id),
    enabled: !!id,
  });
}

export function useCreateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work-orders"] });
      toast.success("Work order created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateWorkOrder,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["work-orders"] });
      qc.setQueryData(["work-orders", data.id], data);
      toast.success("Work order updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete work order");
      return (await res.json()).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work-orders"] });
      toast.success("Work order deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
