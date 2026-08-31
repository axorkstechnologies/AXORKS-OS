"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
  Mail,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Clock,
  Eye,
  CheckCircle2,
  RefreshCw,
  Tag,
  ShieldCheck,
  Send,
} from "lucide-react";
import { type WorkspaceEmailRecord } from "@/lib/email/constants";

interface EmailInboxListProps {
  onSelectEmail: (email: WorkspaceEmailRecord) => void;
}

export function EmailInboxList({ onSelectEmail }: EmailInboxListProps) {
  const { user } = useAuthStore();
  const isFounder = Boolean(
    user?.role === "Founder" ||
      user?.email === "mujahidaryan222149@gmail.com" ||
      user?.email === "muhammad.mujahid@axorks.com"
  );

  const [search, setSearch] = useState("");
  const [selectedAlias, setSelectedAlias] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<"all" | "inbound" | "outbound">("all");

  const { data: inboxResponse, isLoading, refetch } = useQuery<{
    success: boolean;
    data: WorkspaceEmailRecord[];
    count: number;
  }>({
    queryKey: ["workspace-inbox", search, selectedAlias, directionFilter],
    queryFn: () => {
      let url = `/api/v1/email/inbox?direction=${directionFilter}`;
      if (selectedAlias !== "all") url += `&alias=${encodeURIComponent(selectedAlias)}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      return apiClient(url);
    },
    refetchInterval: 30000,
  });

  const emails: WorkspaceEmailRecord[] = inboxResponse?.data || [];

  const ALIAS_BUTTONS = isFounder
    ? [
        { id: "all", label: "All Inbox (Combined)" },
        { id: "muhammad.mujahid@axorks.com", label: "Founder (Personal)", color: "violet" },
        { id: "sales@axorks.com", label: "sales@", color: "emerald" },
        { id: "contact@axorks.com", label: "contact@", color: "blue" },
        { id: "hello@axorks.com", label: "hello@", color: "amber" },
        { id: "careers@axorks.com", label: "careers@", color: "rose" },
      ]
    : [
        { id: "all", label: "All Shared Aliases" },
        { id: "sales@axorks.com", label: "sales@", color: "emerald" },
        { id: "contact@axorks.com", label: "contact@", color: "blue" },
        { id: "hello@axorks.com", label: "hello@", color: "amber" },
        { id: "careers@axorks.com", label: "careers@", color: "rose" },
      ];

  const getAliasPill = (alias: string) => {
    switch (alias) {
      case "sales@axorks.com":
        return "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40";
      case "contact@axorks.com":
        return "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40";
      case "hello@axorks.com":
        return "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40";
      case "careers@axorks.com":
        return "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40";
      default:
        return "bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/40";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="p-4 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sender, subject, content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 font-medium transition"
          />
        </div>

        {/* Direction Switcher (All / Inbound / Outbound) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full md:w-auto justify-center">
          <button
            onClick={() => setDirectionFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              directionFilter === "all"
                ? "bg-violet-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All Emails
          </button>
          <button
            onClick={() => setDirectionFilter("inbound")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              directionFilter === "inbound"
                ? "bg-violet-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Received
          </button>
          <button
            onClick={() => setDirectionFilter("outbound")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              directionFilter === "outbound"
                ? "bg-violet-600 text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ArrowUpRight className="w-3 h-3 text-violet-600 dark:text-violet-400" /> Sent
          </button>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 transition shrink-0"
          title="Refresh Inbox"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Alias Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {ALIAS_BUTTONS.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setSelectedAlias(btn.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
              selectedAlias === btn.id
                ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Email List Items Container */}
      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
            Loading workspace emails...
          </div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Mail className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No emails found in this view</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
              {search ? "No emails match your search query." : "Incoming client inquiries and team outreach will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {emails.map((email) => (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={`p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  !email.is_read ? "bg-violet-50/50 dark:bg-violet-950/20" : ""
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                      email.direction === "inbound"
                        ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40"
                        : "bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-500/40"
                    }`}
                  >
                    {email.direction === "inbound" ? (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {email.sender_name || email.sender_email}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        &lt;{email.sender_email}&gt;
                      </span>

                      {/* Alias Pill */}
                      {(email.sender_alias || email.recipient_email) && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getAliasPill(
                            email.sender_alias || email.recipient_email
                          )}`}
                        >
                          {email.sender_alias || email.recipient_email}
                        </span>
                      )}

                      {/* Lead / Client Badge */}
                      {email.lead_id && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                          CRM Lead
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {email.subject || "(No Subject)"}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 font-normal">
                      {email.snippet || "Click to view email thread..."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-semibold">
                    {new Date(email.received_at || email.sent_at || email.created_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  <button className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition border border-slate-300 dark:border-slate-700 shadow-xs">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
