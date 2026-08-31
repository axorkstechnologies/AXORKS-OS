"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import {
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  ArrowRight,
  User,
  Sparkles,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export default function EmailFollowupsPage() {
  const { user: currentUser, accessToken } = useAuthStore();
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function loadFollowups() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/email/followups");
      const json = await res.json();
      if (json.data) {
        setFollowups(json.data);
      }
    } catch (err) {
      toast.error("Failed to load email follow-ups");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFollowups();
  }, []);

  const handleSendFollowup = async (item: any) => {
    setSendingId(item.id);
    try {
      // 1. Send second email via Resend email send endpoint
      const emailRes = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          to: [item.recipient_email],
          subject: `Re: ${item.subject}`,
          html: `<p>Hi ${item.recipient_name || "there"},</p><p>Wanted to quickly check back in on my previous email. Let us know if you have 10 minutes for a quick demo or conversation this week!</p><p>Best regards,<br/>Axorks OS Team</p>`,
          isFollowup: true,
          leadId: item.lead_id || undefined,
          sentByUserId: currentUser?.id,
          sentByUserName: currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim() : "Team Member",
          sentByUserEmail: currentUser?.email,
        }),
      });

      const emailJson = await emailRes.json();
      if (emailRes.ok && emailJson.success) {
        toast.success(`2nd Follow-up sent to ${item.recipient_email}`);

        // 2. Update status in Neon DB
        await fetch("/api/v1/email/followups", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            status: "waiting",
            attempts: (item.attempts || 1) + 1,
          }),
        });

        loadFollowups();
      } else {
        toast.error(emailJson.error || "Failed to deliver follow-up email");
      }
    } catch (err: any) {
      toast.error("Error sending follow-up email: " + err.message);
    } finally {
      setSendingId(null);
    }
  };

  const handleMarkReplied = async (id: string) => {
    try {
      await fetch("/api/v1/email/followups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "replied" }),
      });
      toast.success("Marked as Replied!");
      loadFollowups();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500" /> Email Follow-up Command Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track leads, schedule 2nd touches, and ensure no prospect falls through the cracks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadFollowups}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link
            href="/email/compose"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-600/30 transition"
          >
            <Mail className="w-4 h-4" /> New Email
          </Link>
        </div>
      </div>

      {/* Workflow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold">Total Follow-ups Tracked</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {followups.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Multi-touch Cadence</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
          <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">Follow-up Needed</div>
          <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">
            {followups.filter((f) => f.status === "followup_needed").length}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-1">Ready for 2nd Touch</div>
        </div>

        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-sm">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">Waiting for Reply</div>
          <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">
            {followups.filter((f) => f.status === "waiting" || f.status === "sent").length}
          </div>
          <div className="text-[10px] text-blue-600/80 mt-1">Sent within 48h</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Replied / Converted</div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
            {followups.filter((f) => f.status === "replied").length}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-1">Successful Connections</div>
        </div>
      </div>

      {/* Main Follow-up List Table */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-500" /> Pending Lead Follow-up Queue
          </h2>
          <span className="text-xs text-slate-500">Every lead contacted at least 2x in 48-72h</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading follow-ups from Neon DB...</div>
        ) : followups.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No follow-ups recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Prospect</th>
                  <th className="p-3">Subject / Campaign</th>
                  <th className="p-3">Attempts</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Sent</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {followups.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.recipient_name || "Lead"}</div>
                      <div className="text-[11px] text-slate-500">{item.recipient_email}</div>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">{item.subject}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Touch #{item.attempts}
                      </span>
                    </td>
                    <td className="p-3">
                      {item.status === "followup_needed" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          <AlertCircle className="w-3 h-3" /> Follow-up Needed
                        </span>
                      )}
                      {item.status === "waiting" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          <Clock className="w-3 h-3" /> Waiting for Reply
                        </span>
                      )}
                      {item.status === "replied" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Replied
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">{new Date(item.last_sent_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status !== "replied" && (
                          <>
                            <button
                              onClick={() => handleSendFollowup(item)}
                              disabled={sendingId === item.id}
                              className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] flex items-center gap-1 transition disabled:opacity-50"
                            >
                              <Send className="w-3 h-3" />
                              {sendingId === item.id ? "Sending..." : "Send 2nd Touch"}
                            </button>
                            <button
                              onClick={() => handleMarkReplied(item.id)}
                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] transition"
                            >
                              Replied
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
