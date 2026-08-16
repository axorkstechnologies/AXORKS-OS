"use client";

import React from "react";
import { ExternalLink, Zap, Sparkles, MapPin } from "lucide-react";

interface LeadSourcesPanelProps {
  onOpenEnrichment: (
    provider: "hunter" | "tomba" | "prospeo" | "snov" | "unified",
    mode?: "domain" | "location"
  ) => void;
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
    { id: "hunter", name: "Hunter.io", icon: "🎯", color: "text-amber-500 border-amber-500/30" },
    { id: "tomba", name: "Tomba.io", icon: "⚡", color: "text-blue-500 border-blue-500/30" },
    { id: "prospeo", name: "Prospeo.io", icon: "🔍", color: "text-emerald-500 border-emerald-500/30" },
    { id: "snov", name: "Snov.io", icon: "🚀", color: "text-purple-500 border-purple-500/30" },
  ];

  return (
    <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-500" /> Lead Sources & Multi-API Enrichment
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Query Hunter, Tomba, Prospeo, and Snov or discover local B2B prospects by city
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenEnrichment("unified", "location")}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition transform active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5" /> City Discovery
          </button>
          <button
            onClick={() => onOpenEnrichment("unified", "domain")}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-violet-600/30 transition transform active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" /> Domain Search
          </button>
        </div>
      </div>

      {/* API Tools Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {apiTools.map((tool) => (
          <div
            key={tool.id}
            className={`flex items-center justify-between p-3 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border ${tool.color} transition hover:border-violet-500/50 group`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="text-base">{tool.icon}</span>
              <span>{tool.name}</span>
            </div>
            <button
              onClick={() => onOpenEnrichment(tool.id as any, "domain")}
              className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-violet-600/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition"
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
            className="flex items-center justify-between p-2 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="text-sm">{source.icon}</span>
              <span className="truncate text-[11px] font-semibold">{source.name}</span>
            </div>
            <button
              onClick={() => window.open(source.url, "_blank")}
              className="p-1 rounded text-slate-400 hover:text-violet-500 transition"
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
