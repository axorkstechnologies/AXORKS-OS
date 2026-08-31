"use client";

import { useState } from "react";
import Link from "next/link";
import { AIScoreBadge } from "./ai-score-badge";
import {
  ExternalLink,
  Mail,
  Phone,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckSquare,
  Square,
  Check,
} from "lucide-react";

interface LeadTableViewProps {
  leads: any[];
  onVerifyLeads?: (leadsToVerify: any[]) => void;
}

export function LeadTableView({ leads, onVerifyLeads }: LeadTableViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-slate-700 dark:text-slate-300 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80">
        No leads match your criteria. Create one or adjust your filters.
      </div>
    );
  }

  const allSelected = leads.length > 0 && selectedIds.size === leads.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  };

  const toggleSelectLead = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkVerify = () => {
    if (!onVerifyLeads) return;
    const selectedLeads = leads.filter((l) => selectedIds.has(l.id));
    onVerifyLeads(selectedLeads.length > 0 ? selectedLeads : leads);
  };

  const handleSingleVerify = (lead: any) => {
    if (!onVerifyLeads) return;
    onVerifyLeads([lead]);
  };

  return (
    <div className="space-y-3">
      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="p-3.5 rounded-2xl border border-violet-300 dark:border-violet-500/50 bg-violet-50 dark:bg-violet-950/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold text-violet-900 dark:text-violet-200">
            <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>{selectedIds.size} of {leads.length} leads selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-xs"
            >
              Clear Selection
            </button>

            <button
              onClick={handleBulkVerify}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-violet-600/30 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-200 animate-pulse" />
              <span>Verify Selected with Gemini AI</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Leads Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 dark:border-slate-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  title="Select all leads"
                />
              </th>
              <th className="p-3.5">Business &amp; Website</th>
              <th className="p-3.5">AI Verification</th>
              <th className="p-3.5">Decision Maker</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Score</th>
              <th className="p-3.5">Source</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {leads.map((lead) => {
              const isSelected = selectedIds.has(lead.id);
              const aiResearch = lead.ai_research;
              const isReal = aiResearch?.verification_status === "verified_real";
              const isBogus = aiResearch?.verification_status === "suspicious_bogus";

              return (
                <tr
                  key={lead.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-900/60 transition group ${
                    isSelected ? "bg-violet-50 dark:bg-violet-950/30" : ""
                  }`}
                >
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectLead(lead.id)}
                      className="rounded border-slate-300 dark:border-slate-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  </td>

                  <td className="p-3.5">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-black text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors text-sm"
                    >
                      {lead.business_name || "Untitled Business"}
                    </Link>
                    {lead.website && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5 font-medium">
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                        <a
                          href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline hover:text-violet-600 dark:hover:text-white truncate max-w-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                  </td>

                  <td className="p-3.5">
                    {aiResearch ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isReal
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40"
                            : isBogus
                            ? "bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-500/40"
                            : "bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40"
                        }`}
                        title={aiResearch.verification_notes || "Gemini verified lead"}
                      >
                        {isReal ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Real ({aiResearch.confidence_score}%)
                          </>
                        ) : isBogus ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            Bogus ({aiResearch.confidence_score}%)
                          </>
                        ) : (
                          "Uncertain"
                        )}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Unverified</span>
                    )}
                  </td>

                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {lead.decision_maker_name || "—"}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-xs font-mono font-medium">
                      {lead.decision_maker_title || lead.email || ""}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-500/20 text-violet-900 dark:text-violet-300 border border-violet-300 dark:border-violet-500/40">
                      {lead.status || "new"}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <AIScoreBadge score={lead.score || 75} />
                  </td>

                  <td className="p-3.5 text-slate-700 dark:text-slate-300 capitalize text-xs font-medium">
                    {lead.source || "manual"}
                  </td>

                  <td className="p-3.5 text-right space-x-1.5">
                    <button
                      onClick={() => handleSingleVerify(lead)}
                      className="px-2.5 py-1 rounded-lg bg-violet-100 hover:bg-violet-600 text-violet-800 hover:text-white dark:bg-violet-600/25 dark:hover:bg-violet-600 dark:text-violet-200 dark:hover:text-white border border-violet-300 dark:border-violet-500/40 transition text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                      title="Verify this single lead with Gemini AI"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>AI Research</span>
                    </button>

                    <Link
                      href={`/leads/${lead.id}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition text-xs font-bold inline-block shadow-xs"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
