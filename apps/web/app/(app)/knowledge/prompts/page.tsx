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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push("/knowledge")} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition mb-2">
            <ArrowLeft className="w-3 h-3" /> Knowledge Base
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" /> AI Prompt Library
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Curated, reusable AI prompts organized by team function</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition">
          <Plus className="w-3.5 h-3.5" /> Add Prompt
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2">
        <button onClick={() => setFilterCat(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!filterCat ? "bg-violet-600/20 text-violet-300 border border-violet-500/40" : "text-slate-400 hover:bg-slate-900"}`}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${filterCat === c ? "bg-violet-600/20 text-violet-300 border border-violet-500/40" : "text-slate-400 hover:bg-slate-900"}`}>{c}</button>
        ))}
      </div>

      {/* Create Prompt Form */}
      {showCreate && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 max-w-lg space-y-3">
          <h2 className="text-sm font-semibold text-white">Add to Prompt Library</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Prompt title" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100">
            {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Prompt text..." rows={4} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 resize-none font-mono" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 rounded bg-slate-800 text-slate-400 text-xs">Cancel</button>
            <button onClick={() => createPrompt.mutate()} disabled={!title.trim() || !promptText.trim()} className="px-4 py-1.5 rounded bg-violet-600 text-white text-xs disabled:opacity-50">Save Prompt</button>
          </div>
        </div>
      )}

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prompts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 border border-slate-800 rounded-xl">No prompts in this category yet.</div>
        ) : (
          prompts.map((p: any) => (
            <div key={p.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 group">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs">{p.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold capitalize">{p.category}</span>
              </div>
              {p.description && <p className="text-[11px] text-slate-500">{p.description}</p>}
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/60 text-[11px] text-violet-300 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-auto">{p.prompt_text}</pre>
              <button onClick={() => copyToClipboard(p.prompt_text)} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-violet-300 transition">
                <Copy className="w-3 h-3" /> Copy to clipboard
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
