import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { uploadFile, deleteFile } from "@/lib/upload";

export interface Document {
  id: string;
  organization_id: string;
  property_id: string | null;
  occupant_id: string | null;
  work_order_id: string | null;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  description: string | null;
  uploaded_by: string;
  created_at: string;
  property?: { id: string; name: string } | null;
  occupant?: { id: string; full_name: string } | null;
  uploader?: { id: string; full_name: string } | null;
}

interface DocumentFilters {
  search?: string;
  category?: string;
  property_id?: string;
}

async function fetchDocuments(filters: DocumentFilters = {}): Promise<{ data: Document[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.property_id) params.set("property_id", filters.property_id);
  params.set("limit", "100");

  const res = await fetch(`/api/documents?${params}`);
  if (!res.ok) throw new Error("Failed to load documents");
  return (await res.json()).data;
}

async function uploadDocument(payload: {
  file: File;
  name: string;
  category: string;
  property_id?: string;
  occupant_id?: string;
  work_order_id?: string;
  description?: string;
}) {
  // Upload file to Supabase Storage first
  const fileUrl = await uploadFile(payload.file, "documents");

  // Then save metadata
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      file_url: fileUrl,
      file_type: payload.file.type,
      file_size: payload.file.size,
      category: payload.category,
      property_id: payload.property_id || null,
      occupant_id: payload.occupant_id || null,
      work_order_id: payload.work_order_id || null,
      description: payload.description || null,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: { message: "Failed to save document metadata" } }));
    throw new Error(errorData.error?.message || "Failed to save document metadata");
  }
  return (await res.json()).data;
}

async function deleteDocument(id: string) {
  const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete document");
  return (await res.json()).data;
}

export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: ["documents", filters],
    queryFn: () => fetchDocuments(filters),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
