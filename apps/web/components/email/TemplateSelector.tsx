"use client";

import { useState } from "react";
import { EMAIL_TEMPLATES, EmailTemplate } from "@/lib/email/templates";
import { LayoutTemplate, Search, Check, Sparkles, X } from "lucide-react";

interface TemplateSelectorProps {
  onSelect: (template: EmailTemplate) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const filtered = EMAIL_TEMPLATES.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || t.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition shadow-sm"
      >
        <LayoutTemplate className="w-3.5 h-3.5 text-violet-400" />
        Choose Template
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" /> High-Impact Email Templates
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Select a template to pre-fill your email subject and HTML body.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search */}
            <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium"
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {["all", "sales", "projects", "finance", "support", "general"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-xs capitalize px-3 py-1 rounded-xl font-bold transition border ${
                      category === cat
                        ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Cards List */}
            <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh]">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    onSelect(t);
                    setIsOpen(false);
                  }}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-violet-500/60 hover:bg-slate-900 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white group-hover:text-violet-300 transition">
                        {t.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 truncate">
                    <strong className="text-slate-300 font-sans">Sub:</strong> {t.subject}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
