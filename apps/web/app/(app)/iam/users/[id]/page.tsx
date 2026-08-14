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
} from "lucide-react";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const isFounderOrAdmin =
    currentUser?.role === "Founder" ||
    currentUser?.role === "Co-Founder" ||
    currentUser?.role === "Admin";

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["iam-user", id],
    queryFn: () => apiClient(`/api/v1/iam/users/${id}`),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (pass: string) =>
      apiClient(`/api/v1/iam/users/${id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ new_password: pass }),
      }),
    onSuccess: (res) => {
      toast.success(res?.message || res?.data?.message || "Password reset successfully!");
      setResetModalOpen(false);
      setNewPassword("");
      queryClient.invalidateQueries({ queryKey: ["iam-user", id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reset password");
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-xs text-slate-400 font-mono">Loading Employee Profile...</div>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Link href="/iam/users" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Employee Directory
        </Link>
        <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Employee profile not found</p>
          <p className="text-xs text-slate-500">
            {isError ? "This profile could not be loaded." : "No employee exists with this ID."}
          </p>
          <Link
            href="/iam/users"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Directory
          </Link>
        </div>
      </div>
    );
  }

  const u = user;

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    resetPasswordMutation.mutate(newPassword);
  };

  return (
    <div className="space-y-6">
      <Link href="/iam/users" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-100">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Employee Directory
      </Link>

      {/* Header Banner */}
      <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {u.avatar_url ? (
            <img
              src={u.avatar_url}
              alt={u.first_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-violet-500/40 shadow-lg shadow-violet-600/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xl shadow-lg shadow-violet-600/30">
              {u.first_name?.[0] || "E"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {u.first_name} {u.last_name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {u.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{u.designation} • {u.department}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">ID: <strong className="text-slate-300 font-mono">{u.employee_id}</strong></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30">
            Role: {u.role}
          </span>
          {isFounderOrAdmin && (
            <button
              onClick={() => setResetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition"
            >
              <KeyRound className="w-3.5 h-3.5" /> Reset / Set Password
            </button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <User className="w-4 h-4 text-violet-500" /> Employment & Contact Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Email Address</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{u.email}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Phone Number</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{u.phone || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">CNIC / ID</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{u.cnic || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Joining Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{u.joining_date || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Employment Type</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{u.employment_type?.replace("_", " ")}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Emergency Contact</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{u.emergency_contact || "—"}</span>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Clock className="w-4 h-4 text-cyan-500" /> Security & Session Activity
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Last Login Time</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Never"}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">IP Address</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{u.last_login_ip || "127.0.0.1"}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Browser</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{u.last_login_browser || "Chrome"}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Device</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{u.last_login_device || "Desktop"}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">Employee Notes</span>
            <p className="text-slate-800 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">{u.notes || "No notes provided."}</p>
          </div>
        </div>
      </div>

      {/* Admin Reset Password Modal */}
      {resetModalOpen && isFounderOrAdmin && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 text-slate-100 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-violet-400" /> Reset Password for {u.first_name}
              </h3>
              <button onClick={() => setResetModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  New Password for {u.first_name} {u.last_name}
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (or leave for default)..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-lg shadow-violet-600/30 transition disabled:opacity-50"
                >
                  {resetPasswordMutation.isPending ? "Updating..." : "Set Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
