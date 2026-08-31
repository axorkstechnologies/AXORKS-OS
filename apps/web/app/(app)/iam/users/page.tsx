"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  KeyRound,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  X,
  Mail,
  Phone,
  Building2,
  Calendar,
  Briefcase,
  Grid,
  LayoutList,
  Sparkles,
  Crown,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export default function IamUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isFounder = Boolean(
    currentUser?.role === "Founder" ||
      currentUser?.email === "mujahidaryan222149@gmail.com" ||
      currentUser?.email === "muhammad.mujahid@axorks.com"
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  // Create User State
  const [createOpen, setCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Development");
  const [designation, setDesignation] = useState("Software Engineer");
  const [role, setRole] = useState("Software Engineer");
  const [employmentType, setEmploymentType] = useState("full-time");

  // Founder Password & Role Management Modals
  const [passwordTargetUser, setPasswordTargetUser] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);

  const [roleTargetUser, setRoleTargetUser] = useState<any | null>(null);
  const [newRoleInput, setNewRoleInput] = useState("Software Engineer");
  const [newDeptInput, setNewDeptInput] = useState("Development");
  const [newDesigInput, setNewDesigInput] = useState("Software Engineer");

  // Action Menu & Delete Target
  const [activeUserMenu, setActiveUserMenu] = useState<string | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<any | null>(null);

  // Fetch Users directly from Neon DB
  const { data: usersResponse, isLoading } = useQuery<{ success: boolean; data: any[] } | any[]>({
    queryKey: ["iam-users", search, statusFilter],
    queryFn: () => {
      let url = "/api/v1/iam/users";
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter) params.append("status", statusFilter);
      if (params.toString()) url += `?${params.toString()}`;
      return apiClient(url);
    },
  });

  const users: any[] = Array.isArray(usersResponse)
    ? usersResponse
    : (usersResponse as any)?.data || [];

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: (userData: any) =>
      apiClient("/api/v1/iam/users", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    onSuccess: (res: any) => {
      toast.success(res?.message || "Employee account created and saved in Neon DB!");
      queryClient.invalidateQueries({ queryKey: ["iam-users"] });
      queryClient.invalidateQueries({ queryKey: ["iam-dashboard"] });
      setCreateOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create employee account");
    },
  });

  // Action Mutation (Suspend, Reactivate, Password, Role, Impersonate)
  const actionMutation = useMutation({
    mutationFn: ({ userId, action, payload = {} }: { userId: string; action: string; payload?: any }) =>
      apiClient(`/api/v1/iam/users/${userId}/${action}`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (res, vars) => {
      toast.success(res?.message || res?.data?.message || `User action '${vars.action}' completed!`);
      queryClient.invalidateQueries({ queryKey: ["iam-users"] });
      queryClient.invalidateQueries({ queryKey: ["iam-dashboard"] });
      setActiveUserMenu(null);
      setPasswordTargetUser(null);
      setRoleTargetUser(null);
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

  const resetCreateForm = () => {
    setFirstName("");
    setLastName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setPhone("");
    setDepartment("Development");
    setDesignation("Software Engineer");
    setRole("Software Engineer");
    setEmploymentType("full-time");
  };

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

  const handleOpenPasswordModal = (u: any) => {
    setPasswordTargetUser(u);
    setNewPasswordInput("");
    setShowPasswordText(false);
    setActiveUserMenu(null);
  };

  const handleOpenRoleModal = (u: any) => {
    setRoleTargetUser(u);
    setNewRoleInput(u.role || "Software Engineer");
    setNewDeptInput(u.department || "Development");
    setNewDesigInput(u.designation || u.role || "Software Engineer");
    setActiveUserMenu(null);
  };

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let rand = "";
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(`Axorks${rand}`);
  };

  const handleSavePassword = () => {
    if (!passwordTargetUser) return;
    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    actionMutation.mutate({
      userId: passwordTargetUser.id,
      action: "change-password",
      payload: { password: newPasswordInput.trim(), new_password: newPasswordInput.trim() },
    });
  };

  const handleSaveRole = () => {
    if (!roleTargetUser) return;
    actionMutation.mutate({
      userId: roleTargetUser.id,
      action: "change-role",
      payload: {
        role: newRoleInput.trim(),
        department: newDeptInput.trim(),
        designation: newDesigInput.trim(),
      },
    });
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
    <div className="space-y-6">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" /> Employee Directory &amp; IAM Access Control
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-500/40">
              {users.length} Active Accounts
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-xs font-medium mt-1">
            Founder command for instant password updates, role assignments, and Neon PostgreSQL user synchronization
          </p>
        </div>

        {isFounder && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-600/30 transition transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Employee Account
          </button>
        )}
      </div>

      {/* Filter & View Switcher */}
      <div className="bg-white dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, email..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-bold focus:outline-none"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Statuses</option>
            <option value="active" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Active</option>
            <option value="suspended" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Suspended</option>
            <option value="locked" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Locked</option>
            <option value="inactive" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Inactive</option>
          </select>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-end sm:self-auto">
          <button
            onClick={() => setViewMode("card")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
              viewMode === "card"
                ? "bg-violet-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> Mobile Cards
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
              viewMode === "table"
                ? "bg-violet-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" /> Table
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400 font-mono">
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
                className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 transition relative overflow-hidden group shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                      {u.first_name?.[0] || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-black text-sm text-slate-900 dark:text-white">
                          {u.first_name} {u.last_name || ""}
                        </h3>
                        {protectedUser && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 flex items-center gap-0.5"
                            title="Protected Company Profile (Non-deletable)"
                          >
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-500" /> Protected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">@{u.username || u.first_name.toLowerCase()}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  {isFounder && (
                    <div className="relative">
                      <button
                        onClick={() => setActiveUserMenu(activeUserMenu === u.id ? null : u.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeUserMenu === u.id && (
                        <div className="absolute right-0 top-7 w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-30 p-1.5 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => handleOpenPasswordModal(u)}
                            className="w-full text-left px-3 py-1.5 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-xl text-slate-800 dark:text-slate-200 flex items-center gap-2 font-bold"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> Update Password
                          </button>

                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            className="w-full text-left px-3 py-1.5 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-xl text-slate-800 dark:text-slate-200 flex items-center gap-2 font-bold"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Update Role
                          </button>

                          {!protectedUser && (
                            <>
                              <button
                                onClick={() =>
                                  actionMutation.mutate({
                                    userId: u.id,
                                    action: u.status === "suspended" ? "reactivate" : "suspend",
                                  })
                                }
                                className="w-full text-left px-3 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl text-slate-800 dark:text-slate-200 flex items-center gap-2 font-medium"
                              >
                                {u.status === "suspended" ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
                                {u.status === "suspended" ? "Reactivate" : "Suspend Account"}
                              </button>

                              <button
                                onClick={() => setDeleteTargetUser(u)}
                                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-rose-700 dark:text-rose-400 flex items-center gap-2 font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete Account
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-900 dark:text-violet-300 border border-violet-300 dark:border-violet-500/30">
                    {u.role}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      u.status === "active"
                        ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40"
                        : "bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40"
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
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Username</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Founder Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((u: any) => {
                const protectedUser = isProtectedProfile(u);
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-600/30 text-violet-800 dark:text-violet-300 font-black flex items-center justify-center text-xs border border-violet-300 dark:border-violet-500/30">
                          {u.first_name?.[0] || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{u.first_name} {u.last_name || ""}</span>
                            {protectedUser && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                                Protected
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-medium">@{u.username || u.first_name.toLowerCase()}</td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">{u.department || "General"}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-900 dark:text-violet-300 border border-violet-300 dark:border-violet-500/30">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        u.status === "active"
                          ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40"
                          : "bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40"
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {isFounder && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPasswordModal(u)}
                            className="px-2.5 py-1 bg-violet-100 hover:bg-violet-600 text-violet-800 hover:text-white dark:bg-violet-600/20 dark:hover:bg-violet-600 dark:text-violet-200 dark:hover:text-white border border-violet-300 dark:border-violet-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                            title="Update employee password in database"
                          >
                            <KeyRound className="w-3 h-3" /> Password
                          </button>

                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-600 text-emerald-800 hover:text-white dark:bg-emerald-600/20 dark:hover:bg-emerald-600 dark:text-emerald-200 dark:hover:text-white border border-emerald-300 dark:border-emerald-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                            title="Update employee role in database"
                          >
                            <UserCheck className="w-3 h-3" /> Role
                          </button>

                          {!protectedUser && (
                            <button
                              onClick={() => setDeleteTargetUser(u)}
                              className="p-1.5 bg-rose-100 hover:bg-rose-600 text-rose-800 hover:text-white dark:bg-rose-600/20 dark:hover:bg-rose-600 dark:text-rose-200 dark:hover:text-white border border-rose-300 dark:border-rose-500/30 rounded-lg text-xs font-medium transition shadow-xs"
                              title="Delete account permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* FOUNDER UPDATE PASSWORD MODAL */}
      {passwordTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Update Employee Password</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Direct write to Neon PostgreSQL</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordTargetUser(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                {passwordTargetUser.first_name} {passwordTargetUser.last_name || ""}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                {passwordTargetUser.email} • Role: {passwordTargetUser.role}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">New Password *</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Generate Secure
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password (min 6 characters)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-violet-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setPasswordTargetUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePassword}
                disabled={!newPasswordInput.trim() || actionMutation.isPending}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-md shadow-violet-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {actionMutation.isPending ? "Updating..." : "Save New Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOUNDER UPDATE ROLE MODAL */}
      {roleTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Update Employee Role &amp; Tier</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Automatic RBAC permission sync</p>
                </div>
              </div>
              <button
                onClick={() => setRoleTargetUser(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                {roleTargetUser.first_name} {roleTargetUser.last_name || ""}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                Current Role: <strong className="text-violet-600 dark:text-violet-300">{roleTargetUser.role}</strong>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Role Designation *</label>
                <select
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="Marketing Specialist">Marketing Specialist</option>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="Co-Founder">Co-Founder</option>
                  <option value="Founder">Founder</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Department</label>
                <select
                  value={newDeptInput}
                  onChange={(e) => setNewDeptInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="Marketing & Outreach">Marketing &amp; Outreach</option>
                  <option value="Development">Development</option>
                  <option value="Sales & Growth">Sales &amp; Growth</option>
                  <option value="Operations">Operations</option>
                  <option value="Executive">Executive</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Designation / Title</label>
                <input
                  type="text"
                  value={newDesigInput}
                  onChange={(e) => setNewDesigInput(e.target.value)}
                  placeholder="e.g. Lead Outreach Strategist"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setRoleTargetUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                disabled={actionMutation.isPending}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {actionMutation.isPending ? "Updating..." : "Save Role Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EMPLOYEE ACCOUNT MODAL */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Create Employee Account</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Add real credential account to Neon PostgreSQL</p>
                </div>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">First Name *</label>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Farwa"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Last Name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Khalid"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farwa@axorks.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="farwa"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">Initial Password *</label>
                <input
                  required
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set account password (e.g. AxorksPass123!)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Marketing Specialist">Marketing Specialist</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Co-Founder">Co-Founder</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Marketing & Outreach">Marketing &amp; Outreach</option>
                    <option value="Development">Development</option>
                    <option value="Sales & Growth">Sales &amp; Growth</option>
                    <option value="Operations">Operations</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-md shadow-violet-600/30 transition disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating..." : "Save to Neon DB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTargetUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 border border-rose-300 dark:border-rose-500/40 p-6 rounded-3xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Delete Employee Account?</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">This change is permanent in Neon PostgreSQL.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              Are you sure you want to permanently delete <strong>{deleteTargetUser.first_name} {deleteTargetUser.last_name || ""}</strong> (<span className="font-mono text-violet-600 dark:text-violet-300">{deleteTargetUser.email}</span>)?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTargetUser.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/30 transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
