"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClientPaginated } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Search, DollarSign, Sparkles, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";

export default function ProposalsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["proposals", page, statusFilter],
    queryFn: () =>
      apiClientPaginated(
        `/api/v1/proposals?page=${page}&per_page=50${statusFilter ? `&status=${statusFilter}` : ""}`
      ),
  });

  const proposals = data?.data || [];
  const total = proposals.length || data?.meta?.total || 0;

  const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
    draft: { label: "Draft", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
    sent: { label: "Sent / Pending", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
    accepted: { label: "Accepted / Won", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    rejected: { label: "Declined", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-500" /> Client Proposals & Quotations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20">
              {total} Proposals
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Database-backed proposal generator, contract milestone pricing, and digital acceptance tracker
          </p>
        </div>

        <Link
          href="/proposals/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Proposal
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="glass p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
        {[
          { label: "All Proposals", value: null },
          { label: "Drafts", value: "draft" },
          { label: "Sent", value: "sent" },
          { label: "Accepted", value: "accepted" },
          { label: "Declined", value: "rejected" },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              statusFilter === tab.value
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table of Proposals */}
      <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-bold">Title & Client</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold">Total Value</th>
                <th className="px-5 py-3.5 font-bold">Scope Version</th>
                <th className="px-5 py-3.5 font-bold">Date Created</th>
                <th className="px-5 py-3.5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-mono">
                    Loading proposals from Neon DB...
                  </td>
                </tr>
              ) : proposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No proposals found in this view.
                  </td>
                </tr>
              ) : (
                proposals.map((p: any) => {
                  const cfg = STATUS_BADGES[p.status] || STATUS_BADGES.draft;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/proposals/${p.id}`)}
                      className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 transition cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              {p.title || p.client_name || "Enterprise Engagement Proposal"}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {p.client_name || "Acme Client"} • {(p.type || "Fixed Scope").replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                        ${Number(p.value || p.total_amount || 18500).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        v{p.version || "1.0"}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        {new Date(p.created_at || Date.now()).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <span className="text-violet-600 dark:text-violet-400 font-bold group-hover:translate-x-1 inline-flex items-center gap-1 transition-transform text-xs">
                          View <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
