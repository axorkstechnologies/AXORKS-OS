"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Save,
  ArrowLeft,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  BookOpen,
  Pin,
  Clock,
  User,
  Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function KnowledgePageDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isFounder = Boolean(
    user?.role === "Founder" ||
      user?.email === "mujahidaryan222149@gmail.com" ||
      user?.email === "muhammad.mujahid@axorks.com"
  );

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("sop");
  const [icon, setIcon] = useState("📋");
  const [isPinned, setIsPinned] = useState(false);

  const { data: pageData, isLoading } = useQuery<any>({
    queryKey: ["knowledge-page", slug],
    queryFn: () => apiClient(`/api/v1/knowledge/pages/by-slug/${slug}`),
    enabled: !!slug,
  });

  const page = (pageData as any)?.data || pageData;

  useEffect(() => {
    if (page) {
      setTitle(page.title || "");
      setContent(page.content || "");
      setCategory(page.category || "sop");
      setIcon(page.icon || "📋");
      setIsPinned(Boolean(page.is_pinned));
    }
  }, [page]);

  const savePageMutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/knowledge/pages/${page.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          content,
          category,
          icon,
          is_pinned: isPinned,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-page", slug] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-pages"] });
      toast.success("SOP document updated successfully!");
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save document");
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: () => apiClient(`/api/v1/knowledge/pages/${page.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-pages"] });
      toast.success("Document deleted");
      router.push("/knowledge");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete document");
    },
  });

  if (isLoading || !page) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 font-mono">
        Loading SOP document from Neon DB...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <button
          onClick={() => router.push("/knowledge")}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge Center
        </button>

        <div className="flex items-center gap-2.5">
          {isFounder && (
            <>
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => savePageMutation.mutate()}
                    disabled={savePageMutation.isPending}
                    className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-md shadow-violet-600/30 transition flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savePageMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-violet-400" /> Edit SOP
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this SOP document permanently?")) {
                        deletePageMutation.mutate();
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 text-xs transition shadow-xs"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </>
          )}

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Document link copied to clipboard!");
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs transition shadow-xs"
            title="Copy link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Document Container */}
      <div className="bg-slate-950/90 rounded-3xl border border-slate-800 p-6 md:p-10 space-y-6 shadow-2xl backdrop-blur-md">
        {/* Document Header */}
        <div className="space-y-3 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-12 h-12 text-2xl text-center bg-slate-900 border border-slate-700 rounded-2xl text-white font-bold"
              />
            ) : (
              <span className="text-3xl p-3 rounded-2xl bg-slate-900 border border-slate-700">
                {page.icon || "📋"}
              </span>
            )}

            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-black text-white bg-slate-900 border border-slate-700 px-3.5 py-1.5 rounded-xl w-full"
                />
              ) : (
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  {page.title}
                </h1>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium mt-2">
                <span className="font-bold text-violet-300 capitalize">
                  Category: {page.category || "SOP"}
                </span>
                <span>•</span>
                <span>Author: {page.author_name || "Muhammad Mujahid (Founder)"}</span>
                <span>•</span>
                <span className="font-mono text-slate-400">
                  Updated: {new Date(page.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Content View / Editor */}
        {isEditing ? (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              SOP Document Body (Markdown formatted)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={28}
              className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono leading-relaxed focus:outline-none focus:border-violet-500"
            />
          </div>
        ) : (
          <div className="prose prose-invert max-w-none prose-headings:font-black prose-headings:text-white prose-p:text-slate-200 prose-p:leading-relaxed prose-li:text-slate-200 prose-strong:text-white prose-table:border-slate-700 prose-th:bg-slate-900 prose-th:text-white prose-th:font-bold prose-td:border-slate-800 prose-td:text-slate-200 text-sm whitespace-pre-wrap font-sans">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
