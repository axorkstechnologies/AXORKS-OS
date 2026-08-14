"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { LeadTableView } from "@/components/leads/lead-table-view";
import { LeadKanbanBoard } from "@/components/leads/lead-kanban-board";
import { LeadCreateDialog } from "@/components/leads/lead-create-dialog";
import { LeadSourcesPanel } from "@/components/leads/lead-sources-panel";
import { HunterPanel } from "@/components/leads/hunter-panel";
import Link from "next/link";
import { Plus, Upload, LayoutList, Kanban, Search } from "lucide-react";

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [hunterPanelOpen, setHunterPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ["leads", search, statusFilter],
    queryFn: () =>
      apiClient("/api/v1/leads", {
        params: {
          search,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      }),
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Lead Intelligence</h1>
          <p className="text-slate-500 text-xs mt-1">
            Capture, score, and qualify prospective agency clients
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/leads/import"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </Link>

          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium shadow-md shadow-violet-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" /> New Lead
          </button>
        </div>
      </div>

      {/* Lead Sources Panel — external links + Hunter API */}
      <LeadSourcesPanel onOpenHunter={() => setHunterPanelOpen(true)} />

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 glass rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-violet-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
          </select>
        </div>

        {/* Table / Board Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" /> Table
          </button>
          <button
            onClick={() => setViewMode("board")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
              viewMode === "board"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" /> Board
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading leads...</div>
      ) : viewMode === "table" ? (
        <LeadTableView leads={leads} />
      ) : (
        <LeadKanbanBoard leads={leads} />
      )}

      {/* Create Modal */}
      <LeadCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Hunter API Integration Panel */}
      <HunterPanel
        open={hunterPanelOpen}
        onClose={() => setHunterPanelOpen(false)}
        onLeadSaved={() => refetch()}
      />
    </div>
  );
}
