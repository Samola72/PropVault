"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const BASE = "/api/properties";

interface FilterParams {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

async function fetchProperties(params: FilterParams = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.type) query.set("type", params.type);
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);

  const res = await fetch(`${BASE}?${query}`);
  if (!res.ok) throw new Error("Failed to fetch properties");
  const json = await res.json();
  return json.data;
}

async function fetchProperty(id: string) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Property not found");
  const json = await res.json();
  return json.data;
}

async function createProperty(data: Record<string, any>) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create property");
  }
  return (await res.json()).data;
}

async function updateProperty({ id, data }: { id: string; data: Record<string, any> }) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update property");
  }
  return (await res.json()).data;
}

async function deleteProperty(id: string) {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete property");
  return (await res.json()).data;
}

export function useProperties(params?: FilterParams) {
  return useQuery({
    queryKey: ["properties", params],
    queryFn: () => fetchProperties(params),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ["properties", id],
    queryFn: () => fetchProperty(id),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Property created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProperty,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.setQueryData(["properties", data.id], data);
      toast.success("Property updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Property deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
