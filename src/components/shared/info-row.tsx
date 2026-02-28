import { cn } from "@/lib/utils";

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function InfoRow({ label, value, className }: InfoRowProps) {
  return (
    <div className={cn("flex items-start justify-between py-3 border-b border-gray-50 last:border-0", className)}>
      <span className="text-sm text-gray-500 flex-shrink-0 w-40">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right flex-1">{value || "—"}</span>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function InfoCard({ title, children, className, action }: InfoCardProps) {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
