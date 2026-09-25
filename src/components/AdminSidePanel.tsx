"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  Users,
  UserPlus,
  ClipboardList,
  History,
  PackageSearch,
  AlertTriangle,
  ShoppingBag,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  UserCircle,
  Menu,
  Store,
} from "lucide-react";
import { adminLogout, getAdminUserInfo } from "@/app/admin/(admin-auth)/login/actions";
import NotificationBadge from "./admin/NotificationBadge";

// Navigation Structure
const adminNavItems = [
  {
    title: "Control Panel",
    icon: Settings2,
    subItems: [
      { label: "Permission Roles", href: "/admin/roles", icon: ShieldCheck },
      { label: "Users Manager", href: "/admin/users", icon: Users },
      { label: "Agents Manager", href: "/admin/agents", icon: UserPlus },
    ],
  },
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    subItems: [
      { label: "Dashboard Home", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Sales Log", href: "/admin/sales-log", icon: ClipboardList },
      { label: "Audit Log", href: "/admin/audit-log", icon: History },
      { label: "Products Catalog", href: "/admin/catalog", icon: PackageSearch },
      { label: "Issues Log", href: "/admin/issues", icon: AlertTriangle },
    ],
  },
  { 
    title: "Orders Manager", 
    href: "/admin/orders", 
    icon: ShoppingBag,
    showBadge: true  // Show notification badge
  },
];

interface AdminSidePanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidePanel({ isCollapsed, onToggle }: AdminSidePanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedNav, setExpandedNav] = useState<string | null>("Dashboard");
  const [userInfo, setUserInfo] = useState<{
    email: string;
    role: string;
    full_name?: string | null;
  } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  async function loadUserInfo() {
    const result = await getAdminUserInfo();
    if (result?.user) {
      setUserInfo(result.user);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    const result = await adminLogout();
    if (result.success) {
      router.push("/admin/login");
    } else {
      setIsLoggingOut(false);
      alert(result.error || "Logout failed");
    }
  }

  const formatRole = (role: string) => role.replace("_", " ").toUpperCase();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-radiance-charcoalTextColor text-white z-50 border-r border-white/5 flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/10 rounded-lg flex-shrink-0 transition-colors text-white/70 hover:text-white"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
        
        <div className={`overflow-hidden transition-all duration-300 ${
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}>
          <h1 className="text-base font-black tracking-tight text-radiance-goldColor whitespace-nowrap">
            JRADIANCE
            <span className="text-[10px] font-medium text-white/60 block tracking-normal">
              ADMIN PORTAL
            </span>
          </h1>
        </div>
      </div>

      {/* User Info */}
      {userInfo && (
        <div className={`px-5 py-3 border-b border-white/5 bg-white/[0.02] flex-shrink-0 transition-all duration-300 ${
          isCollapsed ? "hidden" : "block"
        }`}>
          <div className="flex items-center gap-3">
            <UserCircle size={28} className="text-white/40 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {userInfo.full_name || "Admin User"}
              </p>
              <p className="text-[10px] text-radiance-goldColor/80 truncate">
                {formatRole(userInfo.role)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 flex-shrink-0">
        {/* Hide scrollbar */}
        <style>{`
          nav::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
          nav {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        
        {adminNavItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedNav === item.title;
          const isActive =
            pathname === item.href ||
            item.subItems?.some((sub) => pathname === sub.href);

          return (
            <div key={item.title} className="space-y-1">
              {hasSubItems ? (
                <button
                  onClick={() => setExpandedNav(isExpanded ? null : item.title)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-radiance-goldColor/15 text-radiance-goldColor"
                      : "text-white/60 hover:bg-white/5 hover:text-white/90"
                  } ${isCollapsed ? "justify-center" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="flex-shrink-0" />
                    <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                      isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                    }`}>
                      {item.title}
                    </span>
                  </div>
                  <div className={`transition-all duration-300 ${
                    isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                  }`}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>
              ) : (
                <Link
                  href={item.href || "#"}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    pathname === item.href
                      ? "bg-radiance-goldColor text-white shadow-lg shadow-radiance-goldColor/25"
                      : "text-white/60 hover:bg-white/5 hover:text-white/90"
                  } ${isCollapsed ? "justify-center" : ""}`}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 flex-1 ${
                    isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                  }`}>
                    {item.title}
                  </span>
                  {/* Notification Badge for Orders */}
                  {!isCollapsed && (item as any).showBadge && <NotificationBadge />}
                </Link>
              )}

              {/* Sub-Navigation */}
              {hasSubItems && isExpanded && !isCollapsed && (
                <div className="ml-4 pl-4 border-l border-white/10 space-y-1 mt-1">
                  {item.subItems.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        pathname === sub.href
                          ? "text-radiance-goldColor bg-radiance-goldColor/10"
                          : "text-white/40 hover:text-white/80 hover:bg-white/5"
                      }`}
                    >
                      <sub.icon size={14} className="flex-shrink-0" />
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer - Store link and Logout */}
      <div className={`px-3 py-4 border-t border-white/5 flex-shrink-0 transition-all duration-300 ${
        isCollapsed ? "px-2" : ""
      }`}>
        <Link
          href="/"
          className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1.5 rounded-lg text-amber-200/80 hover:bg-white/5 hover:text-amber-300 transition-colors ${
            isCollapsed ? "justify-center" : ""
          }`}
          title="Return to Store"
        >
          <Store size={18} className="flex-shrink-0" />
          <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
            isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
          }`}>
            View Store
          </span>
        </Link>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          {isLoggingOut ? (
            <Loader2 size={18} className="animate-spin flex-shrink-0" />
          ) : (
            <LogOut size={18} className="flex-shrink-0" />
          )}
          <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
            isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
          }`}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>
    </aside>
  );
}
