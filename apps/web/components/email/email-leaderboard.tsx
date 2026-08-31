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
import { type EmailAnalyticsReport, type EmployeeEmailMetric } from "@/lib/email/constants";

export function EmailLeaderboard() {
  const { data: response, isLoading } = useQuery<{ success: boolean; data: EmailAnalyticsReport }>({
    queryKey: ["email-analytics"],
    queryFn: () => apiClient("/api/v1/email/analytics"),
  });

  const report = response?.data || (response as any);
  const employees: EmployeeEmailMetric[] = report?.employees || [];
  const highPerformerDay = report?.high_performer_day;
  const highPerformerMonth = report?.high_performer_month;

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 font-mono">
        Loading performance leaderboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* High Performer Spotlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* High Performer of the Day */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-950 border border-amber-500/40 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Crown className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">High Performer of the Day</h3>
                <p className="text-[11px] text-slate-400">Top outreach & follow-up momentum</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> Live Winner
            </span>
          </div>

          {highPerformerDay ? (
            <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-amber-400 font-bold text-base">
                    {highPerformerDay.user_name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{highPerformerDay.user_name}</h4>
                  <p className="text-xs text-slate-400">{highPerformerDay.role}</p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-lg font-bold text-amber-400 block">{highPerformerDay.score} pts</span>
                <span className="text-[10px] text-slate-400">
                  {highPerformerDay.total_sent} sent • {highPerformerDay.converted_clients} deals
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center font-mono">No outreach logged today yet</p>
          )}
        </div>

        {/* High Performer of the Month */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-violet-950/40 via-slate-900/80 to-slate-950 border border-violet-500/40 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
                <Trophy className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400">High Performer of the Month</h3>
                <p className="text-[11px] text-slate-400">Overall conversion & client impact</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-400" /> Champion
            </span>
          </div>

          {highPerformerMonth ? (
            <div className="flex items-center justify-between pt-2 border-t border-violet-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-violet-300 font-bold text-base">
                    {highPerformerMonth.user_name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{highPerformerMonth.user_name}</h4>
                  <p className="text-xs text-slate-400">{highPerformerMonth.role}</p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-lg font-bold text-violet-300 block">{highPerformerMonth.score} pts</span>
                <span className="text-[10px] text-slate-400">
                  {highPerformerMonth.total_sent} sent • {highPerformerMonth.converted_clients} deals
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center font-mono">No records for current month</p>
          )}
        </div>
      </div>

      {/* Podium Top 3 */}
      {employees.length >= 3 && (
        <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="text-center max-w-sm mx-auto mb-6">
            <h3 className="text-sm font-bold text-slate-200">Outreach Champions Podium</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by verified client deals and follow-up persistence</p>
          </div>

          <div className="grid grid-cols-3 gap-3 items-end max-w-2xl mx-auto pt-4">
            {/* 2nd Place */}
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border-2 border-slate-400 mx-auto flex items-center justify-center text-slate-200 font-bold text-xs shadow-md">
                🥈
              </div>
              <p className="text-xs font-bold text-slate-200 truncate">{employees[1].user_name}</p>
              <div className="h-20 rounded-2xl bg-slate-900 border border-slate-700/80 p-3 flex flex-col justify-center">
                <span className="text-sm font-bold text-slate-300 font-mono">{employees[1].score} pts</span>
                <span className="text-[10px] text-slate-500">{employees[1].converted_clients} deals</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-300 font-bold text-sm shadow-lg shadow-amber-500/20">
                🥇
              </div>
              <p className="text-xs font-bold text-amber-400 truncate">{employees[0].user_name}</p>
              <div className="h-28 rounded-2xl bg-gradient-to-b from-amber-950/30 to-slate-900 border border-amber-500/40 p-3 flex flex-col justify-center">
                <span className="text-base font-bold text-amber-300 font-mono">{employees[0].score} pts</span>
                <span className="text-[10px] text-amber-400/80">{employees[0].converted_clients} deals • 👑 1st</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border-2 border-amber-700/80 mx-auto flex items-center justify-center text-amber-600 font-bold text-xs shadow-md">
                🥉
              </div>
              <p className="text-xs font-bold text-slate-200 truncate">{employees[2].user_name}</p>
              <div className="h-16 rounded-2xl bg-slate-900 border border-slate-700/80 p-3 flex flex-col justify-center">
                <span className="text-sm font-bold text-slate-300 font-mono">{employees[2].score} pts</span>
                <span className="text-[10px] text-slate-500">{employees[2].converted_clients} deals</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules & Motivation Card */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Scoring formula:</strong> Outbound Email (+1 pt) • Follow-up (+2 pts) • Converted Client (+10 pts)
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Calculated in real-time</span>
      </div>
    </div>
  );
}
