/**
 * Sales Log Dashboard Page
 * 
 * View sales statistics and order reports.
 * Access: Admin, Chief Admin
 */

"use client";

import { useState, useEffect } from "react";
import { getSalesStats, checkPermission } from "../admin-actions";
import { DollarSign, ShoppingCart, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

export default function SalesLogPage() {
  const adminContext = useAdmin();
  const [hasAccess, setHasAccess] = useState<boolean>(() => {
    return adminContext ? adminContext.isAdmin : true;
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    orders: any[];
  } | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month" | "all">("all");

  useEffect(() => {
    if (adminContext) {
      setHasAccess(adminContext.isAdmin);
    } else {
      checkPermissions();
    }
    loadStats();
  }, [period, adminContext]);

  async function checkPermissions() {
    const hasPermission = await checkPermission("admin");
    setHasAccess(hasPermission);
  }

  async function loadStats() {
    setLoading(true);
    const result = await getSalesStats(period);
    if (result.success && result.data) {
      setStats(result.data);
    }
    setLoading(false);
  }

  if (!loading && hasAccess === false) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-red-100 shadow-sm max-w-lg mx-auto mt-12 p-8">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2 text-sm">You don&apos;t have administrative permissions to view sales logs.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2" />
            <div className="h-4 w-72 bg-gray-100 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-gray-100 p-6" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-radiance-charcoalTextColor">Sales Log</h1>
          <p className="text-gray-600 mt-1">Track sales performance and revenue</p>
        </div>
        <div className="flex gap-2">
          {(["day", "week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                period === p
                  ? "bg-radiance-goldColor text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-radiance-goldColor mx-auto"></div>
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-radiance-goldColor">
                    ₦{stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign size={40} className="text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <ShoppingCart size={40} className="text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
                </div>
                <CheckCircle size={40} className="text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp size={40} className="text-purple-500" />
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.orders?.slice(0, 10).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.order_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">₦{order.total_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === "delivered" ? "bg-green-100 text-green-800" :
                          order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">Failed to load sales statistics</p>
        </div>
      )}
    </div>
  );
}
