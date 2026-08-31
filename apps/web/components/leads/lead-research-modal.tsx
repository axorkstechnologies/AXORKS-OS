"use client";

import { useState, useMemo } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  ExternalLink,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Globe,
  Mail,
  User,
  ShieldCheck,
  ShieldAlert,
  Save,
  Check,
  Filter,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { type LeadResearchResult } from "@/lib/leads-types";
import { apiClient } from "@/lib/api-client";

interface LeadResearchModalProps {
  open: boolean;
  onClose: () => void;
  results: LeadResearchResult[];
  isLoading: boolean;
  onApplyResults?: () => void;
  onReResearch?: () => void;
}

export function LeadResearchModal({
  open,
  onClose,
  results,
  isLoading,
  onApplyResults,
  onReResearch,
}: LeadResearchModalProps) {
  const [filter, setFilter] = useState<"all" | "real" | "bogus">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredResults = useMemo(() => {
    if (filter === "real") {
      return results.filter((r) => r.verification_status === "verified_real");
    }
    if (filter === "bogus") {
      return results.filter((r) => r.verification_status === "suspicious_bogus");
    }
    return results;
  }, [results, filter]);

  const stats = useMemo(() => {
    const total = results.length;
    const real = results.filter((r) => r.verification_status === "verified_real").length;
    const bogus = results.filter((r) => r.verification_status === "suspicious_bogus").length;
    const uncertain = total - real - bogus;
    return { total, real, bogus, uncertain };
  }, [results]);

  if (!open) return null;

  const handleCopyRow = (r: LeadResearchResult) => {
    const text = `Company: ${r.business_name}
Status: ${r.is_real_business ? "VERIFIED REAL" : "SUSPICIOUS/BOGUS"} (Confidence: ${r.confidence_score}%)
Website: ${r.verified_website || "N/A"}
Email: ${r.verified_email || "N/A"}
Decision Maker: ${r.decision_maker_name || "N/A"} (${r.decision_maker_role || "N/A"})
LinkedIn: ${r.decision_maker_linkedin || r.social_media?.linkedin_company || "N/A"}
Socials: ${[
      r.social_media?.linkedin_company && `LinkedIn: ${r.social_media.linkedin_company}`,
      r.social_media?.instagram && `IG: ${r.social_media.instagram}`,
      r.social_media?.facebook && `FB: ${r.social_media.facebook}`,
      r.social_media?.youtube && `YT: ${r.social_media.youtube}`,
    ]
      .filter(Boolean)
      .join(", ") || "None"}
Summary: ${r.business_summary}
Notes: ${r.verification_notes}`;

    navigator.clipboard.writeText(text);
    setCopiedId(r.lead_id);
    toast.success(`Copied research data for ${r.business_name}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllTable = () => {
    const headers = [
      "Company",
      "Real Business?",
      "Confidence %",
      "Website",
      "Email",
      "Decision Maker",
      "Role",
      "DM LinkedIn",
      "Company LinkedIn",
      "Instagram",
      "Facebook",
      "YouTube",
      "Google Presence",
      "Summary",
      "Notes",
    ];

    const rows = filteredResults.map((r) => [
      `"${r.business_name.replace(/"/g, '""')}"`,
      r.is_real_business ? "Yes" : "No",
      r.confidence_score,
      r.verified_website || "",
      r.verified_email || "",
      `"${(r.decision_maker_name || "").replace(/"/g, '""')}"`,
      `"${(r.decision_maker_role || "").replace(/"/g, '""')}"`,
      r.decision_maker_linkedin || "",
      r.social_media?.linkedin_company || "",
      r.social_media?.instagram || "",
      r.social_media?.facebook || "",
      r.social_media?.youtube || "",
      r.appears_on_google ? "Yes" : "No",
      `"${(r.business_summary || "").replace(/"/g, '""')}"`,
      `"${(r.verification_notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");
    navigator.clipboard.writeText(csvContent);
    setCopiedAll(true);
    toast.success(`Copied ${filteredResults.length} leads research table to clipboard`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = [
      "Business Name",
      "Verified Real",
      "Confidence Score",
      "Website",
      "Email",
      "Decision Maker",
      "Title",
      "Personal LinkedIn",
      "Company LinkedIn",
      "Instagram",
      "Facebook",
      "YouTube",
      "Appears on Google",
      "Business Summary",
      "Verification Notes",
      "Recommended Action",
    ];

    const rows = filteredResults.map((r) => [
      `"${r.business_name.replace(/"/g, '""')}"`,
      r.is_real_business ? "Yes" : "No",
      r.confidence_score,
      r.verified_website || "",
      r.verified_email || "",
      `"${(r.decision_maker_name || "").replace(/"/g, '""')}"`,
      `"${(r.decision_maker_role || "").replace(/"/g, '""')}"`,
      r.decision_maker_linkedin || "",
      r.social_media?.linkedin_company || "",
      r.social_media?.instagram || "",
      r.social_media?.facebook || "",
      r.social_media?.youtube || "",
      r.appears_on_google ? "Yes" : "No",
      `"${(r.business_summary || "").replace(/"/g, '""')}"`,
      `"${(r.verification_notes || "").replace(/"/g, '""')}"`,
      `"${(r.recommended_action || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `gemini_verified_leads_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully");
  };

  const handleSaveAllToDatabase = async () => {
    setIsSaving(true);
    try {
      let savedCount = 0;
      for (const r of results) {
        if (r.lead_id && !r.lead_id.startsWith("temp-") && !r.lead_id.startsWith("lead-")) {
          await apiClient(`/api/v1/leads/${r.lead_id}/research`, {
            method: "POST",
            body: JSON.stringify(r),
          });
          savedCount++;
        } else {
          // If lead does not exist in DB yet, create it as verified lead
          await apiClient("/api/v1/leads", {
            method: "POST",
            body: JSON.stringify({
              business_name: r.business_name,
              website: r.verified_website || "",
              email: r.verified_email || "",
              decision_maker_name: r.decision_maker_name || "",
              decision_maker_title: r.decision_maker_role || "",
              linkedin_url: r.decision_maker_linkedin || r.social_media?.linkedin_company || "",
              score: r.confidence_score,
              status: r.is_real_business ? "qualified" : "new",
              source: "gemini_verified",
              ai_research: r,
            }),
          });
          savedCount++;
        }
      }
      toast.success(`Successfully saved ${savedCount} researched leads into Neon Database`);
      if (onApplyResults) onApplyResults();
    } catch (err: any) {
      toast.error(err.message || "Failed to save leads to database");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-950/95 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Gemini AI Lead Verification & Deep Research
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-violet-500/10 text-violet-300 border border-violet-500/30">
                  Google Gemini 3.6/3.7 Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Commercial authenticity analysis, website & social presence verification, and bogus lead detection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="p-8 text-center space-y-4 bg-slate-900/40">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center mx-auto text-violet-400 animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Gemini is conducting deep corporate research...</p>
              <p className="text-xs text-slate-400 mt-1">
                Checking Google presence, business registry authenticity, decision maker LinkedIn profiles, and social footprints.
              </p>
            </div>
            <div className="w-64 mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-emerald-500 h-full w-2/3 animate-pulse rounded-full" />
            </div>
          </div>
        )}

        {/* Toolbar & Filter Metrics */}
        {!isLoading && (
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            {/* Filter Tabs & Quick Counts */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                  filter === "all"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                All Researched Leads ({stats.total})
              </button>
              <button
                onClick={() => setFilter("real")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                  filter === "real"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-emerald-400 hover:bg-emerald-950/40 border border-emerald-500/20"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Real ({stats.real})
              </button>
              <button
                onClick={() => setFilter("bogus")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                  filter === "bogus"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                    : "text-rose-400 hover:bg-rose-950/40 border border-rose-500/20"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Suspicious / Bogus ({stats.bogus})
              </button>
            </div>

            {/* Actions: Copy All, Export CSV, Save to DB */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyAllTable}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                title="Copy entire research table formatted for Excel or Sheets"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                {copiedAll ? "Copied All!" : "Copy Table"}
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                title="Download CSV spreadsheet"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
              </button>

              <button
                onClick={handleSaveAllToDatabase}
                disabled={isSaving || results.length === 0}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? "Saving to Neon DB..." : "Save Verified Leads to DB"}
              </button>
            </div>
          </div>
        )}

        {/* Research Results Table */}
        {!isLoading && (
          <div className="flex-1 overflow-auto p-4 custom-scroll">
            {filteredResults.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-500" />
                <p className="text-sm font-semibold">No leads matching this filter.</p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-slate-900/40">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 font-bold">Verdict & Confidence</th>
                      <th className="px-4 py-3 font-bold">Company & Google</th>
                      <th className="px-4 py-3 font-bold">Website & Email</th>
                      <th className="px-4 py-3 font-bold">Decision Maker</th>
                      <th className="px-4 py-3 font-bold">LinkedIn & Social Presence</th>
                      <th className="px-4 py-3 font-bold">Business Summary & Verdict</th>
                      <th className="px-4 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredResults.map((r, idx) => {
                      const isReal = r.verification_status === "verified_real";
                      const isBogus = r.verification_status === "suspicious_bogus";

                      return (
                        <tr
                          key={r.lead_id || idx}
                          className={`hover:bg-slate-800/40 transition ${
                            isBogus ? "bg-rose-950/10" : isReal ? "bg-emerald-950/10" : ""
                          }`}
                        >
                          {/* 1. Verdict & Confidence Badge */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="space-y-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                                  isReal
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : isBogus
                                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                }`}
                              >
                                {isReal ? (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    Verified Real
                                  </>
                                ) : isBogus ? (
                                  <>
                                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                                    Suspicious / Bogus
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                    Uncertain
                                  </>
                                )}
                              </span>

                              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                                <span>Score:</span>
                                <strong
                                  className={
                                    r.confidence_score >= 70
                                      ? "text-emerald-400 font-bold"
                                      : r.confidence_score >= 40
                                      ? "text-amber-400 font-bold"
                                      : "text-rose-400 font-bold"
                                  }
                                >
                                  {r.confidence_score}%
                                </strong>
                              </div>
                            </div>
                          </td>

                          {/* 2. Company & Google Presence */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="space-y-1 max-w-[200px]">
                              <span className="font-bold text-white block text-sm leading-snug">
                                {r.business_name}
                              </span>
                              <div className="flex items-center gap-1 text-[11px]">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    r.appears_on_google ? "bg-emerald-400" : "bg-rose-400"
                                  }`}
                                />
                                <span className={r.appears_on_google ? "text-emerald-400" : "text-rose-400"}>
                                  {r.appears_on_google ? "Google Indexed" : "Not Found on Google"}
                                </span>
                              </div>
                              {r.google_presence_notes && (
                                <p className="text-[10px] text-slate-400 line-clamp-2">
                                  {r.google_presence_notes}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* 3. Verified Website & Email */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="space-y-1.5 max-w-[190px]">
                              {r.verified_website ? (
                                <a
                                  href={r.verified_website.startsWith("http") ? r.verified_website : `https://${r.verified_website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 font-medium truncate max-w-full hover:underline"
                                >
                                  <Globe className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{r.verified_website.replace(/^https?:\/\//, "")}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">No active website</span>
                              )}

                              {r.verified_email ? (
                                <a
                                  href={`mailto:${r.verified_email}`}
                                  className="flex items-center gap-1 text-slate-200 hover:text-violet-300 font-mono text-[11px] truncate max-w-full"
                                >
                                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{r.verified_email}</span>
                                </a>
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">Unconfirmed email</span>
                              )}
                            </div>
                          </td>

                          {/* 4. Decision Maker & Role */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="space-y-1 max-w-[170px]">
                              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                                <User className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                <span className="truncate">
                                  {r.decision_maker_name || "Unspecified Contact"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium">
                                {r.decision_maker_role || "Executive Leader"}
                              </p>
                            </div>
                          </td>

                          {/* 5. LinkedIn & Social Footprint */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="space-y-1.5">
                              {/* Decision Maker Personal LinkedIn */}
                              {r.decision_maker_linkedin ? (
                                <a
                                  href={r.decision_maker_linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] font-semibold hover:bg-blue-500/20"
                                >
                                  <Linkedin className="w-3 h-3" />
                                  <span>DM LinkedIn</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : null}

                              {/* Company Social Media Icons */}
                              <div className="flex items-center gap-1.5 pt-0.5">
                                {r.social_media?.linkedin_company && (
                                  <a
                                    href={r.social_media.linkedin_company}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded bg-slate-800 text-blue-400 hover:text-white"
                                    title="Company LinkedIn"
                                  >
                                    <Linkedin className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {r.social_media?.instagram && (
                                  <a
                                    href={r.social_media.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded bg-slate-800 text-pink-400 hover:text-white"
                                    title="Instagram"
                                  >
                                    <Instagram className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {r.social_media?.facebook && (
                                  <a
                                    href={r.social_media.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded bg-slate-800 text-blue-500 hover:text-white"
                                    title="Facebook"
                                  >
                                    <Facebook className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {r.social_media?.youtube && (
                                  <a
                                    href={r.social_media.youtube}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded bg-slate-800 text-red-400 hover:text-white"
                                    title="YouTube"
                                  >
                                    <Youtube className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {!r.decision_maker_linkedin &&
                                  !r.social_media?.linkedin_company &&
                                  !r.social_media?.instagram &&
                                  !r.social_media?.facebook &&
                                  !r.social_media?.youtube && (
                                    <span className="text-[11px] text-slate-500 italic">No social links</span>
                                  )}
                              </div>
                            </div>
                          </td>

                          {/* 6. Business Summary & Notes */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="space-y-1 max-w-xs">
                              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                                {r.business_summary}
                              </p>
                              <p className="text-[10px] text-slate-400 italic line-clamp-2">
                                {r.verification_notes}
                              </p>
                            </div>
                          </td>

                          {/* 7. Action Button: Copy Row */}
                          <td className="px-4 py-3.5 align-top text-right">
                            <button
                              onClick={() => handleCopyRow(r)}
                              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Copy lead research details"
                            >
                              {copiedId === r.lead_id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/60">
          <div className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredResults.length}</strong> of {results.length} leads
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Research Window
          </button>
        </div>
      </div>
    </div>
  );
}
