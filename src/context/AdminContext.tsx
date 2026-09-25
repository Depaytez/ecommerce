"use client";

import React, { createContext, useContext } from "react";
import type { UserRole } from "@/types";

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string | null;
  role: UserRole;
}

interface AdminContextType {
  admin: AdminUser;
  isChiefAdmin: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  canAccess: (minRole: UserRole) => boolean;
}

const AdminContext = createContext<AdminContextType | null>(null);

const ROLE_HIERARCHY: Record<UserRole, number> = {
  customer: 0,
  agent: 1,
  admin: 2,
  chief_admin: 3,
};

export function AdminProvider({
  admin,
  children,
}: {
  admin: AdminUser;
  children: React.ReactNode;
}) {
  const currentLevel = ROLE_HIERARCHY[admin.role] || 0;

  const value: AdminContextType = {
    admin,
    isChiefAdmin: admin.role === "chief_admin",
    isAdmin: admin.role === "admin" || admin.role === "chief_admin",
    isAgent: currentLevel >= 1,
    canAccess: (minRole: UserRole) => currentLevel >= (ROLE_HIERARCHY[minRole] || 0),
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  return context;
}
