"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen, Plus, FileText, Search, Sparkles, ChevronRight } from "lucide-react";

const PAGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  page: { label: "Page", color: "bg-slate-800 text-slate-300" },
  sop: { label: "SOP", color: "bg-blue-500/10 text-blue-400" },
  template: { label: "Template", color: "bg-violet-500/10 text-violet-400" },
  meeting_notes: { label: "Meeting Notes", color: "bg-amber-500/10 text-amber-400" },
};

export default function KnowledgeBasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [pageType, setPageType] = useState("page");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: pages = [] } = useQuery({
    queryKey: ["knowledge-pages"],
    queryFn: () => apiClient("/api/v1/knowledge/pages"),
  });

  const { data: searchResults } = useQuery({
    queryKey: ["knowledge-search", searchQuery],
    queryFn: () => apiClient(`/api/v1/knowledge/pages/search?q=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.length >= 2,
  });

  const createPage = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/knowledge/pages", {
        method: "POST",
        body: JSON.stringify({ title, page_type: pageType, icon: "📄", content: "" }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-pages"] });
      toast.success("Page created!");
      setShowCreate(false);
      setTitle("");
      router.push(`/knowledge/${res.slug}`);
    },
  });

  const displayPages = searchQuery.length >= 2 ? (searchResults || []) : pages;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Knowledge Base</h1>
          <p className="text-xs text-slate-500 mt-0.5">Internal wiki, SOPs, coding standards, meeting notes & AI prompt library</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/knowledge/prompts")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <Sparkles className="w-3.5 h-3.5" /> Prompt Library
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" /> New Page
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search knowledge base..."
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Create Page Modal */}
      {showCreate && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 max-w-md space-y-3">
          <h2 className="text-sm font-semibold text-white">Create New Page</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500" />
          <select value={pageType} onChange={(e) => setPageType(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100">
            <option value="page">Page</option>
            <option value="sop">SOP (Standard Operating Procedure)</option>
            <option value="template">Template</option>
            <option value="meeting_notes">Meeting Notes</option>
          </select>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 rounded bg-slate-800 text-slate-400 text-xs">Cancel</button>
            <button onClick={() => createPage.mutate()} disabled={!title.trim()} className="px-4 py-1.5 rounded bg-violet-600 text-white text-xs disabled:opacity-50">Create</button>
          </div>
        </div>
      )}

      {/* Pages Grid */}
      <div className="space-y-2">
        {displayPages.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 border border-slate-800 rounded-xl">
            {searchQuery ? "No results found." : "No knowledge pages yet. Create your first page to get started."}
          </div>
        ) : (
          displayPages.map((page: any) => (
            <div
              key={page.id}
              onClick={() => router.push(`/knowledge/${page.slug}`)}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{page.icon || "📄"}</span>
                <div>
                  <span className="font-medium text-slate-200 text-xs group-hover:text-violet-300 transition block">{page.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">/{page.slug}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PAGE_TYPE_LABELS[page.page_type]?.color || ""}`}>
                  {PAGE_TYPE_LABELS[page.page_type]?.label || page.page_type}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
