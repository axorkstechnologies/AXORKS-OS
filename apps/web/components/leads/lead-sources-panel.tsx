"use client";

import React from "react";
import { ExternalLink, Zap, Sparkles, MapPin } from "lucide-react";

interface LeadSourcesPanelProps {
  onOpenEnrichment: (provider: "hunter" | "tomba" | "prospeo" | "snov" | "unified", mode?: "domain" | "location") => void;
}

export function LeadSourcesPanel({ onOpenEnrichment }: LeadSourcesPanelProps) {
  const manualSources = [
    { name: "Google Maps", icon: "🔎", url: "https://maps.google.com" },
    { name: "Manta", icon: "🏢", url: "https://www.manta.com" },
    { name: "Yelp", icon: "⭐", url: "https://www.yelp.com" },
    { name: "BBB", icon: "🛡️", url: "https://www.bbb.org" },
    { name: "LinkedIn", icon: "💼", url: "https://www.linkedin.com" },
    { name: "Clutch", icon: "💻", url: "https://clutch.co" },
    { name: "GoodFirms", icon: "📊", url: "https://www.goodfirms.co" },
  ];

  const apiTools = [
    { id: "hunter", name: "Hunter.io", icon: "🎯", color: "text-amber-400 border-amber-500/30" },
    { id: "tomba", name: "Tomba.io", icon: "⚡", color: "text-blue-400 border-blue-500/30" },
    { id: "prospeo", name: "Prospeo.io", icon: "🔍", color: "text-emerald-400 border-emerald-500/30" },
    { id: "snov", name: "Snov.io", icon: "🚀", color: "text-purple-400 border-purple-500/30" },
  ];

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" /> LEAD SOURCES & ENRICHMENT TOOLS
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenEnrichment("unified", "location")}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/20 transition"
          >
            <MapPin className="w-3.5 h-3.5" /> Search by Location + Industry
          </button>
          <button
            onClick={() => onOpenEnrichment("unified", "domain")}
            className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-violet-600/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" /> Launch Multi-Tool Finder
          </button>
        </div>
      </div>

      {/* API Tools Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {apiTools.map((tool) => (
          <div
            key={tool.id}
            className={`flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border ${tool.color} transition hover:border-slate-600`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <span>{tool.icon}</span>
              <span>{tool.name}</span>
            </div>
            <button
              onClick={() => onOpenEnrichment(tool.id as any, "domain")}
              className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-violet-600/20 text-violet-300 hover:bg-violet-600 hover:text-white transition"
            >
              <span>API</span>
              <Zap className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Manual Search Directories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {manualSources.map((source) => (
          <div
            key={source.name}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-800 hover:bg-slate-800/60 transition"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="text-sm">{source.icon}</span>
              <span className="truncate text-[11px] font-medium">{source.name}</span>
            </div>
            <button
              onClick={() => window.open(source.url, "_blank")}
              className="p-1 rounded text-slate-400 hover:text-violet-400 transition"
              title={`Open ${source.name}`}
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
