"use client";

import { useState } from "react";
import Link from "next/link";
import { EMAIL_TEMPLATES, EmailTemplate } from "@/lib/email/templates";
import {
  LayoutTemplate,
  ArrowLeft,
  Search,
  Plus,
  Sparkles,
  Copy,
  Check,
  Zap,
  TrendingUp,
  Briefcase,
  DollarSign,
  Headphones,
  FileText,
  Eye,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function EmailTemplatesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const filtered = EMAIL_TEMPLATES.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopySubject = (subject: string, id: string) => {
    navigator.clipboard.writeText(subject);
    setCopiedId(id);
    toast.success("Subject line copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "sales":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold";
      case "projects":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold";
      case "finance":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold";
      case "support":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold";
      default:
        return "bg-violet-500/20 text-violet-300 border-violet-500/40 font-bold";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/email"
            className="p-2.5 rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-violet-400" /> High-Impact Email Templates
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                11 High-Converting Presets
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Short, punchy, 5-second value propositions designed for maximum response rates across sales and delivery
            </p>
          </div>
        </div>

        <Link
          href="/email"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/40 transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" /> New Outreach Dispatch
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row gap-3 items-center justify-between backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by topic, subject, or value prop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {[
            { id: "all", label: "All Presets" },
            { id: "sales", label: "Sales & Outreach" },
            { id: "projects", label: "Client Milestones" },
            { id: "finance", label: "Billing & Quotes" },
            { id: "support", label: "Infrastructure" },
            { id: "general", label: "Relations" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition border ${
                selectedCategory === cat.id
                  ? "bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-600/40"
                  : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="p-5 rounded-3xl bg-slate-950/85 border border-slate-800 hover:border-violet-500/60 transition-all flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-md group hover:shadow-violet-500/10"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-white group-hover:text-violet-300 transition">
                  {t.name}
                </span>
                <span
                  className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md border ${getCategoryBadge(
                    t.category
                  )}`}
                >
                  {t.category}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{t.description}</p>

              {/* Subject Line Pill */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 flex items-center justify-between gap-2">
                <span className="truncate pr-1 text-[11px]">
                  <strong className="text-slate-400 font-sans">Sub:</strong> {t.subject}
                </span>
                <button
                  onClick={() => handleCopySubject(t.subject, t.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0 transition"
                  title="Copy subject line"
                >
                  {copiedId === t.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                onClick={() => setPreviewTemplate(t)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                <Eye className="w-3.5 h-3.5 text-violet-400" /> Preview
              </button>

              <Link
                href="/email"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600 text-violet-200 hover:text-white border border-violet-500/40 text-xs font-bold transition shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" /> Use Template
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* HTML Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <h3 className="text-base font-black text-white">{previewTemplate.name}</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Subject: <span className="text-violet-300 font-bold">{previewTemplate.subject}</span>
                </p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-200 text-sm leading-relaxed">
              <div
                className="prose prose-invert max-w-none prose-p:my-2 prose-headings:text-white prose-a:text-violet-400"
                dangerouslySetInnerHTML={{ __html: previewTemplate.html }}
              />
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewTemplate.html);
                  toast.success("HTML copied to clipboard!");
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy HTML
              </button>

              <Link
                href="/email"
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" /> Apply in Composer
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
