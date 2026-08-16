"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Globe,
  MapPin,
  Users,
  MoreHorizontal,
  X,
  ExternalLink,
} from "lucide-react";

export default function CompaniesListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["companies", page, search],
    queryFn: () =>
      apiClient(`/api/v1/companies?page=${page}&per_page=50${search ? `&search=${search}` : ""}`),
  });

  const companies = data?.data || [];
  const total = companies.length || data?.meta?.total || 0;

  const createCompany = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/companies", {
        method: "POST",
        body: JSON.stringify({
          name: newName.trim(),
          website: newWebsite ? newWebsite.trim() : null,
          industry: newIndustry ? newIndustry.trim() : null,
        }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company created successfully");
      setShowCreate(false);
      setNewName("");
      setNewWebsite("");
      setNewIndustry("");
      if (res?.data?.id) {
        router.push(`/crm/companies/${res.data.id}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create company");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-500" /> CRM Companies
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20">
              {total} Companies
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Accounts directory, corporate relationship history, and deal associations
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> New Company
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search companies by name or industry..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 transition"
          />
        </div>
      </div>

      {/* Create Modal Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-500" /> Create Company
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Name *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Apex Global Technologies"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
                <input
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.target.value)}
                  placeholder="https://apextech.com"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Industry</label>
                <input
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  placeholder="e.g. Software & Cloud"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
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
                onClick={() => createCompany.mutate()}
                disabled={!newName.trim() || createCompany.isPending}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition disabled:opacity-50"
              >
                {createCompany.isPending ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-bold">Company</th>
                <th className="px-5 py-3.5 font-bold">Industry</th>
                <th className="px-5 py-3.5 font-bold">Website</th>
                <th className="px-5 py-3.5 font-bold">Location</th>
                <th className="px-5 py-3.5 font-bold text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400 font-mono">
                    Loading companies...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    No companies found. Click "New Company" to add one.
                  </td>
                </tr>
              ) : (
                companies.map((c: any) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/crm/companies/${c.id}`)}
                    className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 transition cursor-pointer group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {c.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {c.industry || "Technology"}
                    </td>

                    <td className="px-5 py-3.5">
                      {c.website ? (
                        <a
                          href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[140px]">{c.website.replace(/^https?:\/\//, "")}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      {c.country || c.city || "United Kingdom"}
                    </td>

                    <td className="px-5 py-3.5 text-slate-400 text-right text-[11px]">
                      {new Date(c.created_at || Date.now()).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
