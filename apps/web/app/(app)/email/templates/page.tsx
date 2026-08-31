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
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "projects":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "finance":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "support":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-violet-500/15 text-violet-400 border-violet-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/email"
            className="p-2.5 rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-violet-400" /> High-Impact Email Templates
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                11 High-Converting Presets
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Short, punchy, 5-second value propositions designed for maximum response rates across sales and delivery
            </p>
          </div>
        </div>

        <Link
          href="/email/compose"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" /> New Outreach Dispatch
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row gap-3 items-center justify-between backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by topic, subject, or value prop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
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
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700"
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
            className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/50 transition-all flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-md group hover:shadow-violet-500/5"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100 group-hover:text-violet-400 transition">
                  {t.name}
                </span>
                <span
                  className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md border ${getCategoryBadge(
                    t.category
                  )}`}
                >
                  {t.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{t.description}</p>

              {/* Subject Line Pill */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between gap-2">
                <span className="truncate pr-1 text-[11px]">
                  <strong className="text-slate-500 font-sans">Sub:</strong> {t.subject}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopySubject(t.subject, t.id)}
                  title="Copy subject line"
                  className="p-1 rounded-lg text-slate-400 hover:text-violet-400 transition shrink-0"
                >
                  {copiedId === t.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setPreviewTemplate(t)}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 text-xs font-medium"
              >
                <Eye className="w-3.5 h-3.5 text-violet-400" /> Preview HTML
              </button>
              <Link
                href={`/email/compose?template=${t.id}`}
                className="font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 group-hover:translate-x-0.5 transition transform"
              >
                Apply in Compose →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* HTML Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{previewTemplate.name}</h3>
                <span className="text-xs text-slate-400 font-mono">Subject: {previewTemplate.subject}</span>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-white text-slate-900 max-h-[50vh] overflow-y-auto font-sans text-sm shadow-inner">
              <div dangerouslySetInnerHTML={{ __html: previewTemplate.html }} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">Axorks Clean HTML Standard</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
                <Link
                  href={`/email/compose?template=${previewTemplate.id}`}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/30"
                >
                  Use Template in Composer
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
