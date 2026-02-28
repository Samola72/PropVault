"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Wrench, Users, UserCog,
  FileText, MessageSquare, FolderOpen, BarChart3,
  Settings, ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useCurrentUser, useCurrentOrg } from "@/hooks/use-organization";
import { useMessages } from "@/hooks/use-messages";
import { signOut } from "@/lib/auth/actions";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/properties", icon: Building2, label: "Properties" },
  { href: "/work-orders", icon: Wrench, label: "Work Orders" },
  { href: "/tenants", icon: Users, label: "Tenants" },
  { href: "/providers", icon: UserCog, label: "Service Providers" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/documents", icon: FolderOpen, label: "Documents" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const org = useCurrentOrg();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { data: messagesData } = useMessages("inbox");
  const unreadMessages = (messagesData?.data || []).filter((m: any) => !m.is_read).length;

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col z-40 transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-gray-900 text-sm truncate">{org?.name || "PropVault"}</p>
              <p className="text-xs text-gray-500 capitalize">{org?.plan?.toLowerCase()} plan</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <Building2 className="w-4 h-4 text-white" />
          </div>
        )}
        <button onClick={toggleSidebarCollapsed} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          const badgeCount = label === "Messages" ? unreadMessages : 0;
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className={cn("flex-shrink-0 w-4 h-4", sidebarCollapsed && "w-5 h-5", isActive && "text-blue-600")} />
              {!sidebarCollapsed && <span className="truncate flex-1">{label}</span>}
              {!sidebarCollapsed && badgeCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
              {sidebarCollapsed && badgeCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
              {isActive && !sidebarCollapsed && badgeCount === 0 && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-3 space-y-1">
        <Link href="/settings" className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition",
          sidebarCollapsed && "justify-center"
        )}>
          <Settings className="w-4 h-4 text-gray-500 flex-shrink-0" />
          {!sidebarCollapsed && "Settings"}
        </Link>
        {user && (
          <div className={cn("flex items-center gap-3 px-3 py-2 rounded-xl", sidebarCollapsed && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
              {generateInitials(user.full_name)}
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase().replace("_", " ")}</p>
                </div>
                <button onClick={() => signOut()} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
