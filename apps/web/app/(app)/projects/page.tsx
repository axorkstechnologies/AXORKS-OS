"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderKanban, Plus, Search, Calendar, DollarSign, Users } from "lucide-react";

export default function ProjectsListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("planning");

  const { data, isLoading } = useQuery({
    queryKey: ["projects", page],
    queryFn: () => apiClient(`/api/v1/projects?page=${page}&per_page=25`),
  });

  const projects = data?.data || [];
  const total = data?.meta?.total || 0;

  const createProject = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/projects", {
        method: "POST",
        body: JSON.stringify({
          name,
          budget: budget ? parseFloat(budget) : null,
          status,
        }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      setShowCreate(false);
      setName("");
      setBudget("");
      router.push(`/projects/${res.data.id}/board`);
    },
  });

  const STATUS_BADGES: Record<string, string> = {
    planning: "bg-slate-800 text-slate-400 border-slate-700",
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    on_hold: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    completed: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Projects</h1>
          <p className="text-xs text-slate-500 mt-0.5">{total} active projects</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition"
        >
          <Plus className="w-3.5 h-3.5" /> New Project
        </button>
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 max-w-md space-y-3">
          <h2 className="text-sm font-semibold text-white">Create Project</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Budget ($)"
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 rounded bg-slate-800 text-slate-400 text-xs">Cancel</button>
            <button onClick={() => createProject.mutate()} disabled={!name.trim()} className="px-4 py-1.5 rounded bg-violet-600 text-white text-xs disabled:opacity-50">Create</button>
          </div>
        </div>
      )}

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-xs text-slate-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-slate-500">No projects yet. Click "New Project" to start.</div>
        ) : (
          projects.map((p: any) => (
            <div
              key={p.id}
              onClick={() => router.push(`/projects/${p.id}/board`)}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition cursor-pointer space-y-4 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white group-hover:text-violet-300 transition">{p.name}</h2>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_BADGES[p.status] || STATUS_BADGES.planning}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">{p.description || "Software development project engagement."}</p>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-500">
                <span>Budget: <strong className="text-slate-300">{p.budget ? `${p.currency || '$'}${Number(p.budget).toLocaleString()}` : "Flexible"}</strong></span>
                <span>Created {new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
