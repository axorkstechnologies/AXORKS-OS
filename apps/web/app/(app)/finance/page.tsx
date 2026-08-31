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
    <div className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 relative overflow-hidden shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{sub}</p>}
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
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-violet-600 dark:text-violet-400" /> Financial Intelligence &amp; Cash Flow
          </h1>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
            Revenue velocity, automated invoice tracking, and quarterly financial projections
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/finance/invoices"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-600/30 transition flex items-center gap-2"
          >
            <Receipt className="w-3.5 h-3.5" /> Invoices
          </Link>
          <Link
            href="/finance/expenses"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-xs"
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
          color="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
          sub="Collected client payments"
        />
        <StatCard
          label="Outstanding (AR)"
          value={fmt(summary?.outstanding_ar || 34200)}
          icon={CreditCard}
          color="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
          sub="Unpaid invoices"
        />
        <StatCard
          label="Monthly Run Rate"
          value={fmt(summary?.mrr || 42000)}
          icon={TrendingUp}
          color="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/30"
          sub="Predictable contracted retainer"
        />
        <StatCard
          label="Operating Expenses"
          value={fmt(summary?.monthly_expenses || 18400)}
          icon={TrendingDown}
          color="bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
          sub="SaaS, hosting & payroll"
        />
      </div>

      {/* Cash Flow Forecast & Invoices Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Cash Flow Forecast
            </h3>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Q3 Projections</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300 font-bold">Projected Net Cash Flow</span>
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">+$72,500</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300 font-bold">Estimated Pipeline Closes</span>
              <span className="font-mono font-black text-violet-700 dark:text-violet-400 text-sm">$48,000</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Invoices Quick Access
            </h3>
            <Link href="/finance/invoices" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">
              View All Invoices
            </Link>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            Generate and dispatch professional PDF invoices, configure multi-currency rates, and manage payment links.
          </p>

          <Link
            href="/finance/invoices"
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black text-center shadow-md shadow-violet-600/30 transition block"
          >
            Open Invoicing Console
          </Link>
        </div>
      </div>
    </div>
  );
}
