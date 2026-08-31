"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Search,
  Plus,
  LayoutList,
  Grid,
  Lock,
  UserCheck,
  KeyRound,
  MoreVertical,
  X,
  Phone,
  Mail,
  Building2,
  Crown,
  Unlock,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Users,
} from "lucide-react";

export default function IAMUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [activeUserMenu, setActiveUserMenu] = useState<string | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<any | null>(null);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Development");
  const [designation, setDesignation] = useState("Software Engineer");
  const [role, setRole] = useState("Software Engineer");
  const [employmentType, setEmploymentType] = useState("full_time");

  const isFounder =
    currentUser?.role === "Founder" ||
    currentUser?.role === "Co-Founder" ||
    currentUser?.role === "Admin" ||
    currentUser?.email === "mujahidaryan222149@gmail.com";

  const { data: response = [], isLoading } = useQuery({
    queryKey: ["iam-users", search, statusFilter, roleFilter],
    queryFn: () =>
      apiClient("/api/v1/iam/users", {
        params: {
          search,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(roleFilter ? { role: roleFilter } : {}),
        },
      }),
  });

  const users = Array.isArray(response) ? response : response?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      apiClient("/api/v1/iam/users", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("Employee profile & credentials created in Neon DB");
      queryClient.invalidateQueries({ queryKey: ["iam-users"] });
      queryClient.invalidateQueries({ queryKey: ["iam-dashboard"] });
      setCreateOpen(false);
      setFirstName("");
      setLastName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setPhone("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create user");
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: string }) =>
      apiClient(`/api/v1/iam/users/${userId}/${action}`, { method: "POST" }),
    onSuccess: (res) => {
      toast.success(res?.message || res?.data?.message || "Action executed successfully");
      queryClient.invalidateQueries({ queryKey: ["iam-users"] });
      queryClient.invalidateQueries({ queryKey: ["iam-dashboard"] });
      setActiveUserMenu(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Action failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient(`/api/v1/iam/users/${userId}`, { method: "DELETE" }),
    onSuccess: (res) => {
      toast.success(res?.message || "Employee account deleted permanently from Neon DB");
      queryClient.invalidateQueries({ queryKey: ["iam-users"] });
      queryClient.invalidateQueries({ queryKey: ["iam-dashboard"] });
      setDeleteTargetUser(null);
      setActiveUserMenu(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete account");
      setDeleteTargetUser(null);
    },
  });

  const isProtectedProfile = (u: any) => {
    const userEmail = (u?.email || "").toLowerCase();
    const userRole = (u?.role || "").toLowerCase();
    const userName = (u?.first_name || "").toLowerCase();
    const userId = String(u?.id || "").toLowerCase();

    return (
      userEmail === "mujahidaryan222149@gmail.com" ||
      userEmail === "muhammad.mujahid@axorks.com" ||
      userRole === "founder" ||
      userId === "00000000-0000-0000-0000-00000000000a" ||
      userId === "user_founder_01" ||
      userEmail === "heyfarii@gmail.com" ||
      userEmail === "farhana.bakht@axorks.com" ||
      userRole === "co-founder" ||
      userName === "farhana" ||
      userEmail === "farwa@axorks.com" ||
      userName === "farwa"
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFounder) {
      toast.error("Only Founder has authorization to create new employee accounts");
      return;
    }

    createMutation.mutate({
      first_name: firstName,
      last_name: lastName,
      username: username || firstName.toLowerCase(),
      email,
      password: password || "AxorksPass123!",
      phone,
      department,
      designation,
      role,
      employment_type: employmentType,
      status: "active",
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-500" /> Employee Directory & Account Management
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Founder command for adding/deleting employees with instant Neon PostgreSQL synchronization
          </p>
        </div>

        {isFounder && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition"
          >
            <Plus className="w-4 h-4" /> Create Employee Account
          </button>
        )}
      </div>

      {/* Filter & View Switcher */}
      <div className="glass p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, email..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="" className="bg-slate-900 text-slate-100">All Statuses</option>
            <option value="active" className="bg-slate-900 text-slate-100">Active</option>
            <option value="suspended" className="bg-slate-900 text-slate-100">Suspended</option>
            <option value="locked" className="bg-slate-900 text-slate-100">Locked</option>
            <option value="inactive" className="bg-slate-900 text-slate-100">Inactive</option>
          </select>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-end sm:self-auto">
          <button
            onClick={() => setViewMode("card")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition ${
              viewMode === "card"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> Mobile Cards
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" /> Table
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-400 font-mono">
          Loading employees from Neon DB...
        </div>
      ) : viewMode === "card" ? (
        /* Mobile / Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u: any) => {
            const protectedUser = isProtectedProfile(u);
            return (
              <div
                key={u.id}
                className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-violet-500/30 transition relative overflow-hidden group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {u.first_name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {u.first_name} {u.last_name}
                        </h3>
                        {protectedUser && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5"
                            title="Protected Company Profile (Non-deletable)"
                          >
                            <ShieldCheck className="w-2.5 h-2.5" /> Protected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">@{u.username || u.first_name.toLowerCase()}</p>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  {isFounder && (
                    <div className="relative">
                      <button
                        onClick={() => setActiveUserMenu(activeUserMenu === u.id ? null : u.id)}
                        className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeUserMenu === u.id && (
                        <div className="absolute right-0 top-6 w-44 bg-slate-950 border border-slate-800 rounded-xl shadow-xl z-20 p-1 space-y-0.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                          {!protectedUser && (
                            <>
                              <button
                                onClick={() =>
                                  actionMutation.mutate({
                                    userId: u.id,
                                    action: u.status === "suspended" ? "reactivate" : "suspend",
                                  })
                                }
                                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-900 rounded-lg text-slate-300 flex items-center gap-2"
                              >
                                {u.status === "suspended" ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                                {u.status === "suspended" ? "Reactivate" : "Suspend (Instant)"}
                              </button>

                              <button
                                onClick={() => actionMutation.mutate({ userId: u.id, action: "reset-password" })}
                                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-900 rounded-lg text-slate-300 flex items-center gap-2"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-violet-400" /> Reset Password
                              </button>

                              <button
                                onClick={() => setDeleteTargetUser(u)}
                                className="w-full text-left px-2.5 py-1.5 hover:bg-red-950/40 rounded-lg text-red-400 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" /> Delete Account
                              </button>
                            </>
                          )}
                          {protectedUser && (
                            <div className="p-2 text-[11px] text-amber-400/80 font-medium">
                              Protected profile cannot be deleted or suspended.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                    {u.role}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      u.status === "active"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}
                  >
                    {u.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left p-3 text-slate-500 font-semibold">Employee</th>
                <th className="text-left p-3 text-slate-500 font-semibold">Username</th>
                <th className="text-left p-3 text-slate-500 font-semibold">Department</th>
                <th className="text-left p-3 text-slate-500 font-semibold">Role</th>
                <th className="text-left p-3 text-slate-500 font-semibold">Status</th>
                <th className="text-right p-3 text-slate-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((u: any) => {
                const protectedUser = isProtectedProfile(u);
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-violet-600/20 text-violet-400 font-bold flex items-center justify-center text-xs">
                          {u.first_name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {u.first_name} {u.last_name}
                            {protectedUser && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Protected
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-400">@{u.username || u.first_name.toLowerCase()}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{u.department || "General"}</td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{u.role}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {isFounder && (
                        <div className="flex items-center justify-end gap-1.5">
                          {!protectedUser && (
                            <>
                              <button
                                onClick={() => actionMutation.mutate({ userId: u.id, action: "reset-password" })}
                                className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:bg-violet-600 hover:text-white rounded text-[11px] font-medium transition"
                                title="Reset password"
                              >
                                Reset Pass
                              </button>
                              <button
                                onClick={() => setDeleteTargetUser(u)}
                                className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white rounded text-[11px] font-medium transition"
                                title="Delete account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => actionMutation.mutate({ userId: u.id, action: "impersonate" })}
                            className="px-2.5 py-1 bg-violet-600/10 text-violet-400 hover:bg-violet-600 hover:text-white rounded text-[11px] font-medium transition"
                          >
                            Impersonate
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-red-500/40 text-slate-100 p-6 rounded-2xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Delete Employee Account?</h3>
                <p className="text-xs text-slate-400">This change persists immediately to Neon PostgreSQL.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
              Are you sure you want to permanently delete <strong>{deleteTargetUser.first_name} {deleteTargetUser.last_name}</strong> (<span className="font-mono text-violet-400">{deleteTargetUser.email}</span>)?
              The user will be immediately logged out and unable to log in again.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTargetUser.id)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting from Neon DB..." : "Confirm Permanent Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {createOpen && isFounder && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 text-slate-100 p-6 rounded-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Create Employee Account & Credentials</h3>
              <button onClick={() => setCreateOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Sarah"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Connor"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Username (unique for login) *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. sarah"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Email Address (unique) *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah@axorks.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Password *</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. AxorksPass123!"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500 font-medium"
                  >
                    <option value="Development">Development</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Role & Permissions</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500 font-medium"
                  >
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Marketing & Outreach">Marketing & Outreach</option>
                    <option value="Admin">Admin</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition shadow-lg shadow-violet-600/30 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating in Neon DB..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
