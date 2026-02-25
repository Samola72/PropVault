import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function PageHeader({ title, description, backHref, actionLabel, actionHref, onAction }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        {backHref && (
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" />Back
          </Link>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
      </div>
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Link href={actionHref} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition">
            <Plus className="w-4 h-4" />{actionLabel}
          </Link>
        ) : (
          <button onClick={onAction} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition">
            <Plus className="w-4 h-4" />{actionLabel}
          </button>
        )
      )}
    </div>
  );
}
