"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { LeadTableView } from "@/components/leads/lead-table-view";
import { LeadKanbanBoard } from "@/components/leads/lead-kanban-board";
import { LeadCreateDialog } from "@/components/leads/lead-create-dialog";
import { LeadSourcesPanel } from "@/components/leads/lead-sources-panel";
import { EnrichmentModal } from "@/components/leads/enrichment-modal";
import { LeadResearchModal } from "@/components/leads/lead-research-modal";
import { LeadResearchResult } from "@/lib/gemini-lead-research";
import Link from "next/link";
import { Plus, Upload, LayoutList, Kanban, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [enrichmentOpen, setEnrichmentOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"hunter" | "tomba" | "prospeo" | "snov" | "unified">("unified");
  const [selectedMode, setSelectedMode] = useState<"domain" | "location">("location");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Gemini AI Research State
  const [researchModalOpen, setResearchModalOpen] = useState(false);
  const [researchResults, setResearchResults] = useState<LeadResearchResult[]>([]);
  const [isResearching, setIsResearching] = useState(false);
  const [lastResearchedLeads, setLastResearchedLeads] = useState<any[]>([]);

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

  const handleOpenEnrichment = (
    provider: "hunter" | "tomba" | "prospeo" | "snov" | "unified",
    mode: "domain" | "location" = "location"
  ) => {
    setSelectedProvider(provider);
    setSelectedMode(mode);
    setEnrichmentOpen(true);
  };

  // Launch Gemini Deep Research for selected or bulk leads
  const handleStartResearch = async (leadsToVerify: any[]) => {
    if (!leadsToVerify || leadsToVerify.length === 0) {
      toast.error("No leads selected for verification.");
      return;
    }

    setLastResearchedLeads(leadsToVerify);
    setResearchResults([]);
    setIsResearching(true);
    setResearchModalOpen(true);

    try {
      const res = await apiClient("/api/v1/leads/research", {
        method: "POST",
        body: JSON.stringify({
          leads: leadsToVerify,
          save_to_db: true,
        }),
      });

      if (res.success && res.data) {
        setResearchResults(res.data);
        toast.success(`Gemini verified ${res.total_researched} leads (${res.verified_real_count} real, ${res.suspicious_count} bogus)`);
        refetch();
      } else {
        toast.error(res.error || "Gemini research failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute AI lead verification");
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Lead Intelligence & AI Verification
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20">
              {leads.length} Leads
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Multi-source API enrichment with one-click Google Gemini commercial verification & bogus lead filtering
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {leads.length > 0 && (
            <button
              onClick={() => handleStartResearch(leads)}
              disabled={isResearching}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
              <span>Verify All with Gemini AI</span>
            </button>
          )}

          <Link
            href="/leads/import"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 glass text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </Link>

          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> New Lead
          </button>
        </div>
      </div>

      {/* Lead Sources & Enrichment Bar */}
      <LeadSourcesPanel onOpenEnrichment={handleOpenEnrichment} />

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 glass rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by business, email, location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-medium"
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
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" /> Table
          </button>
          <button
            onClick={() => setViewMode("board")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
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
        <div className="text-center py-16 text-xs text-slate-400 font-mono">
          Loading leads from Neon DB...
        </div>
      ) : viewMode === "table" ? (
        <LeadTableView
          leads={leads}
          onVerifyLeads={handleStartResearch}
        />
      ) : (
        <LeadKanbanBoard leads={leads} />
      )}

      {/* Create Lead Modal */}
      <LeadCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Multi-Tool Enrichment Modal (Lead Finder) */}
      <EnrichmentModal
        open={enrichmentOpen}
        initialProvider={selectedProvider}
        initialMode={selectedMode}
        onClose={() => setEnrichmentOpen(false)}
        onLeadSaved={() => refetch()}
        onVerifyWithGemini={handleStartResearch}
      />

      {/* Gemini AI Lead Research Modal */}
      <LeadResearchModal
        open={researchModalOpen}
        onClose={() => setResearchModalOpen(false)}
        results={researchResults}
        isLoading={isResearching}
        onApplyResults={() => {
          refetch();
          setResearchModalOpen(false);
        }}
        onReResearch={() => handleStartResearch(lastResearchedLeads)}
      />
    </div>
  );
}
