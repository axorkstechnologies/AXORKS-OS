"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AIScoreBadge } from "@/components/leads/ai-score-badge";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Building2,
  User,
  Globe,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => apiClient(`/api/v1/leads/${id}`).then((r: any) => r.data || r),
  });

  const { data: scoreHistory = [] } = useQuery({
    queryKey: ["lead-score-history", id],
    queryFn: () => apiClient(`/api/v1/leads/${id}/score-history`),
  });

  const researchMutation = useMutation({
    mutationFn: () => apiClient(`/api/v1/leads/${id}/research`, { method: "POST" }),
    onSuccess: (res) => {
      const researchData = res?.data || res;
      toast.success(
        researchData?.is_real_business
          ? `Gemini confirmed ${researchData.business_name} as VERIFIED REAL (${researchData.confidence_score}% confidence)`
          : `Gemini marked ${researchData?.business_name || "lead"} as SUSPICIOUS/BOGUS`
      );
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to research lead with Gemini AI");
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-16 text-xs text-slate-400 font-mono">
        Loading lead details from Neon DB...
      </div>
    );
  }

  if (!lead) {
    return <div className="text-center py-16 text-xs text-rose-500 font-semibold">Lead not found</div>;
  }

  const aiResearch = typeof lead.ai_research === "string" ? JSON.parse(lead.ai_research) : lead.ai_research;
  const isReal = aiResearch?.verification_status === "verified_real";
  const isBogus = aiResearch?.verification_status === "suspicious_bogus";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to leads directory
        </Link>
      </div>

      {/* Detail Header */}
      <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {lead.business_name || "Untitled Business"}
            </h1>
            <AIScoreBadge score={lead.score || 75} />
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              {lead.status || "new"}
            </span>

            {aiResearch && (
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isReal
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : isBogus
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}
              >
                {isReal ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Verified Real ({aiResearch.confidence_score}%)
                  </>
                ) : isBogus ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Suspicious / Bogus
                  </>
                ) : (
                  "Uncertain"
                )}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-4">
            <span>
              Source: <strong className="capitalize text-slate-700 dark:text-slate-200">{lead.source || "manual"}</strong>
            </span>
            <span>
              Industry: <strong className="text-slate-700 dark:text-slate-200">{lead.industry || "B2B Technology"}</strong>
            </span>
            <span>
              Location: <strong className="text-slate-700 dark:text-slate-200">{lead.country || "International"}</strong>
            </span>
          </p>
        </div>

        <button
          onClick={() => researchMutation.mutate()}
          disabled={researchMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition transform active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-violet-200 animate-pulse" />
          {researchMutation.isPending ? "Gemini Verifying..." : "Verify Lead with Gemini AI"}
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gemini AI Deep Research Card */}
          {aiResearch && (
            <div className="glass p-6 rounded-3xl border border-violet-500/30 bg-violet-950/10 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" /> Gemini Deep Intelligence & Verification Report
                </h2>
                <span className="text-[11px] font-mono text-violet-400 font-bold">
                  Confidence: {aiResearch.confidence_score}%
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Commercial Summary:</span>
                  <p className="text-slate-200 leading-relaxed mt-0.5">{aiResearch.business_summary}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Verification Verdict & Notes:</span>
                  <p className="text-slate-300 italic mt-0.5">{aiResearch.verification_notes}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Google Presence</span>
                    <p className={`font-bold flex items-center gap-1.5 ${aiResearch.appears_on_google ? "text-emerald-400" : "text-rose-400"}`}>
                      <span className={`w-2 h-2 rounded-full ${aiResearch.appears_on_google ? "bg-emerald-400" : "bg-rose-400"}`} />
                      {aiResearch.appears_on_google ? "Indexed on Google" : "Not Found on Google"}
                    </p>
                    <p className="text-[11px] text-slate-400">{aiResearch.google_presence_notes}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Recommended Action</span>
                    <p className="font-bold text-violet-300">{aiResearch.recommended_action || "Reach Out via Email"}</p>
                  </div>
                </div>

                {/* Social Footprint Links */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-medium block mb-2">Verified Social Presence:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {aiResearch.decision_maker_linkedin && (
                      <a
                        href={aiResearch.decision_maker_linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-500/20"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                        <span>DM LinkedIn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {aiResearch.social_media?.linkedin_company && (
                      <a
                        href={aiResearch.social_media.linkedin_company}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-500/20"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                        <span>Company LinkedIn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {aiResearch.social_media?.instagram && (
                      <a
                        href={aiResearch.social_media.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/30 text-xs font-semibold hover:bg-pink-500/20"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {aiResearch.social_media?.facebook && (
                      <a
                        href={aiResearch.social_media.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-600/30 text-xs font-semibold hover:bg-blue-600/20"
                      >
                        <Facebook className="w-3.5 h-3.5" />
                        <span>Facebook</span>
                      </a>
                    )}
                    {aiResearch.social_media?.youtube && (
                      <a
                        href={aiResearch.social_media.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-semibold hover:bg-red-500/20"
                      >
                        <Youtube className="w-3.5 h-3.5" />
                        <span>YouTube</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Business Details */}
          <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100">
              <Building2 className="w-4 h-4 text-violet-500" /> Business Details
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Website</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {lead.website ? (
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-violet-500 hover:underline inline-flex items-center gap-1"
                    >
                      {lead.website} <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Industry</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">{lead.industry || "Commercial B2B"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Country</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">{lead.country || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">{lead.phone || "—"}</span>
              </div>
            </div>
          </div>

          {/* Decision Maker */}
          <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100">
              <User className="w-4 h-4 text-cyan-500" /> Decision Maker & Contact Info
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Contact Name</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">{lead.decision_maker_name || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Title / Role</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">{lead.decision_maker_title || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email Address</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200 font-mono">
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-violet-500 hover:underline">
                      {lead.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">LinkedIn Profile</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {lead.linkedin_url ? (
                    <a href={lead.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                      View Profile <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Score History Sidebar */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-slate-100">
              <Sparkles className="w-4 h-4 text-amber-500" /> Scoring & Verification Log
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scroll">
              {scoreHistory.length === 0 ? (
                <p className="text-xs text-slate-500">No score history logged yet.</p>
              ) : (
                scoreHistory.map((item: any) => (
                  <div key={item.id} className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-900 dark:text-slate-100">
                      <span>Score: {item.new_score}/100</span>
                      <span className="text-[10px] text-slate-400 capitalize">{item.scored_by}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
