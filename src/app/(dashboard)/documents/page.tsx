"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import {
  FolderOpen, Upload, Search, File, FileText, Image,
  Trash2, ExternalLink, Filter, X, Building2, ChevronDown
} from "lucide-react";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/use-documents";
import { useProperties } from "@/hooks/use-properties";
import { Modal } from "@/components/shared/modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { formatFileSize, getFileIcon } from "@/lib/upload";
import { formatDate, cn } from "@/lib/utils";
import type { Document } from "@/hooks/use-documents";

const DOCUMENT_CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "LEASE", label: "Lease Agreements" },
  { value: "DEED", label: "Deeds & Titles" },
  { value: "INSPECTION", label: "Inspection Reports" },
  { value: "INSURANCE", label: "Insurance Documents" },
  { value: "TAX", label: "Tax Documents" },
  { value: "PERMIT", label: "Permits & Licenses" },
  { value: "MAINTENANCE", label: "Maintenance Records" },
  { value: "FINANCIAL", label: "Financial Records" },
  { value: "CORRESPONDENCE", label: "Correspondence" },
  { value: "OTHER", label: "Other" },
];

function getFileTypeIcon(fileType: string) {
  if (fileType?.startsWith("image/")) return <Image className="w-5 h-5 text-blue-500" />;
  if (fileType === "application/pdf") return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-gray-400" />;
}

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Upload form state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState("OTHER");
  const [uploadPropertyId, setUploadPropertyId] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documentsData, isLoading } = useDocuments({ search, category, property_id: propertyFilter });
  const { data: propertiesData } = useProperties({});
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();

  const documents: Document[] = documentsData?.data || [];
  const properties = propertiesData?.data || [];

  // Group documents by category
  const grouped = DOCUMENT_CATEGORIES.filter((c) => c.value).reduce(
    (acc, cat) => {
      const items = documents.filter((d) => d.category === cat.value);
      if (items.length > 0) acc[cat.value] = { label: cat.label, items };
      return acc;
    },
    {} as Record<string, { label: string; items: Document[] }>
  );

  // Drag and drop
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setUploadFiles(droppedFiles);
      setUploadOpen(true);
    }
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setUploadFiles(Array.from(e.target.files));
      setUploadOpen(true);
    }
  }

  async function handleUpload() {
    if (uploadFiles.length === 0) return;

    for (const file of uploadFiles) {
      await uploadDocument.mutateAsync({
        file,
        name: file.name,
        category: uploadCategory,
        property_id: uploadPropertyId || undefined,
        description: uploadDescription || undefined,
      });
    }

    setUploadOpen(false);
    setUploadFiles([]);
    setUploadCategory("OTHER");
    setUploadPropertyId("");
    setUploadDescription("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteDocument.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  const propertyOptions = properties.map((p: any) => ({ value: p.id, label: p.name }));

  return (
    <div
      className="animate-fade-in"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <PageHeader
        title="Documents"
        description={`${documentsData?.total ?? 0} documents stored`}
        onAction={() => setUploadOpen(true)}
        actionLabel="Upload Document"
      />

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-600/20 backdrop-blur-sm border-4 border-dashed border-blue-600 rounded-2xl m-4 pointer-events-none">
          <div className="text-center">
            <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <p className="text-2xl font-bold text-blue-700">Drop files to upload</p>
            <p className="text-blue-600 mt-2">PDF, Word, Excel, Images (max 10MB each)</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search documents..." className="flex-1" />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {DOCUMENT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Properties</option>
          {propertyOptions.map((p: any) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Drop Zone Banner (when no documents) */}
      {!isLoading && documents.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-16 text-center cursor-pointer transition group"
        >
          <div className="w-16 h-16 bg-gray-100 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5 transition">
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No documents yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Drag and drop files here, or click to browse your computer. Supports PDF, Word, Excel, and images.
          </p>
          <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition">
            <Upload className="w-4 h-4" />Browse Files
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Document Grid — grouped by category */}
      {!isLoading && documents.length > 0 && (
        <div className="space-y-6">
          {/* Flat view when filtered */}
          {(search || category || propertyFilter) ? (
            <div>
              <p className="text-sm text-gray-500 mb-3">{documents.length} result{documents.length !== 1 ? "s" : ""} found</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {documents.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} onDelete={() => setDeleteTarget(doc)} />
                ))}
              </div>
            </div>
          ) : (
            // Grouped view
            Object.entries(grouped).map(([catValue, { label, items }]) => (
              <div key={catValue}>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} onDelete={() => setDeleteTarget(doc)} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setUploadFiles([]);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        title="Upload Documents"
        description="Add files to your document library"
        size="md"
      >
        {/* File Drop Zone inside Modal */}
        {uploadFiles.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-10 text-center cursor-pointer transition group mb-4"
          >
            <Upload className="w-10 h-10 text-gray-300 group-hover:text-blue-500 mx-auto mb-3 transition" />
            <p className="text-sm font-medium text-gray-600">Click to browse or drag files here</p>
            <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Images — max 10MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected files list */}
            <div className="space-y-2">
              {uploadFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="p-1 hover:bg-gray-200 rounded-lg transition flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* Category & Property */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DOCUMENT_CATEGORIES.filter((c) => c.value).map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Link to Property (optional)
                </label>
                <select
                  value={uploadPropertyId}
                  onChange={(e) => setUploadPropertyId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No specific property</option>
                  {propertyOptions.map((p: any) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief description of these documents..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setUploadFiles([])}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploadDocument.isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploadDocument.isPending
                  ? `Uploading ${uploadFiles.length} file${uploadFiles.length !== 1 ? "s" : ""}...`
                  : `Upload ${uploadFiles.length} file${uploadFiles.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Document"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteDocument.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Document Card Component ──────────────────────────────
function DocumentCard({
  doc,
  onDelete,
}: {
  doc: Document;
  onDelete: () => void;
}) {
  const catLabel = DOCUMENT_CATEGORIES.find((c) => c.value === doc.category)?.label || doc.category;
  const isImage = doc.file_type?.startsWith("image/");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition group overflow-hidden">
      {/* Preview */}
      <div className="h-28 bg-gray-50 flex items-center justify-center relative overflow-hidden">
        {isImage ? (
          <img
            src={doc.file_url}
            alt={doc.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm">
              {getFileTypeIcon(doc.file_type)}
            </div>
            <span className="text-xs text-gray-400 uppercase font-medium tracking-wide">
              {doc.file_type?.split("/").pop()?.toUpperCase() || "FILE"}
            </span>
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white rounded-xl shadow-md hover:bg-blue-50 transition"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4 text-gray-700" />
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 bg-white rounded-xl shadow-md hover:bg-red-50 transition"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate mb-1" title={doc.name}>
          {doc.name}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>
          <span className="text-xs text-blue-600 font-medium truncate max-w-[60%] text-right">
            {catLabel}
          </span>
        </div>
        {doc.property && (
          <div className="flex items-center gap-1 mt-1.5">
            <Building2 className="w-3 h-3 text-gray-300 flex-shrink-0" />
            <span className="text-xs text-gray-400 truncate">{doc.property.name}</span>
          </div>
        )}
        <p className="text-[11px] text-gray-300 mt-1">{formatDate(doc.created_at)}</p>
      </div>
    </div>
  );
}
