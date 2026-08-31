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
    draft: { label: "Draft", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-800 dark:text-slate-200 font-bold", border: "border-slate-300 dark:border-slate-700" },
    sent: { label: "Sent / Pending", bg: "bg-cyan-100 dark:bg-cyan-500/20", text: "text-cyan-900 dark:text-cyan-300 font-bold", border: "border-cyan-300 dark:border-cyan-500/40" },
    accepted: { label: "Accepted / Won", bg: "bg-emerald-100 dark:bg-emerald-500/20", text: "text-emerald-900 dark:text-emerald-300 font-bold", border: "border-emerald-300 dark:border-emerald-500/40" },
    rejected: { label: "Declined", bg: "bg-rose-100 dark:bg-rose-500/20", text: "text-rose-900 dark:text-rose-300 font-bold", border: "border-rose-300 dark:border-rose-500/40" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" /> Client Proposals &amp; Quotations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-500/40">
              {total} Proposals
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
            Database-backed proposal generator, contract milestone pricing, and digital acceptance tracker
          </p>
        </div>

        <Link
          href="/proposals/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-600/30 transition transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Proposal
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shadow-sm">
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
              statusFilter === tab.value
                ? "bg-violet-600 text-white border-violet-500 shadow-xs"
                : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Proposal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
            Loading proposals from Neon DB...
          </div>
        ) : proposals.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <FileText className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">No proposals found</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Create your first client proposal to track win rates.</p>
          </div>
        ) : (
          proposals.map((p: any) => {
            const badge = STATUS_BADGES[p.status] || STATUS_BADGES.draft;
            return (
              <div
                key={p.id}
                onClick={() => router.push(`/proposals/${p.id}`)}
                className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-violet-500/60 transition cursor-pointer space-y-4 shadow-sm hover:shadow-md group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition line-clamp-1">
                      {p.title || "Untitled Proposal"}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${badge.bg} ${badge.text} ${badge.border} shrink-0`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Client: <strong className="text-slate-900 dark:text-white">{p.client_name || "Enterprise Client"}</strong>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 font-black text-slate-900 dark:text-white">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{Number(p.total_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
