/**
 * Agents Manager Page
 * 
 * Allows chief admin to manage agents specifically.
 * Access: Chief Admin only
 */

"use client";

import { useState, useEffect } from "react";
import { getAllAgents, promoteUser, demoteUser, checkPermission } from "../admin-actions";
import { User, Shield, ArrowUpCircle, ArrowDownCircle, AlertTriangle } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

type UserRole = "customer" | "admin" | "agent" | "chief_admin";

interface AgentProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export default function AgentsManagerPage() {
  const adminContext = useAdmin();
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChiefAdmin, setIsChiefAdmin] = useState<boolean>(() => {
    return adminContext ? adminContext.isChiefAdmin : false;
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadAgents();
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

  async function loadAgents() {
    setLoading(true);
    const result = await getAllAgents();
    if (result.success && result.data) {
      setAgents(result.data);
    }
    setLoading(false);
  }

  async function handlePromote(agentId: string) {
    setActionLoading(agentId);
    const result = await promoteUser(agentId, "admin");
    setMessage({ type: result.success ? "success" : "error", text: result.message || result.error || "" });
    if (result.success) loadAgents();
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDemote(agentId: string) {
    setActionLoading(agentId);
    const result = await demoteUser(agentId);
    setMessage({ type: result.success ? "success" : "error", text: result.message || result.error || "" });
    if (result.success) loadAgents();
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  if (!loading && !isChiefAdmin) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-red-100 shadow-sm max-w-lg mx-auto mt-12 p-8">
        <Shield size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2 text-sm">Only Chief Administrators have permission to manage agents.</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-radiance-charcoalTextColor">Agents Manager</h1>
          <p className="text-gray-600 mt-1">Manage support agents and their permissions</p>
        </div>
        <Shield className="text-radiance-goldColor" size={24} />
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-radiance-goldColor mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{agent.full_name || "No name"}</h3>
                  <p className="text-sm text-gray-500">{agent.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Joined: {new Date(agent.created_at).toLocaleDateString()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${agent.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {agent.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handlePromote(agent.id)}
                  disabled={actionLoading === agent.id}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <ArrowUpCircle size={16} className="inline mr-1" />
                  Promote
                </button>
                <button
                  onClick={() => handleDemote(agent.id)}
                  disabled={actionLoading === agent.id}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  <ArrowDownCircle size={16} className="inline mr-1" />
                  Demote
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {agents.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No agents found</p>
        </div>
      )}
    </div>
  );
}
