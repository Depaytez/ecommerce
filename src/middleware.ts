/**
 * =============================================================================
 * Next.js Middleware for Authentication & Authorization
 * =============================================================================
 * 
 * Simplified middleware using centralized AuthGuard.
 * Protects admin and customer routes with role-based access control.
 * 
 * Route Protection:
 * - /admin/login: Public (no auth required)
 * - /admin/*: Protected (admin, agent, chief_admin roles only)
 * - /shop/history, /shop/wishlist, /shop/checkout: Protected (authenticated users)

 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // ============================================================================
  // Admin Login Route - Always Public
  // ============================================================================
  if (url.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("your-project.supabase.co") ||
    supabaseAnonKey.includes("your_supabase_anon_key")
  ) {
    return NextResponse.next();
  }

  // Initialize Supabase Client
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            req.cookies.set(name, value);
          }
        },
      },
    }
  );


  // Admin Routes Protection
  if (url.pathname.startsWith("/admin")) {
    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      // Get user profile with retry mechanism
      let profile = null;
      for (let i = 0; i < 3; i++) {
        const { data, error } = await supabase
          .from("profiles")
          .select("role, is_active")
          .eq("id", user.id)
          .single();
        
        if (data) {
          profile = data;
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
        }
      }

      if (!profile) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      // Verify admin role
      const allowedRoles = ["admin", "agent", "chief_admin"];
      if (!allowedRoles.includes(profile.role)) {
        return NextResponse.redirect(new URL("/", req.url));
      }

      // Verify active status
      if (!profile.is_active) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      // Role-Based Access Control (RBAC)

      // Chief Admin Only Routes
      const chiefAdminOnlyRoutes = ["/admin/users", "/admin/roles", "/admin/agents"];
      if (chiefAdminOnlyRoutes.some((route) => url.pathname.startsWith(route))) {
        if (profile.role !== "chief_admin") {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
      }

      // Agent Restricted Routes
      const agentRestrictedRoutes = ["/admin/audit-log", "/admin/sales-log"];
      if (agentRestrictedRoutes.some((route) => url.pathname.startsWith(route))) {
        if (profile.role === "agent") {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
      }

      // Log admin access for audit trail (non-blocking, fire-and-forget)
      supabase.from("admin_activity_logs").insert({
        admin_id: user.id,
        action: "page_access",
        resource_type: "admin_page",
        resource_id: null,
        changes: { path: url.pathname },
      });

    } catch (error) {
      console.error("[Middleware] Admin auth error:", error);
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Customer Routes Protection
  const protectedCustomerRoutes = [
    "/shop/history",
    "/shop/wishlist",
    "/shop/checkout",
  ];

  if (protectedCustomerRoutes.some((path) => url.pathname.startsWith(path))) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const redirectUrl = new URL("/shop/auth", req.url);
        redirectUrl.searchParams.set("redirect", url.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Verify active status
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", user.id)
        .single();

      if (!profile?.is_active) {
        await supabase.auth.signOut();
        const redirectUrl = new URL("/shop/auth", req.url);
        redirectUrl.searchParams.set("redirect", url.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error("[Middleware] Customer auth error:", error);
      // Allow request to proceed on auth service failure - let page handle it
      return NextResponse.next();
    }
  }

  return NextResponse.next({
    request: {
      headers: req.headers,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all admin paths
     */
    "/admin/:path*",
    "/admin",
    /*
     * Match protected customer routes
     */
    "/shop/history",
    "/shop/wishlist",
    "/shop/checkout",
  ],
};
