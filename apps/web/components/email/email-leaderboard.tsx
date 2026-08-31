"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  Crown,
  Trophy,
  Award,
  Sparkles,
  Flame,
  Send,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { EmailAnalyticsReport, EmployeeEmailMetric } from "@/lib/email/constants";

export function EmailLeaderboard() {
  const { user: currentUser } = useAuthStore();
  const isExecutive = currentUser?.role === "Founder" || currentUser?.role === "Co-Founder";

  const { data: response, isLoading } = useQuery<{ success: boolean; data: EmailAnalyticsReport }>({
    queryKey: ["email-analytics"],
    queryFn: () => apiClient("/api/v1/email/analytics"),
  });

  const report = response?.data || (response as any);
  const employees: EmployeeEmailMetric[] = report?.employees || [];
  const executiveMetrics: EmployeeEmailMetric[] = report?.executive_metrics || [];
  const highPerformerDay = report?.high_performer_day;
  const highPerformerMonth = report?.high_performer_month;

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400 font-mono">
        Loading performance leaderboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Private Executive Metrics (Visible Only to Founder & Co-Founder) */}
      {isExecutive && executiveMetrics.length > 0 && (
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-violet-500/40 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-violet-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-400" /> Private Executive Achievements (Founder & Co-Founder)
            </h3>
            <span className="text-[10px] text-violet-300 font-mono font-bold">Excluded from Public Employee Competition</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {executiveMetrics.map((exec) => (
              <div
                key={exec.user_id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-between text-xs shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-600/30 text-violet-200 border border-violet-500/40 flex items-center justify-center font-black">
                    {exec.user_name[0] || "E"}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{exec.user_name}</span>
                    <span className="text-[11px] text-slate-300 font-medium">{exec.role}</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-black text-violet-300 block">{exec.score} pts</span>
                  <span className="text-[10px] text-slate-400">{exec.total_sent} sent • {exec.converted_clients} deals</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Performer Spotlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* High Performer of the Day */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-amber-950/60 via-slate-900/90 to-slate-950 border border-amber-500/50 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-xs">
                <Crown className="w-5 h-5 animate-bounce text-amber-400" />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">High Performer of the Day</h3>
                <p className="text-[11px] text-slate-300 font-medium">Top outreach & follow-up momentum</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/25 text-amber-200 border border-amber-500/40 flex items-center gap-1 shadow-xs">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Live Winner
            </span>
          </div>

          {highPerformerDay ? (
            <div className="flex items-center justify-between pt-2 border-t border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-amber-300 font-black text-lg">
                    {highPerformerDay.user_name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{highPerformerDay.user_name}</h4>
                  <p className="text-xs text-slate-300 font-medium">{highPerformerDay.role}</p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xl font-black text-amber-300 block">{highPerformerDay.score} pts</span>
                <span className="text-[11px] text-slate-300 font-medium">
                  {highPerformerDay.total_sent} sent • {highPerformerDay.converted_clients} deals
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center font-mono font-medium">No outreach logged today yet</p>
          )}
        </div>

        {/* High Performer of the Month */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-violet-950/60 via-slate-900/90 to-slate-950 border border-violet-500/50 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-violet-500/25 text-violet-300 border border-violet-500/40 shadow-xs">
                <Trophy className="w-5 h-5 text-violet-400" />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-violet-300">High Performer of the Month</h3>
                <p className="text-[11px] text-slate-300 font-medium">Overall conversion & client impact</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-violet-500/25 text-violet-200 border border-violet-500/40 flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Champion
            </span>
          </div>

          {highPerformerMonth ? (
            <div className="flex items-center justify-between pt-2 border-t border-violet-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-violet-300 font-black text-lg">
                    {highPerformerMonth.user_name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{highPerformerMonth.user_name}</h4>
                  <p className="text-xs text-slate-300 font-medium">{highPerformerMonth.role}</p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xl font-black text-violet-300 block">{highPerformerMonth.score} pts</span>
                <span className="text-[11px] text-slate-300 font-medium">
                  {highPerformerMonth.total_sent} sent • {highPerformerMonth.converted_clients} deals
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center font-mono font-medium">No monthly performance data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
