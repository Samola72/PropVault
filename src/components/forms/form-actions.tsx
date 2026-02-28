import Link from "next/link";
import { Loader2 } from "lucide-react";

interface FormActionsProps {
  cancelHref: string;
  submitLabel?: string;
  isLoading?: boolean;
}

export function FormActions({ cancelHref, submitLabel = "Save", isLoading }: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <Link
        href={cancelHref}
        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
      >
        Cancel
      </Link>
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
