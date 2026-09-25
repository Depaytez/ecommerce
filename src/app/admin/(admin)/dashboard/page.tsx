/**
 * Admin Dashboard Home Page
 * =========================
 *
 * Main dashboard for admin users with:
 * - Sales metrics
 * - Recent orders
 * - Product stats
 * - Quick actions
 *
 * Access: Admin, Chief Admin, Agent
 */

"use client";

import { useState, useEffect } from "react";
import { checkPermission } from "../admin-actions";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useAdmin } from "@/context/AdminContext";

export default function DashboardPage() {
  const adminContext = useAdmin();
  const [hasAccess, setHasAccess] = useState<boolean>(() => {
    return adminContext ? adminContext.canAccess("agent") : true;
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
  });

  useEffect(() => {
    let aborted = false;

    async function loadData() {
      // If adminContext is available, role is pre-verified on server
      let permitted = true;
      if (adminContext) {
        permitted = adminContext.canAccess("agent");
      } else {
        permitted = await checkPermission("agent");
      }

      if (!aborted) setHasAccess(permitted);

      if (permitted && !aborted) {
        await loadDashboardData(aborted);
      } else if (!aborted) {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      aborted = true;
    };
  }, [adminContext]);

  async function checkPermissions() {
    const hasPermission = await checkPermission("agent");
    setHasAccess(hasPermission);
  }

  async function loadDashboardData(aborted: boolean) {
    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch all stats in parallel with proper error handling
      const [
        productsResult,
        activeProductsResult,
        ordersResult,
        pendingOrdersResult,
        revenueResult,
        customersResult,
        lowStockResult,
      ] = await Promise.allSettled([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("total_amount, created_at").eq("payment_status", "completed"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("products").select("*", { count: "exact", head: true }).lte("stock_quantity", 10).eq("is_active", true),
      ]);

      if (aborted) return;

      // Extract counts safely
      const totalProducts = productsResult.status === 'fulfilled' ? productsResult.value.count || 0 : 0;
      const activeProducts = activeProductsResult.status === 'fulfilled' ? activeProductsResult.value.count || 0 : 0;
      const totalOrders = ordersResult.status === 'fulfilled' ? ordersResult.value.count || 0 : 0;
      const pendingOrders = pendingOrdersResult.status === 'fulfilled' ? pendingOrdersResult.value.count || 0 : 0;
      const totalCustomers = customersResult.status === 'fulfilled' ? customersResult.value.count || 0 : 0;
      const lowStockProducts = lowStockResult.status === 'fulfilled' ? lowStockResult.value.count || 0 : 0;

      // Calculate revenue
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      
      if (revenueResult.status === 'fulfilled' && revenueResult.value.data) {
        totalRevenue = revenueResult.value.data.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        
        // Calculate monthly revenue (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        monthlyRevenue = revenueResult.value.data
          .filter(order => new Date(order.created_at) >= thirtyDaysAgo)
          .reduce((sum, order) => sum + (order.total_amount || 0), 0);
      }

      setStats({
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        monthlyRevenue,
        totalCustomers,
        lowStockProducts,
      });
    } catch (error) {
      if (!aborted) {
        console.error("Error loading dashboard data:", error);
      }
    } finally {
      if (!aborted) {
        setLoading(false);
      }
    }
  }

  if (!loading && hasAccess === false) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-red-100 shadow-sm max-w-lg mx-auto mt-12 p-8">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2 text-sm">
          You don&apos;t have administrative permissions to view the main dashboard metrics.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 h-32 flex flex-col justify-between">
              <div className="h-10 w-10 bg-gray-100 rounded-xl" />
              <div>
                <div className="h-6 w-24 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 h-28 flex items-center gap-4">
              <div className="h-14 w-14 bg-gray-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-16 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      subValue: `₦${stats.monthlyRevenue.toLocaleString()} this month`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "up",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      subValue: `${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "neutral",
    },
    {
      title: "Products",
      value: `${stats.activeProducts}/${stats.totalProducts}`,
      subValue: "active products",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "neutral",
    },
    {
      title: "Customers",
      value: stats.totalCustomers.toString(),
      subValue: "registered customers",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: "up",
    },
  ];

  const alertCards = [
    {
      title: "Low Stock Alert",
      value: stats.lowStockProducts.toString(),
      description: "Products with stock ≤ 10",
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      link: "/admin/catalog",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toString(),
      description: "Orders awaiting confirmation",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/admin/orders",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-radiance-charcoalTextColor">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Overview of your store&apos;s performance
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              {stat.trend !== "neutral" && (
                <div
                  className={`flex items-center text-sm font-bold ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                </div>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.subValue}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {alertCards.map((alert) => (
          <Link
            key={alert.title}
            href={alert.link}
            className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow block"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 md:p-4 rounded-xl ${alert.bgColor} ${alert.color}`}>
                <alert.icon size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {alert.value}
                </p>
                <p className="text-sm font-bold text-gray-700 mt-0.5 truncate">
                  {alert.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {alert.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Link
            href="/admin/catalog"
            className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl bg-gray-50 hover:bg-radiance-goldColor/10 transition-colors"
          >
            <Package size={24} className="text-radiance-goldColor" />
            <span className="text-xs font-bold text-gray-700 text-center">Add Product</span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-radiance-goldColor/10 transition-colors"
          >
            <ShoppingCart size={24} className="text-radiance-goldColor" />
            <span className="text-xs font-bold text-gray-700">View Orders</span>
          </Link>
          <Link
            href="/admin/users"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-radiance-goldColor/10 transition-colors"
          >
            <Users size={24} className="text-radiance-goldColor" />
            <span className="text-xs font-bold text-gray-700">
              Manage Users
            </span>
          </Link>
          <Link
            href="/shop"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-radiance-goldColor/10 transition-colors"
          >
            <TrendingUp size={24} className="text-radiance-goldColor" />
            <span className="text-xs font-bold text-gray-700">View Store</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-sm">
            View all orders in the{" "}
            <Link
              href="/admin/orders"
              className="text-radiance-goldColor font-bold hover:underline"
            >
              Orders Manager
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
