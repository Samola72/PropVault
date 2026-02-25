"use client";

import { useCurrentUser } from "./use-organization";
import { PERMISSIONS } from "@/lib/constants";
import type { UserRole } from "@/types/database";

type PermissionKey = keyof typeof PERMISSIONS;

export function usePermissions() {
  const user = useCurrentUser();
  const role = user?.role as UserRole | undefined;

  function can(permission: PermissionKey): boolean {
    if (!role) return false;
    if (role === "SUPER_ADMIN") return true;
    return (PERMISSIONS[permission] as readonly string[]).includes(role);
  }

  function hasRole(requiredRole: UserRole | UserRole[]): boolean {
    if (!role) return false;
    if (role === "SUPER_ADMIN") return true;
    if (Array.isArray(requiredRole)) {
      return (requiredRole as string[]).includes(role);
    }
    return role === requiredRole;
  }

  function isAdmin(): boolean {
    return hasRole(["SUPER_ADMIN", "ORG_ADMIN"] as UserRole[]);
  }

  function isManager(): boolean {
    return hasRole(["SUPER_ADMIN", "ORG_ADMIN", "PROPERTY_MANAGER"] as UserRole[]);
  }

  return {
    can,
    hasRole,
    isAdmin,
    isManager,
    role,
  };
}
