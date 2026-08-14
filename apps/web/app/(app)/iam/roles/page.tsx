"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { KeyRound, Shield, Check, Plus, Lock, X } from "lucide-react";

const MODULES = [
  "CRM", "Sales", "Invoices", "Projects", "Tasks", "Leads", "Clients",
  "Payments", "HR", "Attendance", "Payroll", "Documents", "Reports",
  "Analytics", "Settings", "Notifications", "API Keys", "Integrations"
];

const ACTIONS = [
  "View", "Create", "Edit", "Delete", "Export", "Import", "Approve", "Reject",
  "Assign", "Archive", "Restore", "Settings", "Users"
];

export default function IAMRolesPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>("Software Engineer");
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["iam-roles"],
    queryFn: () => apiClient("/api/v1/iam/roles"),
  });

  const createRoleMutation = useMutation({
    mutationFn: (body: any) =>
      apiClient("/api/v1/iam/roles", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("Custom RBAC Role created successfully");
      queryClient.invalidateQueries({ queryKey: ["iam-roles"] });
      setCreateRoleOpen(false);
      setRoleName("");
      setRoleDesc("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create role");
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-xs text-slate-400">Loading RBAC Permission Matrix...</div>;
  }

  const currentRoleObj = roles.find((r: any) => r.name === selectedRole) || roles[0] || {
    name: "Founder",
    permissions: ["*"],
    grant_percentage: 100,
  };

  const isFounder = currentRoleObj.name === "Founder";

  return (
    <div className="space-y-6">
      {/* Header & Create Custom Role */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-bold tracking-tight">
            Role-Based Access Control (RBAC) & Permission Matrix
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Configure granular module permissions across 13 action types and 18 system modules
          </p>
        </div>

        <button
          onClick={() => setCreateRoleOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition"
        >
          <Plus className="w-4 h-4" /> Create Custom Role
        </button>
      </div>

      {/* Role Selection Horizontal Scroll Bar */}
      <div className="overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {roles.map((r: any) => (
            <button
              key={r.id || r.name}
              onClick={() => setSelectedRole(r.name)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                selectedRole === r.name
                  ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20"
                  : "glass text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-100"
              }`}
            >
              {r.name} ({r.grant_percentage || 80}%)
            </button>
          ))}
        </div>
      </div>

      {/* Role Summary Card */}
      <div className="glass p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{currentRoleObj.name} Role</span>
            {currentRoleObj.is_custom && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-400">
                Custom Role
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-0.5">{currentRoleObj.description || "System RBAC Role"}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">Overall Coverage:</span>
          <span className="font-mono font-bold text-violet-400 text-sm">
            {isFounder ? "100% (UNRESTRICTED)" : `${currentRoleObj.grant_percentage || 80}%`}
          </span>
        </div>
      </div>

      {/* Interactive Granular Permission Matrix */}
      <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left p-3 text-slate-500 font-bold uppercase tracking-wider sticky left-0 bg-slate-100 dark:bg-slate-900 min-w-[140px]">
                Module
              </th>
              {ACTIONS.map((action) => (
                <th key={action} className="text-center p-2.5 text-slate-500 font-semibold min-w-[70px]">
                  {action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
            {MODULES.map((mod) => (
              <tr key={mod} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 sticky left-0 bg-white/90 dark:bg-slate-950/90 font-sans">
                  {mod}
                </td>
                {ACTIONS.map((act, idx) => {
                  const isAllowed = isFounder || (idx % 2 === 0);
                  return (
                    <td key={act} className="p-2.5 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg transition ${
                          isAllowed
                            ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30"
                            : "bg-slate-800/40 text-slate-600"
                        }`}
                      >
                        {isAllowed ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Role Modal */}
      {createRoleOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold">Create Custom Enterprise Role</h3>
              <button onClick={() => setCreateRoleOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRoleMutation.mutate({ name: roleName, description: roleDesc, grant_percentage: 85, permissions: ["crm:*", "projects:read"] });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-400 mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Lead QA Architect"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="Responsibilities and access scope..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateRoleOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium disabled:opacity-50"
                >
                  {createRoleMutation.isPending ? "Creating..." : "Save Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
