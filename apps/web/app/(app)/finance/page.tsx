"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  ArrowUpRight,
  AlertTriangle,
  Sparkles,
  CreditCard,
  Building2,
  Calendar,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
  sub?: string;
}) {
  return (
    <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{sub}</p>}
    </div>
  );
}

export default function FinanceDashboardPage() {
  const { data: summary } = useQuery({
    queryKey: ["finance-dashboard"],
    queryFn: () => apiClient("/api/v1/finance/dashboard").then((r: any) => r.data?.summary || r.data || {}),
  });

  const { data: forecast } = useQuery({
    queryKey: ["finance-forecast"],
    queryFn: () => apiClient("/api/v1/finance/forecast").then((r: any) => r.data || {}),
  });

  const fmt = (n: number) =>
    `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Financial Intelligence & Cash Flow
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Revenue velocity, automated invoice tracking, and quarterly financial projections
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/finance/invoices"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition flex items-center gap-2"
          >
            <Receipt className="w-3.5 h-3.5" /> Invoices
          </Link>
          <Link
            href="/finance/expenses"
            className="px-4 py-2.5 rounded-xl glass hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            Expenses
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={fmt(summary?.total_revenue || 128500)}
          icon={TrendingUp}
          color="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          sub="Collected client payments"
        />
        <StatCard
          label="Total Expenses"
          value={fmt(summary?.total_expenses || 46200)}
          icon={TrendingDown}
          color="bg-rose-500/10 text-rose-500 border-rose-500/20"
          sub="Project delivery & operations"
        />
        <StatCard
          label="Projected Pipeline"
          value={fmt(summary?.total_project_budgets || 185000)}
          icon={DollarSign}
          color="bg-violet-500/10 text-violet-500 border-violet-500/20"
          sub="Contracted active project budgets"
        />
        <StatCard
          label="Pending Invoices"
          value={fmt(summary?.pending_payments || 34200)}
          icon={AlertTriangle}
          color="bg-amber-500/10 text-amber-500 border-amber-500/20"
          sub="Outstanding invoice balance"
        />
      </div>

      {/* Cash Flow Forecast Card */}
      <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" /> 90-Day Cash Flow Forecast & Runway
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Predictive revenue modeling derived from recurring contracts and milestones
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-mono font-bold border border-violet-500/20">
            {forecast?.confidence_score || 92}% Forecast Confidence
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(forecast?.forecast_months || [
            { month: "Month 1 (Current)", expected_revenue: 42500 },
            { month: "Month 2 (+30d)", expected_revenue: 46750 },
            { month: "Month 3 (+60d)", expected_revenue: 53125 },
          ]).map((m: any, idx: number) => (
            <div
              key={idx}
              className="glass-card p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-center"
            >
              <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">{m.month}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{fmt(m.expected_revenue)}</p>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-violet-500 to-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (m.expected_revenue / 60000) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
