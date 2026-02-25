import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function generateInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export function getFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return function (...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: "text-green-600 bg-green-50 border-green-200",
    OCCUPIED: "text-blue-600 bg-blue-50 border-blue-200",
    MAINTENANCE: "text-yellow-600 bg-yellow-50 border-yellow-200",
    RENOVATION: "text-orange-600 bg-orange-50 border-orange-200",
    OFF_MARKET: "text-gray-600 bg-gray-50 border-gray-200",
    OPEN: "text-blue-600 bg-blue-50 border-blue-200",
    ASSIGNED: "text-purple-600 bg-purple-50 border-purple-200",
    IN_PROGRESS: "text-yellow-600 bg-yellow-50 border-yellow-200",
    PENDING_PARTS: "text-orange-600 bg-orange-50 border-orange-200",
    COMPLETED: "text-green-600 bg-green-50 border-green-200",
    CLOSED: "text-gray-600 bg-gray-50 border-gray-200",
    CANCELLED: "text-red-600 bg-red-50 border-red-200",
    DRAFT: "text-gray-600 bg-gray-50 border-gray-200",
    SENT: "text-blue-600 bg-blue-50 border-blue-200",
    PAID: "text-green-600 bg-green-50 border-green-200",
    OVERDUE: "text-red-600 bg-red-50 border-red-200",
    PARTIAL: "text-yellow-600 bg-yellow-50 border-yellow-200",
    ACTIVE: "text-green-600 bg-green-50 border-green-200",
    INACTIVE: "text-gray-600 bg-gray-50 border-gray-200",
    EVICTION: "text-red-600 bg-red-50 border-red-200",
    PENDING: "text-yellow-600 bg-yellow-50 border-yellow-200",
  };
  return colors[status] || "text-gray-600 bg-gray-50 border-gray-200";
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    CRITICAL: "text-red-700 bg-red-100 border-red-300",
    HIGH: "text-orange-700 bg-orange-100 border-orange-300",
    MEDIUM: "text-yellow-700 bg-yellow-100 border-yellow-300",
    LOW: "text-green-700 bg-green-100 border-green-300",
  };
  return colors[priority] || "text-gray-700 bg-gray-100 border-gray-300";
}
