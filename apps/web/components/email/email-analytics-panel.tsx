"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  TrendingUp,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  Target,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Users,
  Activity,
  Layers,
} from "lucide-react";

export function EmailAnalyticsPanel() {
  const { data: analyticsResponse, isLoading } = useQuery<any>({
    queryKey: ["email-analytics"],
    queryFn: () => apiClient("/api/v1/email/analytics"),
  });

  const rawStats = (analyticsResponse as any)?.stats
    ? analyticsResponse
    : (analyticsResponse as any)?.data?.stats
    ? (analyticsResponse as any).data
    : null;

  const analytics = rawStats || {
    stats: {
      total_inbound: 0,
      total_outbound: 0,
      total_leads_contacted: 0,
      total_replies: 0,
      response_rate: "0.0%",
    },
    alias_breakdown: [],
    recent_outreach: [],
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
        Aggregating email outreach analytics from Neon DB...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top 4 Performance Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outbound */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Outbound Dispatched</span>
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/40">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics.stats.total_outbound}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Across all 4 active company aliases
          </p>
        </div>

        {/* Inbound */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Inbound Received</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics.stats.total_inbound}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Synced via Google Workspace Gmail API
          </p>
        </div>

        {/* Leads Contacted */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">CRM Leads Contacted</span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics.stats.total_leads_contacted}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Directly mapped to sales pipeline
          </p>
        </div>

        {/* Response Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Outreach Reply Rate</span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics.stats.response_rate}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Based on client email conversations
          </p>
        </div>
      </div>

      {/* Alias Breakdown Cards */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Alias Activity & Routing Breakdown
          </h3>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">axorks.com Workspace</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(analytics.alias_breakdown || []).map((item: any) => (
            <div
              key={item.alias}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                  {item.alias}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800 font-medium">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  Rec: {item.received}
                </span>
                <span className="text-violet-700 dark:text-violet-400 font-bold">
                  Sent: {item.sent}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
