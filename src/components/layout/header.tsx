"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, X, Menu } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { useNotificationStore } from "@/store/notification-store";
import { useNotifications } from "@/hooks/use-notifications";
import { formatRelativeTime, cn } from "@/lib/utils";

const titles: Record<string, string> = {
  dashboard: "Dashboard", properties: "Properties", "work-orders": "Work Orders",
  tenants: "Tenants", providers: "Service Providers", invoices: "Invoices",
  messages: "Messages", documents: "Documents", analytics: "Analytics", settings: "Settings",
};

export function Header() {
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();
  const { unreadCount, notifications } = useNotificationStore();
  const [notifOpen, setNotifOpen] = useState(false);

  useNotifications();

  const segments = pathname.split("/").filter(Boolean);
  const pageTitle = titles[segments[0]] || "Dashboard";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-gray-800">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                  ) : notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className={cn("px-4 py-3 hover:bg-gray-50 cursor-pointer", !n.is_read && "bg-blue-50/50")}>
                      <div className="flex items-start gap-2">
                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />}
                        <div className={n.is_read ? "ml-4" : ""}>
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
