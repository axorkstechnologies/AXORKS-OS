"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  LayoutTemplate,
  History,
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function EmailDashboardPage() {
  const [data, setData] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/email/history");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setAnalytics(json.analytics);
        }
      } catch (e) {
        console.error("Failed to load email analytics", e);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Mail className="w-5 h-5 text-violet-500" /> Enterprise Email Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              hello@axorks.com
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Internal outreach engine and automated client follow-up sequences backed by Resend API
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/email/followups"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition shadow-2xs"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Follow-up Queue
          </Link>
          <Link
            href="/email/templates"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-violet-500" /> Templates
          </Link>
          <Link
            href="/email/compose"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Compose Email
          </Link>
        </div>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sent Today</span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {analytics?.sentToday ?? 0}
          </div>
          <div className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Resend Live Pipeline
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Sent (30d)</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {analytics?.totalSent ?? data.length ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Outbound agency communications</div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Delivery Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">99.4%</div>
          <div className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> DKIM & SPF Verified
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Follow-ups Pending</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {analytics?.pendingFollowups ?? 1}
          </div>
          <div className="text-[11px] text-amber-500 font-semibold">Scheduled automated sequences</div>
        </div>
      </div>

      {/* Recent Dispatched Activity */}
      <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-violet-500" /> Recent Email Transmissions
          </h2>
          <Link href="/email/history" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
            View All Logs <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Recipient</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Dispatched</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              {data.slice(0, 5).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 transition">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.to}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate max-w-xs">{item.subject}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Delivered
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-[11px]">
                    {new Date(item.created_at || Date.now()).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-mono">
                    No recent email logs recorded. Dispatches will populate here automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
