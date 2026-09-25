/**
 * Issues Log Page
 *
 * Track system bugs and customer complaints with status tracking.
 * Access: Admin, Chief Admin
 */

"use client";

import { useState, useEffect } from "react";
import {
  getAllIssues,
  updateIssueStatus,
  updateIssuePriority,
  deleteIssue,
  clearResolvedIssues,
  checkPermission
} from "../issue-actions";
import { AlertTriangle, Bug, MessageSquare, CheckCircle, Clock, AlertCircle, Plus, Trash2, RotateCcw, Shield } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

interface Issue {
  id: string;
  type: "bug" | "complaint" | "feature_request";
  title: string;
  description: string;
  status: "reported" | "pending" | "solved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  reported_by: string | null;
  assigned_to: string | null;
  resolved_at?: string | null;
  created_at: string;
  profiles?: { email: string; full_name: string | null } | null;
  admin_staff?: { position: string | null } | null;
}

export default function IssuesLogPage() {
  const adminContext = useAdmin();
  const [hasAccess, setHasAccess] = useState<boolean>(() => {
    return adminContext ? adminContext.isAdmin : true;
  });
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "bug" | "complaint" | "feature_request">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "reported" | "pending" | "solved" | "closed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high" | "critical">("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [clearingResolved, setClearingResolved] = useState(false);

  useEffect(() => {
    if (adminContext) {
      setHasAccess(adminContext.isAdmin);
    } else {
      checkPermissions();
    }
    loadIssues();
  }, [adminContext]);

  async function checkPermissions() {
    const hasPermission = await checkPermission("admin");
    setHasAccess(hasPermission);
  }

  async function loadIssues() {
    setLoading(true);
    const result = await getAllIssues();
    if (result.success && result.data) {
      setIssues(result.data);
    }
    setLoading(false);
  }

  async function handleStatusChange(issueId: string, newStatus: "reported" | "pending" | "solved" | "closed") {
    setActionLoading(issueId);
    const result = await updateIssueStatus(issueId, newStatus);
    setMessage({ type: result.success ? "success" : "error", text: result.message || result.error || "" });
    if (result.success) loadIssues();
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handlePriorityChange(issueId: string, newPriority: "low" | "medium" | "high" | "critical") {
    setActionLoading(issueId);
    const result = await updateIssuePriority(issueId, newPriority);
    setMessage({ type: result.success ? "success" : "error", text: result.message || result.error || "" });
    if (result.success) loadIssues();
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDelete(issueId: string) {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    setActionLoading(issueId);
    const result = await deleteIssue(issueId);
    setMessage({ type: result.success ? "success" : "error", text: result.message || result.error || "" });
    if (result.success) loadIssues();
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleClearResolved() {
    const resolvedCount = issues.filter(i => i.status === 'solved' || i.status === 'closed').length;
    
    if (resolvedCount === 0) {
      setMessage({ type: "error", text: "No resolved issues to clear" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (!confirm(`Are you sure you want to delete ${resolvedCount} resolved issue${resolvedCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    setClearingResolved(true);
    const result = await clearResolvedIssues(true);
    setMessage({ type: result.success ? "success" : "error", text: result.message || result.error || "" });
    if (result.success) {
      loadIssues();
    }
    setClearingResolved(false);
    setTimeout(() => setMessage(null), 3000);
  }

  const filteredIssues = issues.filter((issue) => {
    if (filter !== "all" && issue.type !== filter) return false;
    if (statusFilter !== "all" && issue.status !== statusFilter) return false;
    if (priorityFilter !== "all" && issue.priority !== priorityFilter) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "reported": return <AlertCircle size={16} className="text-red-500" />;
      case "pending": return <Clock size={16} className="text-yellow-500" />;
      case "solved": return <CheckCircle size={16} className="text-green-500" />;
      case "closed": return <CheckCircle size={16} className="text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug": return <Bug size={16} />;
      case "complaint": return <MessageSquare size={16} />;
      case "feature_request": return <Plus size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-gray-100 text-gray-800";
    }
  };

  if (!loading && hasAccess === false) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-red-100 shadow-sm max-w-lg mx-auto mt-12 p-8">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2 text-sm">You don&apos;t have administrative permissions to view or manage the issues log.</p>
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-radiance-charcoalTextColor">Issues Log</h1>
          <p className="text-gray-600 mt-1">Track system bugs and customer complaints</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearResolved}
            disabled={clearingResolved}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Delete all resolved/closed issues"
          >
            <RotateCcw size={18} />
            {clearingResolved ? 'Clearing...' : 'Clear Resolved'}
          </button>
          <AlertTriangle className="text-radiance-goldColor" size={32} />
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor"
        >
          <option value="all">All Types</option>
          <option value="bug">Bugs Only</option>
          <option value="complaint">Complaints Only</option>
          <option value="feature_request">Feature Requests</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor"
        >
          <option value="all">All Statuses</option>
          <option value="reported">Reported</option>
          <option value="pending">Pending</option>
          <option value="solved">Solved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-radiance-goldColor"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-radiance-goldColor mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredIssues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${issue.type === "bug" ? "bg-red-100" : issue.type === "complaint" ? "bg-blue-100" : "bg-purple-100"}`}>
                    {getTypeIcon(issue.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{issue.title}</h3>
                      {getStatusIcon(issue.status)}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        issue.status === "reported" ? "bg-red-100 text-red-800" :
                        issue.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        issue.status === "solved" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {issue.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2 text-sm">{issue.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Reported: {new Date(issue.created_at).toLocaleString()}</span>
                      {issue.profiles?.email && <span>• By: {issue.profiles.email}</span>}
                      {issue.resolved_at && <span>• Resolved: {new Date(issue.resolved_at).toLocaleString()}</span>}
                      {issue.admin_staff && <span>• Assigned: {issue.admin_staff.position || "Admin"}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={issue.status}
                    onChange={(e) => handleStatusChange(issue.id, e.target.value as any)}
                    disabled={actionLoading === issue.id}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-radiance-goldColor disabled:opacity-50"
                  >
                    <option value="reported">Reported</option>
                    <option value="pending">Pending</option>
                    <option value="solved">Solved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select
                    value={issue.priority}
                    onChange={(e) => handlePriorityChange(issue.id, e.target.value as any)}
                    disabled={actionLoading === issue.id}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-radiance-goldColor disabled:opacity-50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <button
                    onClick={() => handleDelete(issue.id)}
                    disabled={actionLoading === issue.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredIssues.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No issues found</p>
        </div>
      )}
    </div>
  );
}
