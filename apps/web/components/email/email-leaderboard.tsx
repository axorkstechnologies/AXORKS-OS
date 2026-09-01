"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  Trophy,
  Crown,
  Medal,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  Star,
  Users,
} from "lucide-react";

export function EmailLeaderboard() {
  const { data: leaderboardData, isLoading } = useQuery<any>({
    queryKey: ["email-leaderboard"],
    queryFn: () => apiClient("/api/v1/email/analytics?view=leaderboard"),
  });

  const rawList = Array.isArray(leaderboardData)
    ? leaderboardData
    : Array.isArray((leaderboardData as any)?.data)
    ? (leaderboardData as any).data
    : [
    {
      id: "1",
      name: "Farwa",
      role: "Marketing Specialist",
      points: 240,
      emails_sent: 48,
      replies_received: 14,
      conversion_rate: "29.1%",
      badge: "🥇 Outreach Champion",
    },
    {
      id: "2",
      name: "Furqan Khalid",
      role: "Marketing Specialist",
      points: 195,
      emails_sent: 39,
      replies_received: 9,
      conversion_rate: "23.0%",
      badge: "🥈 Top Negotiator",
    },
    {
      id: "3",
      name: "Farhana Bakht",
      role: "Co-Founder",
      points: 180,
      emails_sent: 36,
      replies_received: 8,
      conversion_rate: "22.2%",
      badge: "🥉 Pipeline Driver",
    },
    {
      id: "4",
      name: "Muhammad Mujahid",
      role: "Founder",
      points: 150,
      emails_sent: 30,
      replies_received: 12,
      conversion_rate: "40.0%",
      badge: "⭐ Deal Closer",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top 3 Champions Podium Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rawList.slice(0, 3).map((item: any, idx: number) => (
          <div
            key={item.id}
            className={`p-6 rounded-3xl border relative overflow-hidden flex flex-col justify-between space-y-4 shadow-md ${
              idx === 0
                ? "bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-950 border-amber-300 dark:border-amber-500/40"
                : idx === 1
                ? "bg-gradient-to-b from-slate-100 to-white dark:from-slate-900/40 dark:to-slate-950 border-slate-300 dark:border-slate-700"
                : "bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-950 border-orange-300 dark:border-orange-500/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                  idx === 0
                    ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
                    : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                }`}
              >
                {item.points} Points
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{item.name}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{item.role}</p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Outreach Sent</span>
                <span className="font-bold text-slate-900 dark:text-white">{item.emails_sent}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Conversion</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{item.conversion_rate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Team Outreach Performance & Points
          </h3>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Auto-scored per email dispatch</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Rank & Member</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Points</th>
                <th className="p-3.5">Sent</th>
                <th className="p-3.5">Replies</th>
                <th className="p-3.5">Conversion</th>
                <th className="p-3.5 text-right">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rawList.map((row: any, i: number) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 font-mono text-slate-500 dark:text-slate-400 font-bold">#{i + 1}</span>
                    <span>{row.name}</span>
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">{row.role}</td>
                  <td className="p-3.5 font-mono font-bold text-violet-700 dark:text-violet-300">{row.points} pts</td>
                  <td className="p-3.5 font-mono text-slate-800 dark:text-slate-200">{row.emails_sent}</td>
                  <td className="p-3.5 font-mono text-emerald-700 dark:text-emerald-400 font-bold">{row.replies_received}</td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">{row.conversion_rate}</td>
                  <td className="p-3.5 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                      {row.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
