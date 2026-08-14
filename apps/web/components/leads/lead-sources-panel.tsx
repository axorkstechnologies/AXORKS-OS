"use client";

import React from "react";
import { ExternalLink, Zap } from "lucide-react";

interface LeadSourcesPanelProps {
  onOpenHunter: () => void;
}

export function LeadSourcesPanel({ onOpenHunter }: LeadSourcesPanelProps) {
  const sources = [
    { name: "Google Maps", icon: "🔎", url: "https://maps.google.com" },
    { name: "Manta", icon: "🏢", url: "https://www.manta.com" },
    { name: "Yelp", icon: "⭐", url: "https://www.yelp.com" },
    { name: "BBB", icon: "🛡️", url: "https://www.bbb.org" },
    { name: "LinkedIn", icon: "💼", url: "https://www.linkedin.com" },
    { name: "Clutch", icon: "💻", url: "https://clutch.co" },
    { name: "GoodFirms", icon: "📊", url: "https://www.goodfirms.co" },
  ];

  return (
    <div className="glass rounded-xl p-6 flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-tight">LEAD SOURCES</h2>
      <div className="flex flex-col gap-2">
        {sources.map((source) => (
          <div
            key={source.name}
            className="flex items-center justify-between p-3 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{source.icon}</span>
              <span className="font-medium">{source.name}</span>
            </div>
            <button
              onClick={() => window.open(source.url, "_blank")}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              <span>Open</span>
              <ExternalLink size={14} />
            </button>
          </div>
        ))}

        <div className="flex items-center justify-between p-3 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 transition-colors border border-amber-500/30">
          <div className="flex items-center gap-3">
            <span className="text-xl">📧</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">Hunter</span>
          </div>
          <button
            onClick={onOpenHunter}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 transition-colors font-medium"
          >
            <span>API</span>
            <Zap size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
