"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Plus, Clock, User, CheckSquare, Sparkles } from "lucide-react";

export default function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState("backlog");
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Time entry modal state
  const [timeTaskId, setTimeTaskId] = useState<string | null>(null);
  const [timeHours, setTimeHours] = useState("");

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => apiClient(`/api/v1/projects/${id}`).then((r: any) => r.data),
    enabled: !!id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => apiClient(`/api/v1/projects/tasks?project_id=${id}`).then((r: any) => r.data),
    enabled: !!id,
  });

  const updateTaskStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiClient(`/api/v1/projects/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      toast.success("Task status updated");
    },
  });

  const createTask = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/projects/tasks", {
        method: "POST",
        body: JSON.stringify({
          project_id: id,
          title: newTaskTitle,
          status: newTaskStatus,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      toast.success("Task created");
      setNewTaskTitle("");
      setShowTaskModal(false);
    },
  });

  const logTime = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/projects/time", {
        method: "POST",
        body: JSON.stringify({
          project_id: id,
          task_id: timeTaskId,
          hours: parseFloat(timeHours) || 1,
          logged_date: new Date().toISOString().split("T")[0],
        }),
      }),
    onSuccess: () => {
      toast.success("Time entry logged!");
      setTimeTaskId(null);
      setTimeHours("");
    },
  });

  const COLUMNS = [
    { id: "backlog", label: "Backlog", color: "border-slate-800" },
    { id: "todo", label: "To Do", color: "border-cyan-500/40" },
    { id: "in_progress", label: "In Progress", color: "border-violet-500/40" },
    { id: "review", label: "In Review", color: "border-amber-500/40" },
    { id: "done", label: "Done", color: "border-emerald-500/40" },
  ];

  return (
    <div className="p-6 h-full flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white">{project?.name || "Project Board"}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Kanban Board & Delivery Sprint</p>
        </div>
        <button
          onClick={() => { setNewTaskStatus("todo"); setShowTaskModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Task
        </button>
      </div>

      {/* Quick Task Create Dialog */}
      {showTaskModal && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 max-w-md space-y-3">
          <h2 className="text-sm font-semibold text-white">Create Task</h2>
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500"
          />
          <select
            value={newTaskStatus}
            onChange={(e) => setNewTaskStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
          >
            {COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowTaskModal(false)} className="px-4 py-1.5 rounded bg-slate-800 text-slate-400 text-xs">Cancel</button>
            <button onClick={() => createTask.mutate()} disabled={!newTaskTitle.trim()} className="px-4 py-1.5 rounded bg-violet-600 text-white text-xs disabled:opacity-50">Create</button>
          </div>
        </div>
      )}

      {/* Log Time Modal */}
      {timeTaskId && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 max-w-xs space-y-3">
          <h2 className="text-xs font-semibold text-white">Log Hours</h2>
          <input
            type="number"
            value={timeHours}
            onChange={(e) => setTimeHours(e.target.value)}
            placeholder="Hours (e.g. 2.5)"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setTimeTaskId(null)} className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-xs">Cancel</button>
            <button onClick={() => logTime.mutate()} className="px-3 py-1 rounded bg-violet-600 text-white text-xs">Save</button>
          </div>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="flex-1 grid grid-cols-5 gap-4 overflow-x-auto">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t: any) => t.status === col.id);

          return (
            <div key={col.id} className="flex flex-col bg-slate-950/40 rounded-xl border border-slate-800/80 overflow-hidden">
              {/* Column Header */}
              <div className={`px-3 py-2.5 border-b ${col.color} bg-slate-900/60 flex items-center justify-between`}>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{col.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">{colTasks.length}</span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {colTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-2 group cursor-pointer"
                  >
                    <p className="text-xs font-medium text-slate-200">{task.title}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <span className="capitalize text-violet-400 font-semibold">{task.type}</span>

                      {/* Quick Move Status Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => setTimeTaskId(task.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400"
                          title="Log Time"
                        >
                          <Clock className="w-3 h-3" />
                        </button>
                        {col.id !== "done" && (
                          <button
                            onClick={() => updateTaskStatus.mutate({ taskId: task.id, status: col.id === "in_progress" ? "done" : "in_progress" })}
                            className="p-1 rounded bg-violet-600/20 text-violet-300 hover:bg-violet-600/40"
                          >
                            →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
