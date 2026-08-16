"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  X,
  Building2,
} from "lucide-react";

export default function ProjectsListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["projects", page],
    queryFn: () => apiClient(`/api/v1/projects?page=${page}&per_page=50`),
  });

  const projects = data?.data || [];
  const total = projects.length || data?.meta?.total || 0;

  const createProject = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/projects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          client_name: clientName.trim() || "Internal",
          budget: budget ? parseFloat(budget) : null,
          status,
        }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully!");
      setShowCreate(false);
      setName("");
      setClientName("");
      setBudget("");
      if (res?.data?.id) {
        router.push(`/projects/${res.data.id}/board`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create project");
    },
  });

  const filteredProjects = projects.filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.client_name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    active: { label: "In Progress", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    in_progress: { label: "In Progress", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    planning: { label: "Planning", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
    on_hold: { label: "On Hold", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
    completed: { label: "Completed", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Project Operations & Delivery</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20">
              {total} Projects
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise delivery tracking, agile Kanban boards, and milestone budgets
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, client, or stack..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 transition"
          />
        </div>
      </div>

      {/* Create Project Modal Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full glass p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-violet-500" /> Initialize New Project
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Next-Gen Enterprise SaaS Portal"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Client / Organization</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Acme Corp UK"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="25000"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-violet-500"
                  >
                    <option value="active">Active (In Progress)</option>
                    <option value="planning">Planning</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
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
                onClick={() => createProject.mutate()}
                disabled={!name.trim() || createProject.isPending}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition disabled:opacity-50"
              >
                {createProject.isPending ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 font-mono">
            Loading Neon DB projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full py-16 text-center glass rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto">
              <FolderKanban className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No projects found</p>
            <p className="text-xs text-slate-400">Click "New Project" to initiate your first engagement.</p>
          </div>
        ) : (
          filteredProjects.map((p: any) => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.planning;

            return (
              <div
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}/board`)}
                className="glass-card p-6 rounded-2xl cursor-pointer space-y-4 group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
                          {p.name}
                        </h2>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {p.client_name || "Internal Agency"}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {p.description || "Full-lifecycle enterprise software engineering and cloud deployment."}
                  </p>
                </div>

                <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-200">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{p.budget ? Number(p.budget).toLocaleString() : "Flexible"}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-400 font-bold group-hover:translate-x-1 transition-transform">
                    <span>Open Board</span>
                    <ArrowRight className="w-3 h-3" />
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
