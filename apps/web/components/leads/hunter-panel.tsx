"use client";

import React, { useState, useEffect } from "react";
import { X, Search, ShieldCheck, UserPlus, Loader2, Mail } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface HunterPanelProps {
  open: boolean;
  onClose: () => void;
  onLeadSaved?: () => void;
}

export function HunterPanel({ open, onClose, onLeadSaved }: HunterPanelProps) {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [credits, setCredits] = useState<{ used: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) fetchCredits();
  }, [open]);

  const fetchCredits = async () => {
    try {
      const res = await apiClient("/api/v1/hunter/account");
      setCredits({
        used: res?.requests?.searches?.used || 0,
        total: res?.requests?.searches?.available || 0,
      });
      setError(null);
    } catch (err: any) {
      if (err.message?.includes("not configured")) {
        setError("HUNTER_API_KEY is not configured on the server.");
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient("/api/v1/hunter/domain-search", {
        method: "POST",
        body: JSON.stringify({ domain }),
      });
      const emails = res?.emails || [];
      setResults(emails);
      toast.success(`Found ${emails.length} emails for ${domain}`);
      fetchCredits();
    } catch (err: any) {
      setError(err.message || "Failed to search domain");
      toast.error("Failed to search domain");
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email: string) => {
    setVerifying((prev) => ({ ...prev, [email]: true }));
    try {
      const res = await apiClient("/api/v1/hunter/email-verify", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const status = res?.status || "unknown";
      toast.info(`Email status: ${status}`, { description: email });
      fetchCredits();
    } catch {
      toast.error("Failed to verify email");
    } finally {
      setVerifying((prev) => ({ ...prev, [email]: false }));
    }
  };

  const saveLead = async (emailData: any) => {
    try {
      await apiClient("/api/v1/leads", {
        method: "POST",
        body: JSON.stringify({
          business_name: domain,
          decision_maker_name: [emailData.first_name, emailData.last_name].filter(Boolean).join(" ") || null,
          decision_maker_title: emailData.position || null,
          email: emailData.value,
          website: `https://${domain}`,
          source: "hunter",
          source_detail: `Hunter Domain Search — ${domain}`,
          status: "new",
        }),
      });
      toast.success("Saved as Lead");
      onLeadSaved?.();
    } catch {
      toast.error("Failed to save lead");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="w-full max-w-md bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl p-6 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold tracking-tight text-slate-100">Hunter API</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error or Credits */}
        {error ? (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-4 text-rose-400 text-xs">
            {error}
          </div>
        ) : credits ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4 flex justify-between items-center text-emerald-400 text-xs">
            <span>Search Credits</span>
            <span className="font-bold">{credits.used} / {credits.total} used</span>
          </div>
        ) : null}

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative mb-5">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Enter domain (e.g. acme.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full pl-9 pr-24 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={loading || !domain}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-bold text-xs transition disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
          </button>
        </form>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {results.map((emailData, i) => (
            <div key={i} className="glass p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-medium text-sm text-slate-100 truncate" title={emailData.value}>
                {emailData.value}
              </div>
              {(emailData.first_name || emailData.last_name) && (
                <div className="text-slate-400 text-xs">
                  {emailData.first_name} {emailData.last_name}
                </div>
              )}
              {emailData.position && (
                <div className="text-slate-500 text-xs italic">{emailData.position}</div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full font-semibold border border-amber-500/20">
                  Confidence: {emailData.confidence}%
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => verifyEmail(emailData.value)}
                    disabled={verifying[emailData.value]}
                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition disabled:opacity-50"
                    title="Verify Email"
                  >
                    {verifying[emailData.value] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => saveLead(emailData)}
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                    title="Save as Lead"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && results.length === 0 && domain && (
            <div className="text-center text-slate-500 text-xs mt-10">
              Search a domain to discover emails
            </div>
          )}
          {!loading && results.length === 0 && !domain && (
            <div className="text-center text-slate-500 text-xs mt-10">
              Enter a company domain above to start email discovery
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
