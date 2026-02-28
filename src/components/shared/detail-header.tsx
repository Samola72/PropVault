import Link from "next/link";
import { ArrowLeft, Edit, Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Action {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  icon?: React.ReactNode;
}

interface DetailHeaderProps {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel?: string;
  badge?: React.ReactNode;
  actions?: Action[];
  meta?: { label: string; value: string }[];
}

export function DetailHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  badge,
  actions = [],
  meta = [],
}: DetailHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="mb-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
          {meta.length > 0 && (
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {meta.map((m) => (
                <span key={m.label} className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{m.label}:</span>{" "}
                  {m.value}
                </span>
              ))}
            </div>
          )}
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions.slice(0, 2).map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition",
                  action.variant === "danger"
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                )}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
            {actions.length > 2 && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 rounded-xl hover:bg-gray-100 border border-gray-200"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                      {actions.slice(2).map((action) => (
                        <button
                          key={action.label}
                          onClick={() => { action.onClick(); setMenuOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-gray-50",
                            action.variant === "danger" ? "text-red-600" : "text-gray-700"
                          )}
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
