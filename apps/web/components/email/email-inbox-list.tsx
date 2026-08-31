"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  Mail,
  Search,
  Star,
  RefreshCw,
  Clock,
  Filter,
  CheckCircle2,
  Paperclip,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { WORKSPACE_ALIASES, WorkspaceAlias } from "@/lib/email/gmail-service";
import { WorkspaceEmailRecord } from "@/lib/business-repository";

interface EmailInboxListProps {
  onSelectEmail: (email: WorkspaceEmailRecord) => void;
  selectedEmailId?: string;
}

export function EmailInboxList({ onSelectEmail, selectedEmailId }: EmailInboxListProps) {
  const queryClient = useQueryClient();
  const [selectedAlias, setSelectedAlias] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<"all" | "inbound" | "outbound">("inbound");
  const [search, setSearch] = useState("");

  const { data: response, isLoading, refetch } = useQuery<{ success: boolean; data: WorkspaceEmailRecord[] }>({
    queryKey: ["workspace-inbox", selectedAlias, directionFilter, search],
    queryFn: () =>
      apiClient("/api/v1/email/inbox", {
        params: {
          alias: selectedAlias,
          direction: directionFilter,
          search,
        },
      }),
  });

  const emails: WorkspaceEmailRecord[] = response?.data || (Array.isArray(response) ? response : []);

  const syncMutation = useMutation({
    mutationFn: () => apiClient("/api/v1/email/inbox", { method: "POST" }),
    onSuccess: (res) => {
      if (res?.success) {
        toast.success(res.message || "Inbox synchronized with Google Workspace");
        queryClient.invalidateQueries({ queryKey: ["workspace-inbox"] });
        queryClient.invalidateQueries({ queryKey: ["email-analytics"] });
      } else {
        toast.info(res?.message || "Sync completed");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to sync inbox with Gmail");
    },
  });

  const getAliasBadgeColor = (alias?: string) => {
    switch (alias) {
      case "sales@axorks.com":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "contact@axorks.com":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "hello@axorks.com":
        return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
      case "careers@axorks.com":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    }
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Alias Filter Pills & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800 backdrop-blur-sm">
        {/* Alias Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedAlias("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedAlias === "all"
                ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            All Mail
          </button>
          {WORKSPACE_ALIASES.map((alias) => (
            <button
              key={alias}
              onClick={() => setSelectedAlias(alias)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition border ${
                selectedAlias === alias
                  ? "bg-slate-800 text-slate-100 border-violet-500/50 shadow-xs"
                  : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {alias.replace("@axorks.com", "")}
              <span className="text-[10px] text-slate-500">@axorks.com</span>
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          {/* Direction toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setDirectionFilter("inbound")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                directionFilter === "inbound" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Inbox
            </button>
            <button
              onClick={() => setDirectionFilter("outbound")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                directionFilter === "outbound" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setDirectionFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                directionFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>
          </div>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search sender, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            title="Sync with Google Workspace"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? "animate-spin text-violet-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl backdrop-blur-md">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-violet-500" /> Loading emails from Neon DB...
          </div>
        ) : emails.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No emails found in this view</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Emails sent to <span className="text-violet-400 font-mono">sales@axorks.com</span>,{" "}
              <span className="text-blue-400 font-mono">contact@axorks.com</span>,{" "}
              <span className="text-violet-400 font-mono">hello@axorks.com</span>, and{" "}
              <span className="text-amber-400 font-mono">careers@axorks.com</span> will appear here automatically.
            </p>
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync Gmail Inbox Now
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {emails.map((email) => {
              const isSelected = selectedEmailId === email.id;
              return (
                <div
                  key={email.id}
                  onClick={() => onSelectEmail(email)}
                  className={`p-3.5 sm:p-4 flex items-start sm:items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected
                      ? "bg-violet-950/30 border-l-4 border-l-violet-500"
                      : email.is_read
                      ? "hover:bg-slate-900/50"
                      : "bg-slate-900/70 hover:bg-slate-900 font-semibold"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* Read Indicator / Direction Icon */}
                    <div className="pt-0.5 sm:pt-0 shrink-0">
                      {email.direction === "inbound" ? (
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                            email.is_read ? "bg-slate-800 text-slate-400" : "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40"
                          }`}
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Sender & Alias row */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-100 truncate max-w-[200px]">
                          {email.direction === "inbound" ? email.sender_name || email.sender_email : `To: ${email.recipient_name || email.recipient_email}`}
                        </span>

                        {/* Alias badge */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getAliasBadgeColor(
                            email.sender_alias
                          )}`}
                        >
                          {email.sender_alias || "sales@axorks.com"}
                        </span>

                        {email.is_followup && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Follow-up
                          </span>
                        )}

                        {email.converted_to_client && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Converted Client
                          </span>
                        )}
                      </div>

                      {/* Subject & snippet preview */}
                      <div className="flex items-center gap-2">
                        <p className={`text-xs truncate ${email.is_read ? "text-slate-300" : "text-slate-100 font-bold"}`}>
                          {email.subject}
                        </p>
                        {email.has_attachments && (
                          <Paperclip className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                        <span className="text-xs text-slate-500 truncate hidden md:inline">
                          — {email.snippet || "No preview available"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp & chevron */}
                  <div className="flex items-center gap-2 shrink-0 pt-0.5 sm:pt-0">
                    <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                      {formatTimestamp(email.sent_at || email.received_at || email.created_at)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
