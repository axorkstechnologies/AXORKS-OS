"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Building2, Plus, Search, Globe, MapPin, Users,
  MoreHorizontal, Trash2,
} from "lucide-react";

export default function CompaniesListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["companies", page, search],
    queryFn: () => apiClient(`/api/v1/companies?page=${page}&per_page=25${search ? `&search=${search}` : ""}`),
  });

  const companies = data?.data || [];
  const total = data?.meta?.total || 0;

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  const createCompany = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/companies", {
        method: "POST",
        body: JSON.stringify({ name: newName, website: newWebsite || null, industry: newIndustry || null }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company created");
      setShowCreate(false);
      setNewName("");
      setNewWebsite("");
      setNewIndustry("");
      router.push(`/crm/companies/${res.data.id}`);
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Companies</h1>
          <p className="text-xs text-slate-500 mt-0.5">{total} companies</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition">
          <Plus className="w-3.5 h-3.5" /> New Company
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search companies..."
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 max-w-md space-y-3">
          <h2 className="text-sm font-semibold text-white">Create Company</h2>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Company name" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500" />
          <input value={newWebsite} onChange={(e) => setNewWebsite(e.target.value)} placeholder="Website (optional)" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500" />
          <input value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} placeholder="Industry (optional)" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 rounded bg-slate-800 text-slate-400 text-xs">Cancel</button>
            <button onClick={() => createCompany.mutate()} disabled={!newName.trim()} className="px-4 py-1.5 rounded bg-violet-600 text-white text-xs disabled:opacity-50">Create</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-900/60 border-b border-slate-800">
            <tr>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Company</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Industry</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Website</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Country</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No companies yet</td></tr>
            ) : (
              companies.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-900/40 transition cursor-pointer" onClick={() => router.push(`/crm/companies/${c.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white text-[10px] font-bold">
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-200">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.industry || "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{c.website || "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{c.country || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex justify-center gap-2 pt-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-xs disabled:opacity-40">Previous</button>
          <span className="text-xs text-slate-500 self-center">Page {page}</span>
          <button disabled={page * 25 >= total} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-xs disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
