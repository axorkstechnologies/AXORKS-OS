"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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
} from "lucide-react";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["iam-user", id],
    queryFn: () => apiClient(`/api/v1/iam/users/${id}`),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-xs text-slate-400">Loading Employee Profile...</div>;
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

  return (
    <div className="space-y-6">
      <Link href="/iam/users" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-100">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Employee Directory
      </Link>

      {/* Header Banner */}
      <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xl shadow-lg shadow-violet-600/30">
            {u.first_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">{u.first_name} {u.last_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {u.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{u.designation} • {u.department}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">ID: <strong className="text-slate-300 font-mono">{u.employee_id}</strong></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/30">
            Role: {u.role}
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <User className="w-4 h-4 text-violet-400" /> Employment & Contact Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Email Address</span>
              <span className="font-semibold text-slate-200">{u.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Phone Number</span>
              <span className="font-semibold text-slate-200">{u.phone || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">CNIC / ID</span>
              <span className="font-semibold text-slate-200 font-mono">{u.cnic || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Joining Date</span>
              <span className="font-semibold text-slate-200">{u.joining_date || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Employment Type</span>
              <span className="font-semibold text-slate-200 capitalize">{u.employment_type?.replace("_", " ")}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Emergency Contact</span>
              <span className="font-semibold text-slate-200">{u.emergency_contact || "—"}</span>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <Clock className="w-4 h-4 text-cyan-400" /> Security & Session Activity
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Last Login Time</span>
              <span className="font-semibold text-slate-200">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Never"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">IP Address</span>
              <span className="font-semibold text-slate-200 font-mono">{u.last_login_ip || "127.0.0.1"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Browser</span>
              <span className="font-semibold text-slate-200">{u.last_login_browser || "Chrome"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Device</span>
              <span className="font-semibold text-slate-200">{u.last_login_device || "Desktop"}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-500 block mb-1">Employee Notes</span>
            <p className="text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">{u.notes || "No notes provided."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
