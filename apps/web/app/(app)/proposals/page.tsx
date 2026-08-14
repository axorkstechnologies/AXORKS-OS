"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClientPaginated } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

export default function ProposalsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["proposals", page, statusFilter],
    queryFn: () =>
      apiClientPaginated(
        `/api/v1/proposals?page=${page}&per_page=25${statusFilter ? `&status=${statusFilter}` : ""}`
      ),
  });

  const proposals = data?.data || [];
  const total = data?.meta?.total || 0;

  const STATUS_BADGES: Record<string, string> = {
    draft: "bg-slate-800 text-slate-400 border-slate-700",
    sent: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Proposals & Quotations</h1>
          <p className="text-xs text-slate-500 mt-0.5">{total} proposals created</p>
        </div>
        <Link
          href="/proposals/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition"
        >
          <Plus className="w-3.5 h-3.5" /> Create Proposal
        </Link>
      </div>

      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          {[
            { label: "All", value: null },
            { label: "Drafts", value: "draft" },
            { label: "Sent", value: "sent" },
            { label: "Accepted", value: "accepted" },
            { label: "Rejected", value: "rejected" },
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === tab.value
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/40"
                  : "text-slate-400 hover:bg-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-900/60 border-b border-slate-800">
            <tr>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Title & Type</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Total Value</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Version</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading proposals...</td></tr>
            ) : proposals.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No proposals found</td></tr>
            ) : (
              proposals.map((p: any) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-900/40 transition cursor-pointer"
                  onClick={() => router.push(`/proposals/${p.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                      <div>
                        <span className="font-medium text-slate-200 block">{p.title || p.client_name || "Proposal"}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{(p.type || "proposal").replace("_", " ")}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_BADGES[p.status] || STATUS_BADGES.draft}`}>
                      {p.status || "draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-200 font-bold">
                    {(p.total_value || p.value) ? `${p.currency || "USD"} ${Number(p.total_value || p.value).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400">v{p.version || 1}</td>
                  <td className="px-4 py-3 text-slate-500">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
