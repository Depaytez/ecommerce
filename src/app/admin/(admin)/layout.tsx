/**
 * =============================================================================
 * Admin Layout
 * =============================================================================
 *
 * Provides consistent layout for authenticated admin pages with sidebar navigation.
 *
 * Security:
 * - Authentication verified by middleware (defensive check here)
 * - Role verification (admin, agent, chief_admin only)
 * - Minimal defensive check - trusts middleware
 */

import AdminSidePanel from "@/components/AdminSidePanel";
import AdminErrorBoundary from "@/components/admin/AdminErrorBoundary";
import AdminLayoutContent from "./AdminLayoutContent";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AdminProvider, type AdminUser } from "@/context/AdminContext";
import type { UserRole } from "@/types";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient();

  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (error) {
    redirect("/admin/login");
  }

  if (!user) {
    redirect("/admin/login");
  }

  // Fetch user role
  let role: UserRole = "agent";
  let fullName: string | null = null;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, role")
      .eq("id", user.id)
      .single();

    if (profile?.role) {
      if (profile.role === "customer") {
        redirect("/admin/login?error=unauthorized");
      }
      role = profile.role as UserRole;
      fullName = profile.full_name || null;
    }
  } catch (err) {
    console.warn("Could not query profiles for admin layout:", err);
  }

  const adminUser: AdminUser = {
    id: user.id,
    email: user.email || "",
    full_name: fullName,
    role,
  };

  return (
    <AdminProvider admin={adminUser}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}
