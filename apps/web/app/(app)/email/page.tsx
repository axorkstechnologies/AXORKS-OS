"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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
import { WorkspaceEmailRecord } from "@/lib/business-repository";

export default function EmailCenterPage() {
  const queryClient = useQueryClient();
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

  // 2. Google OAuth Connect trigger
  const handleConnectGoogle = async () => {
    try {
      const res = await apiClient("/api/v1/email/gmail/auth");
      if (res?.authUrl) {
        window.location.href = res.authUrl;
      } else {
        toast.error("Failed to generate Google authorization URL");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate Google OAuth");
    }
  };

  // 3. Sync Gmail Inbox
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Mail className="w-5 h-5 text-violet-500" /> Google Workspace Email Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              muhammad.mujahid@axorks.com
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise email intelligence, Gmail API synchronization, alias routing, and conversion tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/email/followups"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition shadow-2xs"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Follow-up Queue
          </Link>
          <Link
            href="/email/templates"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-violet-500" /> Templates
          </Link>
          <button
            onClick={() => {
              setReplyConfig(null);
              setActiveTab("compose");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Compose Email
          </button>
        </div>
      </div>

      {/* Google Workspace Connection Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${
            googleStatus.connected
              ? "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20"
              : "bg-gradient-to-tr from-amber-600 to-orange-500 shadow-amber-500/20"
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Google Workspace Connection (Gmail API)
              </h3>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                googleStatus.connected
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {googleStatus.connected ? "Connected & Active" : "OAuth Authorization Ready"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {googleStatus.connected
                ? `Synchronized with ${googleStatus.accountEmail || "muhammad.mujahid@axorks.com"} • All 4 aliases routing live`
                : "Connect muhammad.mujahid@axorks.com to enable direct Gmail API sending and 2-way inbox sync"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {googleStatus.connected ? (
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? "animate-spin text-violet-400" : ""}`} />
              {syncMutation.isPending ? "Syncing..." : "Sync Inbox"}
            </button>
          ) : null}

          <button
            onClick={handleConnectGoogle}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/30 transition"
          >
            <Mail className="w-3.5 h-3.5" />
            {googleStatus.connected ? "Re-authorize Workspace" : "Authorize muhammad.mujahid@axorks.com"}
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "inbox"
              ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Mail className="w-4 h-4" /> Workspace Inbox
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "analytics"
              ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Alias & Team Analytics
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "leaderboard"
              ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" /> Productivity & Leaderboard
        </button>

        <button
          onClick={() => setActiveTab("compose")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "compose"
              ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Plus className="w-4 h-4" /> Compose & Send
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === "inbox" && (
        <EmailInboxList
          onSelectEmail={(email) => setSelectedEmail(email)}
          selectedEmailId={selectedEmail?.id}
        />
      )}

      {activeTab === "analytics" && <EmailAnalyticsPanel />}

      {activeTab === "leaderboard" && <EmailLeaderboard />}

      {activeTab === "compose" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">
              {replyConfig ? `Reply to ${replyConfig.to}` : "New Outreach Dispatch"}
            </h2>
            {replyConfig && (
              <button
                onClick={() => setReplyConfig(null)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear Reply
              </button>
            )}
          </div>
          <ComposeEmail
            initialTo={replyConfig?.to ? [replyConfig.to] : []}
            initialSubject={replyConfig?.subject || ""}
            initialSenderAlias={replyConfig?.senderAlias || "sales@axorks.com"}
            threadId={replyConfig?.threadId}
            inReplyTo={replyConfig?.inReplyTo}
            onSuccess={() => {
              setActiveTab("inbox");
              setReplyConfig(null);
            }}
          />
        </div>
      )}

      {/* Email Thread Viewer Modal */}
      {selectedEmail && (
        <EmailThreadViewer
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onReply={handleReplyFromViewer}
        />
      )}
    </div>
  );
}
