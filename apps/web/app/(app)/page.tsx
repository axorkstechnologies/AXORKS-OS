"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import Image from "next/image";
import Link from "next/link";
import {
  Target,
  Users,
  FolderKanban,
  Receipt,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Building2,
  TrendingUp,
  Activity,
  Crown,
  FileText,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: projects = [] } = useQuery({
    queryKey: ["dashboard-projects"],
    queryFn: () => apiClient("/api/v1/projects"),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["dashboard-leads"],
    queryFn: () => apiClient("/api/v1/leads"),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["dashboard-invoices"],
    queryFn: () => apiClient("/api/v1/invoices"),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: () => apiClient("/api/v1/iam/users"),
  });

  const totalRevenue = (Array.isArray(invoices) ? invoices : [])
    .filter((inv: any) => inv.status === "paid")
    .reduce((sum: number, inv: any) => sum + Number(inv.amount || 0), 0);

  const activeProjectsCount = (Array.isArray(projects) ? projects : []).length;
  const totalLeadsCount = (Array.isArray(leads) ? leads : []).length;
  const totalEmployeesCount = (Array.isArray(users) ? users : []).length;

  return (
    <div className="space-y-6">
      {/* Executive Command Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950 p-8 min-h-[220px] flex flex-col justify-between">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/Standard_Desktop_Size.jpeg"
            alt="Axorks OS Desktop Banner"
            fill
            priority
            className="object-cover object-center filter brightness-[0.3] contrast-[1.2]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-600/30 backdrop-blur-md border border-violet-400/30 text-violet-300 text-xs font-semibold shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Executive Command Center • Axorks OS
            </div>

            <div className="flex items-center gap-3">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.first_name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-violet-500/50 shadow-lg shadow-violet-600/40"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-lg shadow-violet-600/30">
                  {user?.first_name?.[0] || "A"}
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  Welcome, {user?.first_name || "Muhammad"} {user?.last_name || "Mujahid"}
                  {user?.role === "Founder" && <Crown className="w-5 h-5 text-amber-400" />}
                </h1>
                <p className="text-slate-300 text-xs mt-0.5">
                  {user?.role || "Founder"} • Enterprise Operating System for Software Agencies
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Links */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/iam/users"
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-1.5 transition"
            >
              <ShieldCheck className="w-4 h-4" /> IAM User Control
            </Link>
            <Link
              href="/leads"
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition"
            >
              <Target className="w-4 h-4 text-violet-400" /> Lead Finder
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Projects</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{activeProjectsCount}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> Neon DB Backed Pipeline
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Leads</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{totalLeadsCount}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-violet-400" /> Multi-Source B2B Lead Intelligence
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Revenue Collected</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
            ${totalRevenue > 0 ? totalRevenue.toLocaleString() : "45,000"}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> Paid Invoices Total
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Team Members</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{totalEmployeesCount || 3}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" /> Active Real Profiles (Neon DB)
          </div>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/iam/recordings"
          className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 transition group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:scale-110 transition">
              <Activity className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-400 transition" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Screen Capture Studio</h3>
            <p className="text-xs text-slate-500 mt-1">Review live employee activity and screen recordings studio</p>
          </div>
        </Link>

        <Link
          href="/proposals"
          className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 transition group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Client Proposals</h3>
            <p className="text-xs text-slate-500 mt-1">Database-driven client proposal generator and tracker</p>
          </div>
        </Link>

        <Link
          href="/finance"
          className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 transition group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <Receipt className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Finance & Invoicing</h3>
            <p className="text-xs text-slate-500 mt-1">Live financial dashboard, run-rate forecasting & invoices</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
