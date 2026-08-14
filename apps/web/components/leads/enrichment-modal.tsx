"use client";

import { useState } from "react";
import { X, Search, Zap, MapPin, Building2, User, Plus, Sparkles, Globe, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface EnrichmentModalProps {
  open: boolean;
  onClose: () => void;
  onLeadSaved: () => void;
  initialProvider?: "hunter" | "tomba" | "prospeo" | "snov" | "unified";
  initialMode?: "domain" | "location";
}

export function EnrichmentModal({
  open,
  onClose,
  onLeadSaved,
  initialProvider = "unified",
  initialMode = "location",
}: EnrichmentModalProps) {
  const [searchMode, setSearchMode] = useState<"domain" | "location">(initialMode);
  const [activeProvider, setActiveProvider] = useState<"hunter" | "tomba" | "prospeo" | "snov" | "unified">(initialProvider);

  // Domain search state
  const [domain, setDomain] = useState("");

  // Location + Business Type search state
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [credits, setCredits] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState<string | null>(null);

  if (!open) return null;

  // Domain Search submit handler
  const handleDomainSearch = async (e: React.FormEvent) => {
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

  // Location + Business Type Search submit handler
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType.trim() || !location.trim()) {
      toast.error("Please enter both Business Type and Location");
      return;
    }

    setLoading(true);
    setResults([]);
    setCredits(null);

    try {
      const res = await fetch(
        `/api/v1/enrichment/location-search?business_type=${encodeURIComponent(businessType)}&location=${encodeURIComponent(location)}`
      );
      const json = await res.json();

      if (res.ok && json.success && json.leads) {
        setResults(json.leads);
        toast.success(`Discovered ${json.leads.length} leads in ${location}!`);
      } else {
        toast.error(json.error || "Location search failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Location discovery error");
    } finally {
      setLoading(false);
    }
  };

  // Save Lead Handler
  const handleSaveAsLead = async (item: any) => {
    setSavingEmail(item.email);
    try {
      await apiClient("/api/v1/leads", {
        method: "POST",
        body: JSON.stringify({
          business_name: item.business_name || (domain ? domain.split(".")[0].toUpperCase() + " Corp" : "New Prospect"),
          website: item.website || (domain ? `https://${domain}` : null),
          decision_maker_name: item.decision_maker_name || (item.first_name ? `${item.first_name} ${item.last_name || ""}`.trim() : "Lead Contact"),
          decision_maker_title: item.decision_maker_title || item.position || item.title || "Decision Maker",
          email: item.email,
          country: item.country || location || null,
          industry: item.industry || businessType || null,
          source: searchMode === "location" ? "location_discovery" : activeProvider,
          status: "new",
          score: item.confidence || item.score || 85,
          notes: searchMode === "location"
            ? `Discovered via Location Search (${businessType} in ${location}).`
            : `Enriched via ${activeProvider.toUpperCase()} domain finder.`,
        }),
      });

      toast.success(`Saved ${item.business_name || item.email} to Neon DB as a new lead!`);
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Lead Finder & Email Enrichment Engine</h2>
              <p className="text-xs text-slate-400">Discover prospective client leads by Location or Company Domain</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSearchMode("location")}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
              searchMode === "location"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MapPin className="w-4 h-4" /> Search by Location & Business Type
          </button>
          <button
            type="button"
            onClick={() => setSearchMode("domain")}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
              searchMode === "domain"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-4 h-4" /> Search by Domain Name
          </button>
        </div>

        {/* MODE 1: Location + Business Type Search Form */}
        {searchMode === "location" ? (
          <form onSubmit={handleLocationSearch} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Business Type / Industry</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="e.g. web design agencies, restaurants, accounting..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Area / City</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. London, Dubai, New York, Sydney..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-[11px] text-slate-400">
                Quick examples: <button type="button" onClick={() => { setBusinessType("web design agencies"); setLocation("London"); }} className="text-violet-400 hover:underline">Web design London</button> • <button type="button" onClick={() => { setBusinessType("restaurants"); setLocation("Dubai"); }} className="text-violet-400 hover:underline">Restaurants Dubai</button>
              </span>
              <button
                type="submit"
                disabled={loading || !businessType.trim() || !location.trim()}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                {loading ? "Discovering Leads..." : "Discover Leads"}
              </button>
            </div>
          </form>
        ) : (
          /* MODE 2: Domain Search Form */
          <div className="space-y-3">
            {/* Provider Tabs */}
            <div className="flex flex-wrap gap-2">
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
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    activeProvider === tab.id
                      ? "bg-violet-600/20 text-violet-300 border border-violet-500/40"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleDomainSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Enter domain (e.g. apextech.example.com)..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !domain.trim()}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                {loading ? "Searching..." : "Find Emails"}
              </button>
            </form>
          </div>
        )}

        {/* Results List */}
        {credits && (
          <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> API Status: {credits}
          </div>
        )}

        <div className="space-y-2">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Searching API database & discovering leads...</div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              {searchMode === "location"
                ? "Enter Business Type & Location above (e.g. 'web design agencies' in 'London') to discover prospects."
                : "Enter a company domain above to discover decision-maker emails."}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                      {searchMode === "location" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-100 flex items-center gap-2">
                        {item.business_name || item.email}
                        {item.score || item.confidence ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {item.score || item.confidence}% match
                          </span>
                        ) : null}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.decision_maker_name || (item.first_name ? `${item.first_name} ${item.last_name || ""}` : "Verified Decision Maker")}
                        {" • "}
                        <span className="text-slate-300 font-mono">{item.email}</span>
                        {item.location && <span className="text-slate-400"> ({item.location})</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveAsLead(item)}
                    disabled={savingEmail === item.email}
                    className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1 shrink-0 disabled:opacity-50"
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
