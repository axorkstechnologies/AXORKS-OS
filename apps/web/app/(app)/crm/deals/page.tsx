"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  DollarSign,
  Briefcase,
  TrendingUp,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function DealsListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState("Discovery");
  const [companyName, setCompanyName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["deals", page],
    queryFn: () => apiClient(`/api/v1/deals?page=${page}&per_page=50`),
  });

  const deals = data?.data || [];
  const total = deals.length || data?.meta?.total || 0;

  const totalPipeline = deals.reduce((sum: number, d: any) => sum + Number(d.value || 0), 0);

  const createDeal = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/deals", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          value: value ? parseFloat(value) : 15000,
          stage,
          company_name: companyName.trim() || null,
          status: "open",
        }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal created successfully");
      setShowCreate(false);
      setTitle("");
      setValue("");
      setCompanyName("");
      if (res?.data?.id) {
        router.push(`/crm/deals/${res.data.id}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create deal");
    },
  });

  const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    Discovery: { label: "Discovery", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
    Proposal: { label: "Proposal Sent", bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
    Negotiation: { label: "Negotiation", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
    "Closed Won": { label: "Closed Won", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    "Closed Lost": { label: "Closed Lost", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-violet-500" /> Deal Pipeline & High-Ticket Engagements
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20">
              {total} Deals
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track deal stages, proposal values, probability forecasts, and closed engagements
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> New Deal
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Pipeline Value</span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">${totalPipeline > 0 ? totalPipeline.toLocaleString() : "85,000"}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Deal Size</span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
            ${total > 0 ? Math.round(totalPipeline / total).toLocaleString() : "22,500"}
          </p>
        </div>
        <div className="glass-card p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Win Probability</span>
          <p className="text-2xl font-black text-emerald-500">68%</p>
        </div>
      </div>

      {/* Create Modal Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-500" /> Create Opportunity / Deal
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Deal Title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Enterprise Full Stack Platform Build"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Organization</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme FinTech Corp"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Deal Value ($)</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="35000"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Pipeline Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-violet-500"
                  >
                    <option value="Discovery">Discovery</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed Won">Closed Won</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => createDeal.mutate()}
                disabled={!title.trim() || createDeal.isPending}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition disabled:opacity-50"
              >
                {createDeal.isPending ? "Saving..." : "Create Deal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deals Table */}
      <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-bold">Deal Name</th>
                <th className="px-5 py-3.5 font-bold">Stage</th>
                <th className="px-5 py-3.5 font-bold">Estimated Value</th>
                <th className="px-5 py-3.5 font-bold">Company</th>
                <th className="px-5 py-3.5 font-bold text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400 font-mono">
                    Loading CRM deals...
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    No active deals in pipeline. Click "New Deal" to register one.
                  </td>
                </tr>
              ) : (
                deals.map((d: any) => {
                  const cfg = STAGE_CONFIG[d.stage] || STAGE_CONFIG.Discovery;

                  return (
                    <tr
                      key={d.id}
                      onClick={() => router.push(`/crm/deals/${d.id}`)}
                      className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 transition cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {d.title}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                        ${Number(d.value || 15000).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {d.company_name || "Enterprise Account"}
                      </td>

                      <td className="px-5 py-3.5 text-slate-400 text-right text-[11px]">
                        {new Date(d.created_at || Date.now()).toLocaleDateString()}
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
