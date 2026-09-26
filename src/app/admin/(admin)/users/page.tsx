/**
 * Users Manager Page
 * 
 * Allows chief admin to:
 * - View all users
 * - Promote/demote users
 * - Delete users
 * - Toggle user status
 * 
 * Access: Chief Admin only
 */

"use client";

import { useState, useEffect } from "react";
import {
  getAllUsers,
  promoteUser,
  demoteUser,
  deleteUser,
  toggleUserStatus,
  checkPermission,
} from "../admin-actions";
import { User, Shield, Trash2, ToggleLeft, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";

type UserRole = "customer" | "admin" | "agent" | "chief_admin";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export default function UsersManagerPage() {
  const adminContext = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChiefAdmin, setIsChiefAdmin] = useState<boolean>(() => {
    return adminContext ? adminContext.isChiefAdmin : false;
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
    if (adminContext) {
      setIsChiefAdmin(adminContext.isChiefAdmin);
    } else {
      checkPermissions();
    }
  }, [adminContext]);

  async function checkPermissions() {
    const hasPermission = await checkPermission("chief_admin");
    setIsChiefAdmin(hasPermission);
  }

  async function loadUsers() {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success && result.data) {
      setUsers(result.data);
    }
    setLoading(false);
  }

  async function handlePromote(userId: string, newRole: UserRole) {
    if (!isChiefAdmin) return;
    setActionLoading(userId);
    const result = await promoteUser(userId, newRole);
    setMessage({ type: result.success ? "success" : "error", text: result.message || result.error || "" });
    if (result.success) loadUsers();
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDemote(userId: string) {
    if (!isChiefAdmin) return;
    setActionLoading(userId);
    const result = await demoteUser(userId);
    setMessage({ type: result.success ? "success" : "error", text: result.message || result.error || "" });
    if (result.success) loadUsers();
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDelete(userId: string) {
    if (!isChiefAdmin) return;
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    setActionLoading(userId);
    const result = await deleteUser(userId);
    setMessage({ type: result.success ? "success" : "error", text: result.message || result.error || "" });
    if (result.success) loadUsers();
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleToggleStatus(userId: string) {
    if (!isChiefAdmin) return;
    setActionLoading(userId);
    const result = await toggleUserStatus(userId);
    setMessage({ type: result.success ? "success" : "error", text: result.message || result.error || "" });
    if (result.success) loadUsers();
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "chief_admin": return "bg-purple-100 text-purple-800";
      case "admin": return "bg-blue-100 text-blue-800";
      case "agent": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!loading && !isChiefAdmin) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-red-100 shadow-sm max-w-lg mx-auto mt-12 p-8">
        <Shield size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2 text-sm">Only Chief Administrators have permission to access user management.</p>
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-xl" />
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
          <h1 className="text-3xl font-bold text-radiance-charcoalTextColor">Users Manager</h1>
          <p className="text-gray-600 mt-1">Manage all users (Customer, Agent, Admin, Chief Admin), roles, and permissions</p>
          <p className="text-gray-600 mt-1">Visit <Link href="/admin/roles" className="text-red-600 mt-1">Permission Roles Page</Link> to see the roles and permission of each user</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="text-radiance-goldColor" size={24} />
          <span className="text-sm font-semibold text-radiance-goldColor">Chief Admin Access</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-radiance-goldColor mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10 bg-radiance-goldColor/10 rounded-full flex items-center justify-center">
                          <User size={20} className="text-radiance-goldColor" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || "No name"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Promote */}
                        {user.role === "customer" && (
                          <button
                            onClick={() => handlePromote(user.id, "agent")}
                            disabled={actionLoading === user.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Promote to Agent"
                          >
                            <ArrowUpCircle size={18} />
                          </button>
                        )}
                        {user.role === "agent" && (
                          <button
                            onClick={() => handlePromote(user.id, "admin")}
                            disabled={actionLoading === user.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Promote to Admin"
                          >
                            <ArrowUpCircle size={18} />
                          </button>
                        )}
                        
                        {/* Demote */}
                        {user.role !== "customer" && user.role !== "chief_admin" && (
                          <button
                            onClick={() => handleDemote(user.id)}
                            disabled={actionLoading === user.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Demote to Customer"
                          >
                            <ArrowDownCircle size={18} />
                          </button>
                        )}
                        
                        {/* Toggle Status */}
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          disabled={actionLoading === user.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title={user.is_active ? "Deactivate" : "Activate"}
                        >
                          <ToggleLeft size={18} />
                        </button>
                        
                        {/* Delete */}
                        {user.role !== "chief_admin" && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={actionLoading === user.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete User"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
