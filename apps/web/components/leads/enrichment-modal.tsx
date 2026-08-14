"use client";

import { useState } from "react";
import { X, Search, Zap, CheckCircle2, Plus, Sparkles, AlertCircle, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface EnrichmentModalProps {
  open: boolean;
  onClose: () => void;
  onLeadSaved: () => void;
  initialProvider?: "hunter" | "tomba" | "prospeo" | "snov" | "unified";
}

export function EnrichmentModal({ open, onClose, onLeadSaved, initialProvider = "unified" }: EnrichmentModalProps) {
  const [activeProvider, setActiveProvider] = useState<"hunter" | "tomba" | "prospeo" | "snov" | "unified">(initialProvider);
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [credits, setCredits] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState<string | null>(null);

  if (!open) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    setResults([]);
    setCredits(null);

    try {
      if (activeProvider === "hunter") {
        const res = await fetch(`/api/v1/hunter/domain-search?domain=${encodeURIComponent(domain)}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setResults(json.data.emails || []);
          if (json.data.credits_remaining !== undefined) {
            setCredits(`${json.data.credits_remaining} credits left`);
          }
          toast.success(`Found ${json.data.emails?.length || 0} emails via Hunter.io`);
        } else {
          toast.error(json.error || "Hunter search failed");
        }
      } else if (activeProvider === "tomba") {
        const res = await fetch(`/api/v1/enrichment/tomba?domain=${encodeURIComponent(domain)}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setResults(json.data || []);
          toast.success(`Found ${json.data?.length || 0} emails via Tomba.io`);
        } else {
          toast.error(json.error || "Tomba search failed");
        }
      } else if (activeProvider === "snov") {
        const res = await fetch(`/api/v1/enrichment/snov?domain=${encodeURIComponent(domain)}`);
        const json = await res.json();
        if (res.ok && json.emails) {
          setResults(json.emails || []);
          toast.success(`Found ${json.emails?.length || 0} emails via Snov.io`);
        } else {
          toast.error(json.error || "Snov.io search failed");
        }
      } else if (activeProvider === "prospeo") {
        const res = await fetch("/api/v1/enrichment/prospeo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });
        const json = await res.json();
        if (res.ok && json.email) {
          setResults([{ email: json.email, status: json.status, confidence: json.score }]);
          toast.success("Found email via Prospeo.io!");
        } else {
          toast.error(json.error || "No email found via Prospeo");
        }
      } else {
        // Unified search
        const res = await fetch(`/api/v1/enrichment/domain-search?domain=${encodeURIComponent(domain)}`);
        const json = await res.json();
        if (res.ok && json.data?.emails) {
          setResults(json.data.emails || []);
          toast.success(`Found ${json.data.emails.length} verified emails across multiple providers!`);
        } else {
          toast.error(json.errors?.[0]?.message || "Unified domain search failed");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Domain search error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsLead = async (item: any) => {
    setSavingEmail(item.email);
    try {
      await apiClient("/api/v1/leads", {
        method: "POST",
        body: JSON.stringify({
          business_name: domain.split(".")[0].toUpperCase() + " Corp",
          website: `https://${domain}`,
          decision_maker_name: item.first_name ? `${item.first_name} ${item.last_name || ""}`.trim() : "Lead Contact",
          decision_maker_title: item.position || item.title || "Decision Maker",
          email: item.email,
          source: activeProvider,
          status: "new",
          score: item.confidence || 80,
          notes: `Enriched via ${activeProvider.toUpperCase()} API finder.`,
        }),
      });

      toast.success(`Saved ${item.email} to Neon DB as a new lead!`);
      onLeadSaved();
    } catch (err: any) {
      toast.error(err.message || "Failed to save lead");
    } finally {
      setSavingEmail(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-950 border border-slate-700 text-slate-100 p-6 rounded-2xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Lead Finder & Email Enrichment Engine</h2>
              <p className="text-xs text-slate-400">Discover verified decision-maker emails using free API tiers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {[
            { id: "unified", name: "⚡ All Tools (Unified)" },
            { id: "hunter", name: "Hunter.io" },
            { id: "tomba", name: "Tomba.io" },
            { id: "prospeo", name: "Prospeo.io" },
            { id: "snov", name: "Snov.io" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveProvider(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeProvider === tab.id
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain (e.g. apextech.example.com)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !domain.trim()}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            {loading ? "Searching..." : "Find Emails"}
          </button>
        </form>

        {/* Results List & Credit Counter */}
        {credits && (
          <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> API Status: {credits}
          </div>
        )}

        <div className="space-y-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Querying {activeProvider.toUpperCase()} API...</div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Enter a company domain above to discover verified employee email addresses.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                      <User className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-100 flex items-center gap-2">
                        {item.email}
                        {item.confidence && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {item.confidence}% match
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.first_name ? `${item.first_name} ${item.last_name || ""}` : "Verified Decision Maker"}{" "}
                        {item.position ? `• ${item.position}` : ""}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveAsLead(item)}
                    disabled={savingEmail === item.email}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {savingEmail === item.email ? "Saving..." : "Save as Lead"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
