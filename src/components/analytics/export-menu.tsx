"use client";

import { useState } from "react";
import { Download, ChevronDown, FileText, Wrench, Building2 } from "lucide-react";
import { useExportCSV } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";

export function ExportMenu() {
  const [open, setOpen] = useState(false);
  const { exportInvoices, exportWorkOrders, exportProperties } = useExportCSV();

  const options = [
    {
      label: "Export Invoices (.csv)",
      icon: FileText,
      action: () => { exportInvoices(); setOpen(false); },
    },
    {
      label: "Export Work Orders (.csv)",
      icon: Wrench,
      action: () => { exportWorkOrders(); setOpen(false); },
    },
    {
      label: "Export Properties (.csv)",
      icon: Building2,
      action: () => { exportProperties(); setOpen(false); },
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition"
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={opt.action}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
              >
                <opt.icon className="w-4 h-4 text-gray-400" />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
