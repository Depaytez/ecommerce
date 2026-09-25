/**
 * Permission Roles Management Page
 * 
 * Allows chief admin to set permission roles for different admin levels.
 * Access: Chief Admin only
 */

"use client";

import { useState, useEffect } from "react";
import { checkPermission, getAdminPermissions } from "../admin-actions";
import { Shield, Lock, Check, X, AlertTriangle } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

interface PermissionMatrix {
  role: string;
  canManageUsers: boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canViewAuditLogs: boolean;
  canViewSalesLogs: boolean;
  canManageAgents: boolean;
}

export default function PermissionRolesPage() {
  const adminContext = useAdmin();
  const [isChiefAdmin, setIsChiefAdmin] = useState<boolean>(() => {
    return adminContext ? adminContext.isChiefAdmin : false;
  });
  const [loading, setLoading] = useState(!adminContext);

  useEffect(() => {
    if (adminContext) {
      setIsChiefAdmin(adminContext.isChiefAdmin);
      setLoading(false);
      return;
    }

    async function check() {
      const hasPermission = await checkPermission("chief_admin");
      setIsChiefAdmin(hasPermission);
      setLoading(false);
    }
    check();
  }, [adminContext]);

  const permissionMatrix: PermissionMatrix[] = [
    {
      role: "Chief Admin",
      canManageUsers: true,
      canManageProducts: true,
      canManageOrders: true,
      canViewAuditLogs: true,
      canViewSalesLogs: true,
      canManageAgents: true,
    },
    {
      role: "Admin",
      canManageUsers: false,
      canManageProducts: true,
      canManageOrders: true,
      canViewAuditLogs: true,
      canViewSalesLogs: true,
      canManageAgents: false,
    },
    {
      role: "Agent",
      canManageUsers: false,
      canManageProducts: true,
      canManageOrders: true,
      canViewAuditLogs: false,
      canViewSalesLogs: false,
      canManageAgents: false,
    },
    {
      role: "Customer",
      canManageUsers: false,
      canManageProducts: false,
      canManageOrders: false,
      canViewAuditLogs: false,
      canViewSalesLogs: false,
      canManageAgents: false,
    },
  ];

  if (!loading && !isChiefAdmin) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-red-100 shadow-sm max-w-lg mx-auto mt-12 p-8">
        <Shield size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2 text-sm">Only Chief Administrators can access permission settings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-radiance-charcoalTextColor">Permission Roles</h1>
          <p className="text-gray-600 mt-1">View and manage role-based permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="text-radiance-goldColor" size={24} />
          <span className="text-sm font-semibold text-radiance-goldColor">Chief Admin Access</span>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Manage Users</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Manage Products</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Manage Orders</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">View Audit Logs</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">View Sales</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Manage Agents</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissionMatrix.map((permission) => (
                <tr key={permission.role} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Shield size={20} className="text-radiance-goldColor" />
                      <span className="ml-3 text-sm font-medium text-gray-900">{permission.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {permission.canManageUsers ? (
                      <Check size={20} className="mx-auto text-green-500" />
                    ) : (
                      <X size={20} className="mx-auto text-gray-300" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {permission.canManageProducts ? (
                      <Check size={20} className="mx-auto text-green-500" />
                    ) : (
                      <X size={20} className="mx-auto text-gray-300" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {permission.canManageOrders ? (
                      <Check size={20} className="mx-auto text-green-500" />
                    ) : (
                      <X size={20} className="mx-auto text-gray-300" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {permission.canViewAuditLogs ? (
                      <Check size={20} className="mx-auto text-green-500" />
                    ) : (
                      <X size={20} className="mx-auto text-gray-300" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {permission.canViewSalesLogs ? (
                      <Check size={20} className="mx-auto text-green-500" />
                    ) : (
                      <X size={20} className="mx-auto text-gray-300" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {permission.canManageAgents ? (
                      <Check size={20} className="mx-auto text-green-500" />
                    ) : (
                      <X size={20} className="mx-auto text-gray-300" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
          <h3 className="font-bold text-purple-900 mb-2">Chief Admin</h3>
          <p className="text-sm text-purple-700">Full access to all features. Can promote/demote users, manage all settings, and view all logs.</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-2">Admin</h3>
          <p className="text-sm text-blue-700">Can manage products, orders, and view reports. Cannot manage user roles or other admins.</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <h3 className="font-bold text-green-900 mb-2">Agent</h3>
          <p className="text-sm text-green-700">Limited access to manage products and orders. Cannot view sensitive data or manage users.</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2">Customer</h3>
          <p className="text-sm text-gray-700">Regular user access. Can shop, view order history, and manage personal profile.</p>
        </div>
      </div>
    </div>
  );
}
