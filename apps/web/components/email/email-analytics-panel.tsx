"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  TrendingUp,
  Send,
  Mail,
  Clock,
  CheckCircle2,
  Users,
  Award,
  Crown,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { type EmailAnalyticsReport } from "@/lib/email/constants";

export function EmailAnalyticsPanel() {
  const { data: response, isLoading, refetch } = useQuery<{ success: boolean; data: EmailAnalyticsReport }>({
    queryKey: ["email-analytics"],
    queryFn: () => apiClient("/api/v1/email/analytics"),
  });

  const report = response?.data || (response as any);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-violet-400" /> Computing advanced email analytics from Neon DB...
      </div>
    );
  }

  const overview = report?.overview || {
    total_emails_sent: 0,
    total_emails_received: 0,
    total_followups_sent: 0,
    total_conversions: 0,
    overall_conversion_rate: 0,
  };

  const aliases = report?.aliases || [];
  const employees = report?.employees || [];

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Total Sent</span>
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">{overview.total_emails_sent}</p>
          <span className="text-[10px] text-slate-400 font-medium">Outbound dispatches</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Total Received</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">{overview.total_emails_received}</p>
          <span className="text-[10px] text-slate-400 font-medium">Inbound to aliases</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Follow-ups Sent</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2 font-mono">{overview.total_followups_sent}</p>
          <span className="text-[10px] text-slate-400 font-medium">Automated & manual</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Converted Clients</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-2 font-mono">{overview.total_conversions}</p>
          <span className="text-[10px] text-slate-400 font-medium">Lead → Client deals</span>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-violet-950/60 to-slate-900/80 border border-violet-500/40 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-200">Conversion Rate</span>
            <div className="w-7 h-7 rounded-lg bg-violet-500/30 text-violet-200 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">{overview.overall_conversion_rate}%</p>
          <span className="text-[10px] text-violet-300 font-semibold">Aggregate performance</span>
        </div>
      </div>

      {/* Per-Alias Breakdown Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-violet-400" /> Google Workspace Alias Performance
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Live Sync from Neon DB</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {aliases
            .filter((a: any) => a.alias !== "muhammad.mujahid@axorks.com")
            .map((alias: any) => (
              <div
                key={alias.alias}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-white">
                    {alias.alias}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-300">
                    {alias.conversion_rate}% Conv.
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Sent</span>
                    <span className="text-sm font-black text-white">{alias.total_sent}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Follow-ups</span>
                    <span className="text-sm font-black text-amber-300">{alias.followups_sent}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Deals</span>
                    <span className="text-sm font-black text-emerald-300">{alias.converted_clients}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Per-Employee Performance Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Team Member Email & Conversion Leaderboard
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono font-medium">Ranked by Activity & Conversion Score</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-200 border-b border-slate-700 font-bold">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 text-center">Emails Sent</th>
                <th className="p-3.5 text-center">Follow-ups</th>
                <th className="p-3.5 text-center">Converted Clients</th>
                <th className="p-3.5 text-center">Conversion Rate</th>
                <th className="p-3.5 text-right">Performance Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {employees.map((emp: any, index: number) => (
                <tr key={emp.user_id} className="hover:bg-slate-900/50 transition">
                  <td className="p-3.5 font-bold text-white font-sans flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center font-bold text-xs">
                      {index + 1}
                    </span>
                    {emp.user_name}
                  </td>
                  <td className="p-3.5 text-slate-300 font-sans">{emp.role}</td>
                  <td className="p-3.5 text-center text-slate-100 font-bold">{emp.total_sent}</td>
                  <td className="p-3.5 text-center text-amber-300 font-bold">{emp.followups_sent}</td>
                  <td className="p-3.5 text-center text-emerald-300 font-bold">{emp.converted_clients}</td>
                  <td className="p-3.5 text-center text-violet-300 font-bold">{emp.conversion_rate}%</td>
                  <td className="p-3.5 text-right font-black text-white">{emp.score} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
