"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, DollarSign, Briefcase } from "lucide-react";

export default function DealsListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["deals", page],
    queryFn: () => apiClient(`/api/v1/deals?page=${page}&per_page=25`),
  });

  const deals = data?.data || [];
  const total = data?.meta?.total || 0;

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState("Discovery");

  const createDeal = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/deals", {
        method: "POST",
        body: JSON.stringify({
          title,
          value: value ? parseFloat(value) : null,
          stage,
          status: "open",
        }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal created");
      setShowCreate(false);
      setTitle("");
      setValue("");
      router.push(`/crm/deals/${res.data.id}`);
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Deals</h1>
          <p className="text-xs text-slate-500 mt-0.5">{total} deals</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition">
          <Plus className="w-3.5 h-3.5" /> New Deal
        </button>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 max-w-md space-y-3">
          <h2 className="text-sm font-semibold text-white">Create Deal</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deal title" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500" />
          <div className="grid grid-cols-2 gap-2">
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value ($)" type="number" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500" />
            <select value={stage} onChange={(e) => setStage(e.target.value)} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200">
              <option value="Discovery">Discovery</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closed Won">Closed Won</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 rounded bg-slate-800 text-slate-400 text-xs">Cancel</button>
            <button onClick={() => createDeal.mutate()} disabled={!title.trim()} className="px-4 py-1.5 rounded bg-violet-600 text-white text-xs disabled:opacity-50">Create</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-900/60 border-b border-slate-800">
            <tr>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Deal</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Value</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Stage</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : deals.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No deals yet</td></tr>
            ) : (
              deals.map((d: any) => (
                <tr key={d.id} className="hover:bg-slate-900/40 transition cursor-pointer" onClick={() => router.push(`/crm/deals/${d.id}`)}>
                  <td className="px-4 py-3 font-medium text-slate-200">{d.title}</td>
                  <td className="px-4 py-3 text-slate-300 font-semibold">{d.value ? `${d.currency || '$'} ${Number(d.value).toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{d.stage || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      d.status === "won" ? "bg-emerald-500/10 text-emerald-400" :
                      d.status === "lost" ? "bg-red-500/10 text-red-400" :
                      "bg-violet-500/10 text-violet-400"
                    }`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
