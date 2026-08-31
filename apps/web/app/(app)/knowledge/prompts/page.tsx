"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Sparkles, Plus, Copy, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["sales", "engineering", "marketing", "hr", "general"];

export default function PromptLibraryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [promptText, setPromptText] = useState("");
  const [description, setDescription] = useState("");

  const { data: prompts = [] } = useQuery({
    queryKey: ["ai-prompts", filterCat],
    queryFn: () => {
      const params = filterCat ? `?category=${filterCat}` : "";
      return apiClient(`/api/v1/knowledge/prompts${params}`).then((r: any) => r.data);
    },
  });

  const createPrompt = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/knowledge/prompts", {
        method: "POST",
        body: JSON.stringify({ title, category, prompt_text: promptText, description }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
      toast.success("Prompt saved to library!");
      setShowCreate(false);
      setTitle("");
      setPromptText("");
      setDescription("");
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Prompt copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={() => router.push("/knowledge")} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Knowledge Center
          </button>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" /> AI Prompt Library
          </h1>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">Curated, reusable AI prompts organized by team function</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-600/30 transition transform active:scale-95 shrink-0">
          <Plus className="w-4 h-4" /> Add Prompt
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat(null)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${!filterCat ? "bg-violet-600 text-white border-violet-500 shadow-xs" : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition border ${filterCat === c ? "bg-violet-600 text-white border-violet-500 shadow-xs" : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{c}</button>
        ))}
      </div>

      {/* Create Prompt Form */}
      {showCreate && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-w-lg space-y-4 shadow-xl">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Add Reusable AI Prompt</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Prompt title"
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 font-medium"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-bold"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 font-medium"
          />
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={4}
            placeholder="Write the full AI prompt template here..."
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono leading-relaxed"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold">
              Cancel
            </button>
            <button
              onClick={() => createPrompt.mutate()}
              disabled={!title.trim() || !promptText.trim() || createPrompt.isPending}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black transition disabled:opacity-50"
            >
              Save Prompt
            </button>
          </div>
        </div>
      )}

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium shadow-sm">
            No prompts found in this category. Click &quot;Add Prompt&quot; to create one.
          </div>
        ) : (
          prompts.map((p: any) => (
            <div key={p.id} className="p-5 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white">{p.title}</span>
                  <span className="text-[10px] uppercase font-bold text-violet-800 dark:text-violet-300 bg-violet-100 dark:bg-violet-500/20 border border-violet-300 dark:border-violet-500/40 px-2 py-0.5 rounded-md">{p.category}</span>
                </div>
                {p.description && <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mb-2">{p.description}</p>}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-200 font-mono line-clamp-3 leading-relaxed">
                  {p.prompt_text}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(p.prompt_text)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition border border-slate-300 dark:border-slate-700 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Prompt
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
