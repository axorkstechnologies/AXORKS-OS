"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
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
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Code2,
} from "lucide-react";

export default function ProjectsListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isFounder = currentUser?.role === "Founder" || currentUser?.role === "Co-Founder" || currentUser?.role === "Admin";

  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [assigningProject, setAssigningProject] = useState<any | null>(null);
  const [selectedEngineerIds, setSelectedEngineerIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "assigned">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["projects", page],
    queryFn: () => apiClient(`/api/v1/projects?page=${page}&per_page=50`),
  });

  // Fetch users for engineer assignment modal
  const { data: teamUsers = [] } = useQuery({
    queryKey: ["iam-users-assignment"],
    queryFn: () => apiClient("/api/v1/iam/users"),
  });

  const engineers = (Array.isArray(teamUsers) ? teamUsers : []).filter(
    (u: any) => u.status === "active"
  );

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

  // Assign Engineers Mutation
  const assignMutation = useMutation({
    mutationFn: ({ projectId, assignedTo, assignedNames }: { projectId: string; assignedTo: string[]; assignedNames: string[] }) =>
      apiClient(`/api/v1/projects/${projectId}/assign`, {
        method: "POST",
        body: JSON.stringify({
          assigned_to: assignedTo,
          assigned_to_names: assignedNames,
        }),
        headers: currentUser?.id ? { "x-user-id": currentUser.id } : undefined,
      }),
    onSuccess: (res) => {
      if (res?.success) {
        toast.success(res.message || "Engineers assigned successfully!");
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        setAssigningProject(null);
        setSelectedEngineerIds([]);
      } else {
        toast.error(res?.error || "Failed to assign project");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Error assigning project");
    },
  });

  const handleOpenAssignModal = (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    setAssigningProject(project);
    setSelectedEngineerIds(project.assigned_to || []);
  };

  const handleSaveAssignment = () => {
    if (!assigningProject) return;
    const assignedNames = engineers
      .filter((u: any) => selectedEngineerIds.includes(u.id))
      .map((u: any) => `${u.first_name} ${u.last_name || ""}`.trim());

    assignMutation.mutate({
      projectId: assigningProject.id,
      assignedTo: selectedEngineerIds,
      assignedNames,
    });
  };

  const toggleEngineerSelection = (id: string) => {
    setSelectedEngineerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredProjects = projects.filter((p: any) => {
    // Filter by Assigned to Me
    if (filterMode === "assigned" && currentUser) {
      const isAssigned =
        p.assigned_to?.includes(currentUser.id) ||
        p.team_members?.some((m: string) => m.toLowerCase().includes(currentUser.first_name?.toLowerCase()));
      if (!isAssigned) return false;
    }

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.client_name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.assigned_to_names?.some((n: string) => n.toLowerCase().includes(q))
    );
  });

  const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    active: { label: "In Progress", bg: "bg-emerald-500/20", text: "text-emerald-300 font-bold", border: "border-emerald-500/40" },
    in_progress: { label: "In Progress", bg: "bg-emerald-500/20", text: "text-emerald-300 font-bold", border: "border-emerald-500/40" },
    planning: { label: "Planning", bg: "bg-violet-500/20", text: "text-violet-300 font-bold", border: "border-violet-500/40" },
    on_hold: { label: "On Hold", bg: "bg-amber-500/20", text: "text-amber-300 font-bold", border: "border-amber-500/40" },
    completed: { label: "Completed", bg: "bg-cyan-500/20", text: "text-cyan-300 font-bold", border: "border-cyan-500/40" },
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-white">Project Operations & Delivery</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
              {total} Projects
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Enterprise delivery tracking, engineer task assignments, and milestone budgets in Neon DB
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-600/40 transition transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Filter and Search Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
              filterMode === "all"
                ? "bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-600/40"
                : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800"
            }`}
          >
            All Projects ({projects.length})
          </button>
          <button
            onClick={() => setFilterMode("assigned")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              filterMode === "assigned"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/40"
                : "bg-slate-950 text-emerald-300 border-emerald-500/40 hover:text-white hover:bg-emerald-950/40"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Assigned to Me
          </button>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or engineers..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-violet-500 font-medium transition"
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

      {/* ASSIGN ENGINEERS MODAL (Founder Action) */}
      {assigningProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-violet-400" /> Assign Engineers to Project
                </h3>
                <p className="text-xs text-violet-400 font-semibold mt-0.5">{assigningProject.name}</p>
              </div>
              <button
                onClick={() => setAssigningProject(null)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">
                Select Team Members / Software Engineers:
              </label>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {engineers.map((eng: any) => {
                  const isSelected = selectedEngineerIds.includes(eng.id);
                  return (
                    <div
                      key={eng.id}
                      onClick={() => toggleEngineerSelection(eng.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                        isSelected
                          ? "bg-violet-600/20 border-violet-500 text-slate-100"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {eng.first_name?.[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-200 block">
                            {eng.first_name} {eng.last_name || ""}
                          </span>
                          <span className="text-[10px] text-slate-500">{eng.role} • {eng.email}</span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          isSelected ? "bg-violet-600 border-violet-500 text-white" : "border-slate-700"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setAssigningProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssignment}
                disabled={assignMutation.isPending}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {assignMutation.isPending ? "Saving..." : "Save Assignment"}
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
            <p className="text-xs text-slate-400">
              {filterMode === "assigned"
                ? "You have no projects currently assigned to you."
                : 'Click "New Project" to initiate your first engagement.'}
            </p>
          </div>
        ) : (
          filteredProjects.map((p: any) => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.planning;
            const isAssignedToCurrent =
              currentUser &&
              (p.assigned_to?.includes(currentUser.id) ||
                p.team_members?.some((m: string) => m.toLowerCase().includes(currentUser.first_name?.toLowerCase())));

            const assignedNamesList: string[] = p.assigned_to_names?.length > 0 ? p.assigned_to_names : (p.team_members || []);

            return (
              <div
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}/board`)}
                className="glass-card p-6 rounded-2xl cursor-pointer space-y-4 group relative overflow-hidden flex flex-col justify-between hover:border-violet-500/50 transition duration-200"
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

                  {/* Assigned Engineers Badge / List */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-violet-400" /> Assigned Team:
                      </span>
                      {isAssignedToCurrent && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Assigned to You
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {assignedNamesList.length > 0 ? (
                        assignedNamesList.map((name: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60"
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">No engineers assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-200">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{p.budget ? Number(p.budget).toLocaleString() : "Flexible"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFounder && (
                      <button
                        onClick={(e) => handleOpenAssignModal(e, p)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" /> Assign
                      </button>
                    )}

                    <div className="flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-400 font-bold group-hover:translate-x-1 transition-transform">
                      <span>Open Board</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
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
