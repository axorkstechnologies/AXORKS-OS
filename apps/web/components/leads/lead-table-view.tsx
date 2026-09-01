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
  onRefresh?: () => void;
}

export function LeadTableView({ leads, onVerifyLeads, onRefresh }: LeadTableViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);

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

  const handleVerifyEmailDns = async (lead: any) => {
    if (!lead.email) return;
    setVerifyingEmail(lead.id);
    try {
      const res = await fetch("/api/v1/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lead.email, leadId: lead.id }),
      });
      const data = await res.json();
      if (data.success) {
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyingEmail(null);
    }
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
              <span>Verify Selected with AI &amp; MX</span>
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
              <th className="p-3.5">Email &amp; Deliverability</th>
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
              const isVerified = Boolean(lead.is_verified || lead.verification_status === "verified" || aiResearch?.verification_status === "verified_real");
              const isInvalid = lead.verification_status === "invalid" || aiResearch?.verification_status === "suspicious_bogus";
              const isRisky = lead.verification_status === "risky";

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

                  {/* Email & Deliverability Column */}
                  <td className="p-3.5">
                    {lead.email ? (
                      <div className="space-y-1">
                        <div className="font-mono text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-bold">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Verified (Deliverable)
                            </span>
                          ) : isInvalid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40">
                              <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              Invalid / Bounced
                            </span>
                          ) : isRisky ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40">
                              Risky / Catch-all
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              Unverified
                            </span>
                          )}

                          <button
                            onClick={() => handleVerifyEmailDns(lead)}
                            disabled={verifyingEmail === lead.id}
                            className="text-[10px] font-bold text-violet-600 hover:underline disabled:opacity-50"
                            title="Run instant DNS MX record deliverability check"
                          >
                            {verifyingEmail === lead.id ? "Checking..." : "Verify MX"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No email found</span>
                    )}
                  </td>

                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {lead.decision_maker_name || "—"}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-xs font-mono font-medium">
                      {lead.decision_maker_title || ""}
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
                      title="Verify lead with Google Gemini AI &amp; MX"
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
