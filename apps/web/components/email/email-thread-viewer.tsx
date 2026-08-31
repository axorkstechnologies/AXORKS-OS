"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  X,
  Reply,
  Star,
  CheckCircle2,
  Paperclip,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { type WorkspaceEmailRecord } from "@/lib/email/constants";

interface EmailThreadViewerProps {
  email: WorkspaceEmailRecord | null;
  onClose: () => void;
  onReply: (replyData: {
    to: string;
    subject: string;
    senderAlias: string;
    threadId?: string;
    inReplyTo?: string;
  }) => void;
}

export function EmailThreadViewer({ email, onClose, onReply }: EmailThreadViewerProps) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (updates: any) =>
      apiClient(`/api/v1/email/inbox/${email?.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["email-analytics"] });
    },
  });

  if (!email) return null;

  const handleMarkConverted = () => {
    updateMutation.mutate({ converted_to_client: !email.converted_to_client });
    toast.success(
      !email.converted_to_client
        ? "Lead successfully marked as Converted Client! Analytics updated."
        : "Conversion status cleared."
    );
  };

  const handleToggleStar = () => {
    updateMutation.mutate({ is_starred: !email.is_starred });
  };

  const handleReplyClick = () => {
    const replySubject = email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;
    const targetRecipient = email.direction === "inbound" ? email.sender_email : email.recipient_email;
    const targetAlias = email.sender_alias || "sales@axorks.com";

    onReply({
      to: targetRecipient,
      subject: replySubject,
      senderAlias: targetAlias,
      threadId: email.thread_id || email.message_id,
      inReplyTo: email.message_id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 shrink-0">
              {email.direction === "inbound" ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-100 truncate">{email.subject}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {email.sender_alias || "sales@axorks.com"}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {email.sent_at || email.received_at ? new Date(email.sent_at || email.received_at!).toLocaleString() : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStar}
              className={`p-2 rounded-xl border transition ${
                email.is_starred
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-400"
              }`}
              title="Star email"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Meta Dossier */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/30 text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-slate-500 font-semibold">From: </span>
              <span className="text-slate-200 font-bold">{email.sender_name} </span>
              <span className="text-slate-400 font-mono">&lt;{email.sender_email}&gt;</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">To: </span>
              <span className="text-slate-200 font-mono">{email.to_recipients?.join(", ") || email.recipient_email}</span>
            </div>
          </div>

          {email.cc_recipients && email.cc_recipients.length > 0 && (
            <div>
              <span className="text-slate-500 font-semibold">Cc: </span>
              <span className="text-slate-300 font-mono">{email.cc_recipients.join(", ")}</span>
            </div>
          )}

          {email.sent_by_user_name && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
              <span>Dispatched by employee: <strong className="text-slate-200">{email.sent_by_user_name}</strong></span>
            </div>
          )}
        </div>

        {/* Email Body Renderer */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-200 text-sm leading-relaxed">
          {email.body_html ? (
            <div
              className="prose prose-invert max-w-none prose-p:my-2 prose-headings:text-slate-100 prose-a:text-violet-400"
              dangerouslySetInnerHTML={{ __html: email.body_html }}
            />
          ) : (
            <div className="whitespace-pre-wrap font-sans text-slate-300">
              {email.body_text || email.snippet || "(Empty body)"}
            </div>
          )}

          {/* Attachments Section */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-8 pt-4 border-t border-slate-800/80">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" /> Attachments ({email.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {email.attachments.map((att: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                  >
                    <span className="truncate text-slate-200 font-mono">{att.filename || `Attachment-${idx + 1}`}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{att.size ? `${Math.round(att.size / 1024)} KB` : "File"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkConverted}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                email.converted_to_client
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {email.converted_to_client ? "Converted to Client ✓" : "Mark as Converted Client"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReplyClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition transform active:scale-95"
            >
              <Reply className="w-4 h-4" /> Reply from {email.sender_alias || "sales@axorks.com"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
