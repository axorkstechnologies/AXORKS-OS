"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  LayoutTemplate,
  History,
  Sparkles,
  Plus,
  RefreshCw,
  Crown,
  Trophy,
  Users,
  Building2,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { EmailInboxList } from "@/components/email/email-inbox-list";
import { EmailThreadViewer } from "@/components/email/email-thread-viewer";
import { EmailAnalyticsPanel } from "@/components/email/email-analytics-panel";
import { EmailLeaderboard } from "@/components/email/email-leaderboard";
import { ComposeEmail } from "@/components/email/ComposeEmail";
import { type WorkspaceEmailRecord } from "@/lib/email/constants";

export default function EmailCenterPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isFounder = Boolean(
    user?.role === "Founder" ||
      user?.email === "mujahidaryan222149@gmail.com" ||
      user?.email === "muhammad.mujahid@axorks.com"
  );

  const [activeTab, setActiveTab] = useState<"inbox" | "analytics" | "leaderboard" | "compose">("inbox");
  const [selectedEmail, setSelectedEmail] = useState<WorkspaceEmailRecord | null>(null);
  const [replyConfig, setReplyConfig] = useState<{
    to: string;
    subject: string;
    senderAlias: string;
    threadId?: string;
    inReplyTo?: string;
  } | null>(null);

  // 1. Google Workspace Connection Status
  const { data: googleStatusData, isLoading: isStatusLoading } = useQuery({
    queryKey: ["google-workspace-status"],
    queryFn: () => apiClient("/api/v1/email/gmail/status"),
  });

  const googleStatus = googleStatusData?.data || (googleStatusData as any) || { connected: false };

  // 2. Google OAuth Connect trigger (Founder Only)
  const handleConnectGoogle = async () => {
    if (!isFounder) {
      toast.error("Only the Founder can manage Google Workspace authorization.");
      return;
    }
    try {
      const response = await fetch("/api/v1/email/gmail/auth");
      const json = await response.json().catch(() => ({}));
      const targetUrl = json?.authUrl || json?.data?.authUrl;

      if (response.ok && targetUrl) {
        window.location.href = targetUrl;
        return;
      }

      if (json?.error) {
        toast.error(`Google Auth Error: ${json.error}`);
        return;
      }

      window.location.href = "/api/v1/email/gmail/auth?redirect=true";
    } catch (err: any) {
      console.error("Error connecting to Google Workspace:", err);
      window.location.href = "/api/v1/email/gmail/auth?redirect=true";
    }
  };

  // 3. Sync Gmail Inbox (Founder Only)
  const syncMutation = useMutation({
    mutationFn: () => apiClient("/api/v1/email/inbox", { method: "POST" }),
    onSuccess: (res) => {
      if (res?.success) {
        toast.success(res.message || "Gmail inbox synced with Google Workspace");
        queryClient.invalidateQueries({ queryKey: ["workspace-inbox"] });
        queryClient.invalidateQueries({ queryKey: ["email-analytics"] });
      } else {
        toast.info(res?.message || "Sync completed");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to sync Gmail inbox");
    },
  });

  const handleReplyFromViewer = (data: {
    to: string;
    subject: string;
    senderAlias: string;
    threadId?: string;
    inReplyTo?: string;
  }) => {
    setSelectedEmail(null);
    setReplyConfig(data);
    setActiveTab("compose");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-violet-600 dark:text-violet-400" /> Google Workspace Email Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-violet-100 text-violet-800 border border-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/40">
              {isFounder ? "muhammad.mujahid@axorks.com" : "Axorks Business Aliases"}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
            {isFounder
              ? "Enterprise email intelligence, Gmail API synchronization, alias routing, and conversion tracking"
              : "Business alias inbox: sales@, contact@, hello@, and careers@axorks.com"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/email/followups"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-100 dark:bg-amber-500/15 text-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/25 transition shadow-xs"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Follow-up Queue
          </Link>
          <Link
            href="/email/templates"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition shadow-xs"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> Templates
          </Link>
          <button
            onClick={() => {
              setReplyConfig(null);
              setActiveTab("compose");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-violet-600/30 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Email
          </button>
        </div>
      </div>

      {/* Google Workspace Connection Banner (Founder Exclusive controls) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 via-amber-500 to-emerald-500 p-0.5 shrink-0 shadow-md">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Mail className="w-5 h-5 text-slate-900 dark:text-white" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                Google Workspace • axorks.com
              </span>
              {googleStatus.connected ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  API Active & Verified
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Ready to Connect
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
              Synced Aliases:{" "}
              <strong className="text-slate-900 dark:text-white">
                sales@ • contact@ • hello@ • careers@axorks.com
              </strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isFounder ? (
            <>
              <button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-violet-600 dark:text-violet-400 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                <span>{syncMutation.isPending ? "Syncing..." : "Sync Gmail Inbox"}</span>
              </button>

              <button
                onClick={handleConnectGoogle}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-md shadow-violet-600/30 transition flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Reauthorize Workspace</span>
              </button>
            </>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Workspace Active (Managed by Founder)</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => {
              setActiveTab("inbox");
              setSelectedEmail(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition border ${
              activeTab === "inbox"
                ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Mail className="w-3.5 h-3.5 inline-block mr-1.5" /> Alias Inbox
          </button>

          <button
            onClick={() => {
              setActiveTab("analytics");
              setSelectedEmail(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition border ${
              activeTab === "analytics"
                ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 inline-block mr-1.5" /> Performance & Conversion
          </button>

          <button
            onClick={() => {
              setActiveTab("leaderboard");
              setSelectedEmail(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition border ${
              activeTab === "leaderboard"
                ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 inline-block mr-1.5" /> Outreach Leaderboard
          </button>

          <button
            onClick={() => {
              setReplyConfig(null);
              setActiveTab("compose");
              setSelectedEmail(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition border ${
              activeTab === "compose"
                ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Plus className="w-3.5 h-3.5 inline-block mr-1.5" /> Compose Email
          </button>
        </div>
      </div>

      {/* Main Tab Panels */}
      {activeTab === "inbox" && (
        <div className="space-y-4">
          {selectedEmail ? (
            <div className="space-y-3">
              <button
                onClick={() => setSelectedEmail(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition border border-slate-300 dark:border-slate-700"
              >
                ← Back to Inbox
              </button>
              <EmailThreadViewer
                email={selectedEmail}
                onClose={() => setSelectedEmail(null)}
                onReply={handleReplyFromViewer}
              />
            </div>
          ) : (
            <EmailInboxList onSelectEmail={(email) => setSelectedEmail(email)} />
          )}
        </div>
      )}

      {activeTab === "analytics" && <EmailAnalyticsPanel />}

      {activeTab === "leaderboard" && <EmailLeaderboard />}

      {activeTab === "compose" && (
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-violet-600 dark:text-violet-400" /> New Outreach Dispatch
              </h2>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Send from official alias with live tracking and Gemini AI generator
              </p>
            </div>
            <button
              onClick={() => setActiveTab("inbox")}
              className="p-1 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <ComposeEmail
            initialTo={replyConfig?.to ? [replyConfig.to] : undefined}
            initialSubject={replyConfig?.subject}
            initialSenderAlias={replyConfig?.senderAlias}
            inReplyTo={replyConfig?.inReplyTo}
            threadId={replyConfig?.threadId}
            onSuccess={() => {
              setActiveTab("inbox");
              queryClient.invalidateQueries({ queryKey: ["workspace-inbox"] });
            }}
          />
        </div>
      )}
    </div>
  );
}
