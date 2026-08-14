"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Building2, Users, Plus, X } from "lucide-react";

export default function IAMDepartmentsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptDesc, setDeptDesc] = useState("");

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["iam-departments"],
    queryFn: () => apiClient("/api/v1/iam/departments"),
  });

  const createDeptMutation = useMutation({
    mutationFn: (body: any) =>
      apiClient("/api/v1/iam/departments", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("Department created successfully");
      queryClient.invalidateQueries({ queryKey: ["iam-departments"] });
      setCreateOpen(false);
      setDeptName("");
      setDeptCode("");
      setDeptDesc("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create department");
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-xs text-slate-400">Loading Departments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-bold tracking-tight">
            Organizational Departments
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage company departments, teams, and employee headcount allocation
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d: any) => (
          <div key={d.id || d.name} className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-500 font-bold flex items-center justify-center text-xs border border-violet-500/20">
                    {d.code || d.name.substring(0, 3).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{d.name}</h3>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {d.code || "DEPT"}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-2">{d.description || "Organizational Unit"}</p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-violet-400" />
                <strong className="text-slate-200">{d.employee_count || 0}</strong> Employees
              </span>
              <span className="text-[10px] text-slate-500">Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold">Add New Department</h3>
              <button onClick={() => setCreateOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDeptMutation.mutate({ name: deptName, code: deptCode, description: deptDesc });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium text-slate-400 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. AI Engineering"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-400 mb-1">Department Code</label>
                <input
                  type="text"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g. AIE"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 uppercase"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Responsibilities and domain..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDeptMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium disabled:opacity-50"
                >
                  {createDeptMutation.isPending ? "Creating..." : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
