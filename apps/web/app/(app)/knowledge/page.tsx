"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  FileText,
  Search,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Crown,
  Pin,
  Clock,
  Layers,
  FolderOpen,
  CheckCircle2,
  X,
  FileCode2,
} from "lucide-react";

const CATEGORY_TABS = [
  { id: "all", label: "All Documents" },
  { id: "sop", label: "Standard Operating Procedures (SOP)" },
  { id: "marketing", label: "Marketing & Outreach" },
  { id: "engineering", label: "Engineering Standards" },
  { id: "template", label: "Process Templates" },
];

export default function KnowledgeBasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isFounder = Boolean(
    user?.role === "Founder" ||
      user?.email === "mujahidaryan222149@gmail.com" ||
      user?.email === "muhammad.mujahid@axorks.com"
  );

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("sop");
  const [pageType, setPageType] = useState("sop");
  const [icon, setIcon] = useState("📋");
  const [initialContent, setInitialContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: pagesResponse, isLoading } = useQuery<{ success: boolean; data: any[] } | any[]>({
    queryKey: ["knowledge-pages", searchQuery, selectedCategory],
    queryFn: () => {
      let url = "/api/v1/knowledge/pages";
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (params.toString()) url += `?${params.toString()}`;
      return apiClient(url);
    },
  });

  const pages: any[] = Array.isArray(pagesResponse)
    ? pagesResponse
    : (pagesResponse as any)?.data || [];

  const createPageMutation = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/knowledge/pages", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          category,
          page_type: pageType,
          icon: icon.trim() || "📋",
          content: initialContent.trim(),
          is_pinned: isPinned,
        }),
      }),
    onSuccess: (res: any) => {
      const created = res?.data || res;
      queryClient.invalidateQueries({ queryKey: ["knowledge-pages"] });
      toast.success("SOP document created successfully!");
      setShowCreate(false);
      setTitle("");
      setInitialContent("");
      if (created?.slug) {
        router.push(`/knowledge/${created.slug}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create document");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/50 via-slate-950 to-indigo-950/40" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Standard Operating Procedures & Knowledge Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Axorks OS Knowledge & SOP Center</span>
              {isFounder && <Crown className="w-5 h-5 text-amber-400" />}
            </h1>
            <p className="text-slate-300 text-xs md:text-sm font-medium max-w-2xl">
              Official company SOPs, Marketing & Outreach blueprints, engineering architecture guidelines, and operational standards.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {isFounder && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/40 flex items-center gap-2 transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add SOP Document
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition border ${
                selectedCategory === tab.id
                  ? "bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-600/40 font-bold"
                  : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700 font-semibold"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search SOPs and guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium transition"
          />
        </div>
      </div>

      {/* Create SOP Modal (Founder) */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-700 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-400" /> Create Standard Operating Procedure (SOP)
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Document Title *</label>
                <input
                  type="text"
                  placeholder="e.g. B2B Client Discovery Call & Qualification SOP"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none"
                  >
                    <option value="sop">SOP (Process)</option>
                    <option value="marketing">Marketing & Outreach</option>
                    <option value="engineering">Engineering</option>
                    <option value="template">Template</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Icon Emoji</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Initial Document Content (Markdown Supported)</label>
                <textarea
                  rows={6}
                  placeholder="# Purpose&#10;&#10;Describe the SOP purpose and step-by-step guidelines..."
                  value={initialContent}
                  onChange={(e) => setInitialContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinDoc"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-0"
                />
                <label htmlFor="pinDoc" className="text-xs text-slate-200 font-bold cursor-pointer">
                  Pin this document to top of Knowledge Center
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => createPageMutation.mutate()}
                disabled={!title.trim() || createPageMutation.isPending}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition disabled:opacity-50 shadow-md shadow-violet-600/30"
              >
                {createPageMutation.isPending ? "Creating..." : "Save & Open SOP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pages Grid */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-mono">
            Loading Knowledge Base documents from Neon DB...
          </div>
        ) : pages.length === 0 ? (
          <div className="p-12 text-center border border-slate-800 rounded-3xl bg-slate-950/80 space-y-2">
            <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No SOP documents found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ? "Try a different search term" : "The Founder will add process guidelines and SOPs here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.map((page: any) => (
              <div
                key={page.id}
                onClick={() => router.push(`/knowledge/${page.slug}`)}
                className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 hover:border-violet-500/60 hover:bg-slate-900/60 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-xl group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-2xl bg-slate-900 border border-slate-700 group-hover:scale-110 transition-transform shrink-0">
                        {page.icon || "📋"}
                      </span>
                      <div>
                        <h3 className="font-bold text-sm text-white group-hover:text-violet-300 transition">
                          {page.title}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono font-medium">/{page.slug}</span>
                      </div>
                    </div>

                    {page.is_pinned && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans font-normal">
                    {page.content ? page.content.replace(/[#*`_\[\]]/g, "").slice(0, 160) + "..." : "No description available."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="capitalize font-medium text-slate-300">
                    Category: <strong className="text-violet-300 font-bold">{page.category || "SOP"}</strong>
                  </span>
                  <div className="flex items-center gap-1 text-violet-300 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>Read SOP</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
