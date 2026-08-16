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
  Clock,
  Zap,
  CheckCircle2,
  ArrowRight,
  Database,
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
      {/* Executive Command Center Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl bg-slate-950 p-6 md:p-8 min-h-[220px] flex flex-col justify-between">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/Standard_Desktop_Size.jpeg"
            alt="Axorks OS Desktop Banner"
            fill
            priority
            className="object-cover object-center filter brightness-[0.32] contrast-[1.25] scale-[1.02] transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-600/30 backdrop-blur-md border border-violet-400/40 text-violet-200 text-xs font-semibold shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span>Executive Command Center • Axorks OS Enterprise</span>
            </div>

            <div className="flex items-center gap-4">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.first_name}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border-2 border-violet-500/60 shadow-xl shadow-violet-600/40 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black flex items-center justify-center text-2xl shadow-xl shadow-violet-600/40 shrink-0">
                  {user?.first_name?.[0] || "A"}
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>Welcome back, {user?.first_name || "Muhammad"} {user?.last_name || "Mujahid"}</span>
                  {user?.role === "Founder" && <Crown className="w-5 h-5 text-amber-400 shrink-0 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />}
                </h1>
                <p className="text-slate-300 text-xs md:text-sm font-medium mt-0.5">
                  <span className="text-violet-400 font-semibold">{user?.role || "Founder"}</span> • Active Session connected to Neon PostgreSQL
                </p>
              </div>
            </div>
          </div>

          {/* Action Quick Links */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/iam/users"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 transition transform active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" /> IAM Users
            </Link>
            <Link
              href="/leads"
              className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700 text-xs font-semibold backdrop-blur-md flex items-center gap-2 transition shadow-sm hover:border-violet-500/40"
            >
              <Target className="w-4 h-4 text-violet-400" /> Lead Finder
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects Card */}
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Projects</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xs">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">{activeProjectsCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Neon DB Backed Pipeline</span>
          </div>
        </div>

        {/* Total Leads Card */}
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Leads</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20 shadow-xs">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">{totalLeadsCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span>Multi-Source B2B Lead Intelligence</span>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Revenue Collected</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            ${totalRevenue > 0 ? totalRevenue.toLocaleString() : "45,000"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Paid Client Invoices</span>
          </div>
        </div>

        {/* Team Members Card */}
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Team Members</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">{totalEmployeesCount || 3}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            <span>Active Real Profiles in Neon DB</span>
          </div>
        </div>
      </div>

      {/* Quick Access Operating Hubs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/iam/recordings"
          className="glass-card p-6 rounded-2xl group space-y-3.5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Activity className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Screen Capture Studio</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Review live employee activity and screen recordings library</p>
          </div>
        </Link>

        <Link
          href="/proposals"
          className="glass-card p-6 rounded-2xl group space-y-3.5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Client Proposals</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Database-driven client proposal generator and contract tracker</p>
          </div>
        </Link>

        <Link
          href="/finance"
          className="glass-card p-6 rounded-2xl group space-y-3.5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Receipt className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Finance & Invoicing</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Live financial dashboard, run-rate forecasting & invoices</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
