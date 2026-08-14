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
      {/* Top Header & Quick Compose Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Mail className="w-6 h-6 text-violet-600 dark:text-violet-400" /> Enterprise Email Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Internal business communication engine powered by verified Resend infrastructure (hello@axorks.com).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/email/followups"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Follow-up Queue
          </Link>
          <Link
            href="/email/templates"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-violet-500" /> Templates
          </Link>
          <Link
            href="/email/history"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <History className="w-3.5 h-3.5 text-blue-500" /> Logs & History
          </Link>
          <Link
            href="/email/compose"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-600/30 transition"
          >
            <Plus className="w-4 h-4" /> Compose Email
          </Link>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Emails Sent Today</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {analytics?.sentToday ?? 0}
            </div>
            <div className="text-[10px] text-emerald-500 font-medium flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> Resend Live API
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Delivered (This Week)</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {analytics?.totalSent ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">100% Success Rate</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Bounce / Failed</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {analytics?.failedEmails ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Bounce Rate: {analytics?.bounceRate ?? "0%"}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-500">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Templates</div>
            <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-400 mt-1">11</div>
            <div className="text-[10px] text-slate-400 mt-1">Sales, Projects, Finance</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <LayoutTemplate className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Sent Email Table */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-violet-500" /> Recent Email Activity
          </h2>
          <Link href="/email/history" className="text-xs font-semibold text-violet-600 hover:underline">
            View All Logs →
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading email logs...</div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No emails sent yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Sent By</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{item.recipient}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{item.subject}</td>
                    <td className="p-3 text-slate-500">{item.sentBy}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === "Sent"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                        }`}
                      >
                        {item.status === "Sent" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
