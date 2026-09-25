"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserRoundPen, Shield, LayoutDashboard } from "lucide-react";
import ProfileSettingsOverlay from "./ProfileSettingsOverlay";
import CurrencyToggle from "./CurrencyToggle";
import { usePathname } from "next/navigation";
import { useUser, useIsAdmin } from "@/context/UserContext";

export default function TopBar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const user = useUser();
  const isAdmin = useIsAdmin();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFDF5]/85 backdrop-blur-md border-b border-amber-100/50 shadow-xs">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo container */}
        <Link
          href="/"
          className="relative h-8 w-28 md:h-10 md:w-36 max-w-[40vw] flex items-center group transition-transform hover:scale-105"
        >
          <Image
            src="/logo-removebg.png"
            alt="JRADIANCE logo"
            priority
            className="object-contain object-left"
            loading="eager"
            width="140"
            height="40"
          />
          <div className="absolute -bottom-1 left-5 w-0 h-0.5 bg-radiance-goldColor transition-all duration-300 group-hover:w-2/3" />
        </Link>

        {/* Navigation and profile */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Currency Toggle */}
          <CurrencyToggle />

          {/* Admin dashboard link for non-admin routes */}
          {user && isAdmin && !isAdminRoute && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs font-semibold text-radiance-goldColor hover:text-radiance-charcoalTextColor transition-colors px-2.5 py-1.5 border border-radiance-goldColor rounded-lg bg-radiance-goldColor/5"
            >
              <LayoutDashboard size={14} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Admin info on admin routes */}
          {user && isAdmin && isAdminRoute && (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-radiance-charcoalTextColor truncate max-w-37.5">
                  {user.email}
                </p>
                <p className="text-[9px] text-gray-500 capitalize">
                  {user.role}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-radiance-goldColor flex items-center justify-center text-white">
                <Shield size={16} />
              </div>
            </div>
          )}

          {/* Profile button - shown on all routes */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex flex-col items-center gap-0.5 group"
            >
              {user ? (
                <div className="h-8 w-8 rounded-full bg-radiance-goldColor flex items-center justify-center text-white font-bold text-xs">
                  {user.email ? user.email[0].toUpperCase() : "U"}
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-radiance-goldColor/10 flex items-center justify-center text-radiance-goldColor group-hover:bg-radiance-goldColor group-hover:text-white transition-all">
                  <UserRoundPen size={16} />
                </div>
              )}
              <span className="text-[9px] font-bold text-radiance-charcoalTextColor group-hover:text-radiance-goldColor transition-colors hidden sm:block">
                {user ? user.email?.split("@")[0] || "Account" : "Account"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile & Settings Overlay */}
      <ProfileSettingsOverlay
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
      />
    </header>
  );
}
