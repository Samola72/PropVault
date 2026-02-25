"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const BASE = "/api/tenants";

interface FilterParams {
  search?: string;
  status?: string;
  property_id?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

async function fetchTenants(params: FilterParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) query.set(k, String(v));
  });
  const res = await fetch(`${BASE}?${query}`);
  if (!res.ok) throw new Error("Failed to fetch tenants");
  return (await res.json()).data;
}

async function fetchTenant(id: string) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Tenant not found");
  return (await res.json()).data;
}

async function createTenant(data: Record<string, any>) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create tenant");
  }
  return (await res.json()).data;
}

async function updateTenant({ id, data }: { id: string; data: Record<string, any> }) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update tenant");
  }
  return (await res.json()).data;
}

async function deleteTenant(id: string) {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete tenant");
  return (await res.json()).data;
}

export function useTenants(params?: FilterParams) {
  return useQuery({
    queryKey: ["tenants", params],
    queryFn: () => fetchTenants(params),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ["tenants", id],
    queryFn: () => fetchTenant(id),
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Tenant added successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTenant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Tenant removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
