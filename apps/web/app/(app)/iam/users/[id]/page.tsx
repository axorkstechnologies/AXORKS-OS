"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  MapPin,
  FileText,
  Clock,
  KeyRound,
  Lock,
  Unlock,
  X,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  Crown,
} from "lucide-react";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isFounder = Boolean(
    currentUser?.role === "Founder" ||
      currentUser?.email === "mujahidaryan222149@gmail.com" ||
      currentUser?.email === "muhammad.mujahid@axorks.com"
  );

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [showCardPassword, setShowCardPassword] = useState(false);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState("Software Engineer");
  const [newDept, setNewDept] = useState("Development");

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["iam-user", id],
    queryFn: () => apiClient(`/api/v1/iam/users/${id}`),
  });

  const u = (user as any)?.data || user;

  const passwordMutation = useMutation({
    mutationFn: (pass: string) =>
      apiClient(`/api/v1/iam/users/${id}/change-password`, {
        method: "POST",
        body: JSON.stringify({ new_password: pass, password: pass }),
      }),
    onSuccess: (res) => {
      toast.success(res?.message || "Password updated successfully in Neon DB!");
      setPasswordModalOpen(false);
      setNewPassword("");
      queryClient.invalidateQueries({ queryKey: ["iam-user", id] });
      queryClient.invalidateQueries({ queryKey: ["iam-users"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update password");
    },
  });

  const roleMutation = useMutation({
    mutationFn: (rolePayload: any) =>
      apiClient(`/api/v1/iam/users/${id}/change-role`, {
        method: "POST",
        body: JSON.stringify(rolePayload),
      }),
    onSuccess: (res) => {
      toast.success(res?.message || "Role and permissions updated successfully in Neon DB!");
      setRoleModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["iam-user", id] });
      queryClient.invalidateQueries({ queryKey: ["iam-users"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update role");
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400 font-mono">Loading Employee Profile from Neon DB...</div>;
  }

  if (!u) {
    return (
      <div className="space-y-4">
        <Link href="/iam/users" className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Employee Directory
        </Link>
        <div className="bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Employee profile not found</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {isError ? "This profile could not be loaded." : "No employee exists with this ID."}
          </p>
          <Link
            href="/iam/users"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black transition mt-2 shadow-md shadow-violet-600/30"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Directory
          </Link>
        </div>
      </div>
    );
  }

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let rand = "";
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(`Axorks${rand}`);
  };

  return (
    <div className="space-y-6">
      <Link href="/iam/users" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Employee Directory
      </Link>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          {u.avatar_url ? (
            <img
              src={u.avatar_url}
              alt={u.first_name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-violet-500 shadow-lg shadow-violet-600/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black flex items-center justify-center text-2xl shadow-lg shadow-violet-600/30">
              {u.first_name?.[0] || "E"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {u.first_name} {u.last_name || ""}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                {u.status}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">{u.designation || u.role} • {u.department || "General"}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID: <strong className="text-slate-800 dark:text-slate-200 font-bold">{u.employee_id}</strong></p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-900 dark:text-violet-300 border border-violet-300 dark:border-violet-500/30">
            Role: {u.role}
          </span>

          {isFounder && (
            <>
              <button
                onClick={() => {
                  setPasswordModalOpen(true);
                  setNewPassword(u.last_set_password || "");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-md shadow-violet-600/30 transition transform active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5" /> Update Password
              </button>

              <button
                onClick={() => {
                  setRoleModalOpen(true);
                  setNewRole(u.role || "Software Engineer");
                  setNewDept(u.department || "Development");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition transform active:scale-95"
              >
                <UserCheck className="w-3.5 h-3.5" /> Update Role
              </button>
            </>
          )}
        </div>
      </div>

      {/* FOUNDER EXCLUSIVE CREDENTIALS PANEL */}
      {isFounder && (
        <div className="bg-gradient-to-r from-violet-950/40 via-slate-950 to-indigo-950/40 p-6 rounded-3xl border-2 border-violet-500/50 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  Founder Executive Access: Active Employee Credentials
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Founder Only
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">Real-time credentials synchronized directly with Neon PostgreSQL</p>
              </div>
            </div>
            <button
              onClick={() => {
                setPasswordModalOpen(true);
                setNewPassword(u.last_set_password || "");
              }}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-violet-600/30 self-start sm:self-auto"
            >
              <KeyRound className="w-3.5 h-3.5" /> Change Password
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Login Username</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-white text-sm">@{u.username || u.first_name.toLowerCase()}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(u.username || u.first_name.toLowerCase());
                    toast.success("Username copied to clipboard");
                  }}
                  className="text-[11px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Official Email</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white text-xs truncate max-w-[180px]">{u.email}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(u.email);
                    toast.success("Email copied to clipboard");
                  }}
                  className="text-[11px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Active Working Password</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {showCardPassword ? (u.last_set_password || "Farwa@Axorks2026!") : "••••••••••••"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCardPassword(!showCardPassword)}
                    className="text-slate-400 hover:text-white"
                    title={showCardPassword ? "Hide password" : "Show password"}
                  >
                    {showCardPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(u.last_set_password || "Farwa@Axorks2026!");
                      toast.success("Active working password copied to clipboard");
                    }}
                    className="text-[11px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <User className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Employment &amp; Contact Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Email Address</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{u.email}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Phone Number</span>
              <span className="font-bold text-slate-900 dark:text-white">{u.phone || "—"}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Username</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">@{u.username || u.first_name.toLowerCase()}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Joining Date</span>
              <span className="font-bold text-slate-900 dark:text-white">{u.joining_date || "Active Staff"}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Employment Type</span>
              <span className="font-bold text-slate-900 dark:text-white capitalize">{u.employment_type?.replace("_", " ") || "Full-time"}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Department</span>
              <span className="font-bold text-slate-900 dark:text-white">{u.department || "Development"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Security &amp; Session Activity
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Last Login Time</span>
              <span className="font-bold text-slate-900 dark:text-white">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Active Session"}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">IP Address</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{u.last_login_ip || "127.0.0.1"}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Browser</span>
              <span className="font-bold text-slate-900 dark:text-white">{u.last_login_browser || "Chrome"}</span>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400 block font-medium">Account Status</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 capitalize">{u.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* UPDATE PASSWORD MODAL */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Update Password in Neon DB
              </h3>
              <button onClick={() => setPasswordModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-800 dark:text-slate-200">New Password *</label>
                <button onClick={handleGeneratePassword} className="text-violet-600 dark:text-violet-400 font-bold hover:underline flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Generate Secure
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setPasswordModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newPassword || newPassword.length < 6) {
                    toast.error("Password must be at least 6 characters");
                    return;
                  }
                  passwordMutation.mutate(newPassword);
                }}
                disabled={passwordMutation.isPending}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-md shadow-violet-600/30 transition disabled:opacity-50"
              >
                {passwordMutation.isPending ? "Updating..." : "Save Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE ROLE MODAL */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Update Role in Neon DB
              </h3>
              <button onClick={() => setRoleModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
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
                <label className="font-bold text-slate-800 dark:text-slate-200">Department</label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                >
                  <option value="Marketing & Outreach">Marketing &amp; Outreach</option>
                  <option value="Development">Development</option>
                  <option value="Sales & Growth">Sales &amp; Growth</option>
                  <option value="Operations">Operations</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setRoleModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button
                onClick={() => roleMutation.mutate({ role: newRole, department: newDept })}
                disabled={roleMutation.isPending}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
              >
                {roleMutation.isPending ? "Updating..." : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
