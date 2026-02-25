"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ServiceProvider, FilterParams } from "@/types";

const BASE = "/api/providers";

async function fetchProviders(
  params: FilterParams & { specialty?: string; availability_status?: string } = {}
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) query.set(k, String(v));
  });
  const res = await fetch(`${BASE}?${query}`);
  if (!res.ok) throw new Error("Failed to fetch providers");
  return (await res.json()).data;
}

async function fetchProvider(id: string) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Provider not found");
  return (await res.json()).data;
}

async function createProvider(data: Partial<ServiceProvider>) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create provider");
  }
  return (await res.json()).data;
}

async function updateProvider({
  id,
  data,
}: {
  id: string;
  data: Partial<ServiceProvider>;
}) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update provider");
  }
  return (await res.json()).data;
}

async function deleteProvider(id: string) {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove provider");
  return (await res.json()).data;
}

export function useProviders(
  params?: FilterParams & {
    specialty?: string;
    availability_status?: string;
  }
) {
  return useQuery({
    queryKey: ["providers", params],
    queryFn: () => fetchProviders(params),
  });
}

export function useProvider(id: string) {
  return useQuery({
    queryKey: ["providers", id],
    queryFn: () => fetchProvider(id),
    enabled: !!id,
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProvider,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Provider added successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProvider,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Provider updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProvider,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Provider removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
