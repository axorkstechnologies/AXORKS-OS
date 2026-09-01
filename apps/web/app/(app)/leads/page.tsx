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
import { type LeadResearchResult } from "@/lib/leads-types";
import Link from "next/link";
import { Plus, Upload, LayoutList, Kanban, Search, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [enrichmentOpen, setEnrichmentOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"hunter" | "tomba" | "prospeo" | "snov" | "unified">("unified");
  const [selectedMode, setSelectedMode] = useState<"domain" | "location">("location");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState("");
  const [isVerifyingEmails, setIsVerifyingEmails] = useState(false);

  // Gemini AI Research State
  const [researchModalOpen, setResearchModalOpen] = useState(false);
  const [researchResults, setResearchResults] = useState<LeadResearchResult[]>([]);
  const [isResearching, setIsResearching] = useState(false);
  const [lastResearchedLeads, setLastResearchedLeads] = useState<any[]>([]);

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ["leads", search, statusFilter, verifiedOnly, verificationFilter],
    queryFn: () =>
      apiClient("/api/v1/leads", {
        params: {
          search,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(verifiedOnly ? { verified_only: "true" } : {}),
          ...(verificationFilter ? { verification_status: verificationFilter } : {}),
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

      const resultsArray = Array.isArray(res) ? res : res?.data || [];
      if (resultsArray.length > 0) {
        setResearchResults(resultsArray);
        const realCount = resultsArray.filter((r: any) => r.verification_status === "verified_real").length;
        const bogusCount = resultsArray.filter((r: any) => r.verification_status === "suspicious_bogus").length;
        toast.success(`Gemini verified ${resultsArray.length} lead${resultsArray.length > 1 ? "s" : ""} (${realCount} real, ${bogusCount} bogus)`);
        refetch();
      } else if (res?.error) {
        toast.error(res.error);
      } else {
        toast.error("No verification data returned by Gemini AI");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute AI lead verification");
    } finally {
      setIsResearching(false);
    }
  };

  // Instant DNS MX Record Batch Verification for all current leads
  const handleVerifyAllEmails = async () => {
    if (!leads || leads.length === 0) {
      toast.error("No leads available to verify.");
      return;
    }

    setIsVerifyingEmails(true);
    try {
      const res = await apiClient("/api/v1/email/verify", {
        method: "POST",
        body: JSON.stringify({ leads }),
      });

      if (res.success) {
        toast.success(`Verified ${res.total} lead emails (${res.verified_count} deliverable MX servers found)`);
        refetch();
      } else {
        toast.error(res.error || "Failed to verify lead emails");
      }
    } catch (err: any) {
      toast.error(err.message || "Error running email verification");
    } finally {
      setIsVerifyingEmails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <span>Lead Intelligence &amp; AI Verification</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-500/40">
              {leads.length} Leads
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-xs font-medium mt-1">
            Multi-source API enrichment with one-click DNS/MX deliverability checks &amp; bogus lead elimination
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {leads.length > 0 && (
            <>
              <button
                onClick={handleVerifyAllEmails}
                disabled={isVerifyingEmails}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition transform active:scale-95 disabled:opacity-50"
                title="Check MX records and deliverability for all leads"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>{isVerifyingEmails ? "Checking MX..." : "Verify Emails (DNS & MX)"}</span>
              </button>

              <button
                onClick={() => handleStartResearch(leads)}
                disabled={isResearching}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-violet-600/30 transition transform active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-200 animate-pulse" />
                <span>Deep AI Research</span>
              </button>
            </>
          )}

          <Link
            href="/leads/import"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </Link>

          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-600/30 transition transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> New Lead
          </button>
        </div>
      </div>

      {/* Lead Sources & Enrichment Bar */}
      <LeadSourcesPanel onOpenEnrichment={handleOpenEnrichment} />

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by business, email, location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 font-medium transition"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none font-bold"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
          </select>

          {/* Verification Status Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none font-bold"
          >
            <option value="">All Verification</option>
            <option value="verified">🟢 Verified Deliverable</option>
            <option value="unverified">⚪ Unverified</option>
            <option value="risky">🟡 Risky / Catch-all</option>
            <option value="invalid">🔴 Invalid / Bounced</option>
          </select>

          {/* Quick Toggle: Verified Only */}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              verifiedOnly
                ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>{verifiedOnly ? "✓ Verified Only" : "Show Verified Only"}</span>
          </button>
        </div>

        {/* Table / Board Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "table"
                ? "bg-violet-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" /> Table
          </button>
          <button
            onClick={() => setViewMode("board")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "board"
                ? "bg-violet-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" /> Board
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-500 dark:text-slate-400 font-mono">
          Loading leads from Neon DB...
        </div>
      ) : viewMode === "table" ? (
        <LeadTableView
          leads={leads}
          onVerifyLeads={handleStartResearch}
          onRefresh={() => refetch()}
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
