"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Paperclip,
  ShieldCheck,
  Crown,
  User,
  Plus,
  RefreshCw,
  Search,
  FileText,
  Download,
  Eye,
  Reply,
  Trash2,
  Sparkles,
} from "lucide-react";

export default function InternalMessagesPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isFounder = currentUser?.role === "Founder" || currentUser?.email === "mujahidaryan222149@gmail.com";

  const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "pending" | "compose">("inbox");
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  // Compose State
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Array<{ name: string; size: number; type: string; url: string }>>([]);

  // Fetch Team Users for Recipient Selector
  const { data: users = [] } = useQuery({
    queryKey: ["team-users-messaging"],
    queryFn: () => apiClient("/api/v1/iam/users"),
  });

  const availableRecipients = (Array.isArray(users) ? users : []).filter(
    (u: any) => u.id !== currentUser?.id
  );

  // Fetch Messages based on active tab
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["internal-messages", activeTab],
    queryFn: () =>
      apiClient(`/api/v1/messages?folder=${activeTab === "compose" ? "inbox" : activeTab}`, {
        headers: currentUser?.id ? { "x-user-id": currentUser.id } : undefined,
      }),
  });

  const messages: any[] = response?.data || [];

  // Filter messages by search
  const filteredMessages = messages.filter((m) => {
    const s = search.toLowerCase();
    return (
      m.subject?.toLowerCase().includes(s) ||
      m.body?.toLowerCase().includes(s) ||
      m.sender_name?.toLowerCase().includes(s) ||
      m.recipient_name?.toLowerCase().includes(s)
    );
  });

  // Send Message Mutation
  const sendMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient("/api/v1/messages", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: currentUser?.id ? { "x-user-id": currentUser.id } : undefined,
      }),
    onSuccess: (res) => {
      if (res?.success) {
        toast.success(res.message || "Message sent successfully!");
        setRecipientId("");
        setSubject("");
        setBody("");
        setAttachments([]);
        setActiveTab("sent");
        queryClient.invalidateQueries({ queryKey: ["internal-messages"] });
      } else {
        toast.error(res?.error || "Failed to send message");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Error sending message");
    },
  });

  // Approve / Reject Mutation
  const actionMutation = useMutation({
    mutationFn: ({ messageId, action, reason }: { messageId: string; action: "approve" | "reject"; reason?: string }) =>
      apiClient(`/api/v1/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ action, rejection_reason: reason }),
        headers: currentUser?.id ? { "x-user-id": currentUser.id } : undefined,
      }),
    onSuccess: (res, vars) => {
      if (res?.success) {
        toast.success(vars.action === "approve" ? "Message approved & delivered!" : "Message rejected.");
        queryClient.invalidateQueries({ queryKey: ["internal-messages"] });
        setSelectedMessage(null);
      } else {
        toast.error(res?.error || "Action failed");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Action failed");
    },
  });

  // Handle File Upload to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 10MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const url = uploadEvent.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            type: file.type || "application/octet-stream",
            url,
          },
        ]);
        toast.success(`Attached ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSend = () => {
    if (!recipientId) {
      toast.error("Please select a recipient");
      return;
    }
    if (!body.trim()) {
      toast.error("Please enter message text");
      return;
    }

    const selectedUser = availableRecipients.find((u: any) => u.id === recipientId);
    sendMutation.mutate({
      recipient_id: recipientId,
      recipient_name: selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name || ""}`.trim() : "Team Member",
      recipient_role: selectedUser?.role,
      recipient_email: selectedUser?.email,
      subject: subject.trim() || "Internal Message",
      body: body.trim(),
      attachments,
    });
  };

  const isFarhanaSelected = () => {
    const r = availableRecipients.find((u: any) => u.id === recipientId);
    if (!r) return false;
    return (
      r.email === "heyfarii@gmail.com" ||
      r.email === "farhana.bakht@axorks.com" ||
      r.first_name === "Farhana" ||
      r.role === "Co-Founder"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/40 via-slate-950 to-indigo-950/30" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Encrypted Internal Communication Channel</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Team Messages & File Exchange</span>
              {isFounder && <Crown className="w-5 h-5 text-amber-400" />}
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl">
              Secure real-time communication, file sharing, and Founder moderation workflow for all Axorks OS members.
            </p>
          </div>

          <button
            onClick={() => setActiveTab("compose")}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 self-start md:self-auto transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Message
          </button>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-2 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "inbox"
                ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Inbox className="w-4 h-4" /> Inbox
          </button>

          <button
            onClick={() => setActiveTab("sent")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "sent"
                ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Send className="w-4 h-4" /> Sent
          </button>

          {isFounder && (
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === "pending"
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30"
                  : "text-amber-400 hover:text-amber-200 hover:bg-amber-500/10"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Pending Founder Approval</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("compose")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "compose"
                ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Plus className="w-4 h-4" /> Compose
          </button>
        </div>

        {activeTab !== "compose" && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-violet-500"
              />
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
              title="Refresh messages"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* COMPOSE TAB */}
      {activeTab === "compose" && (
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-6 space-y-5 max-w-4xl mx-auto shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-400" /> Compose Internal Message
            </h2>
            <span className="text-xs text-slate-500 font-mono">Neon DB Encrypted Storage</span>
          </div>

          {/* Farhana Policy Alert */}
          {(isFarhanaSelected() || currentUser?.role === "Co-Founder" || currentUser?.first_name === "Farhana") && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-200">Founder Moderation Policy Enforced</strong>
                All messages and files sent to or from Farhana (Co-Founder) are automatically queued for Founder approval before delivery.
              </div>
            </div>
          )}

          {/* Recipient Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Recipient *</label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-hidden focus:border-violet-500"
            >
              <option value="">-- Select Team Member --</option>
              {availableRecipients.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name || ""} ({u.role} - {u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Subject</label>
            <input
              type="text"
              placeholder="e.g. Project Specs Review / Design Deliverables"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-hidden focus:border-violet-500"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Message *</label>
            <textarea
              rows={6}
              placeholder="Write your message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-hidden focus:border-violet-500 font-sans leading-relaxed"
            />
          </div>

          {/* Attachment list & upload */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-violet-400" /> Attach Files
              </label>
              <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add File
                <input type="file" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                      <span className="text-slate-200 font-medium truncate">{att.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({Math.round(att.size / 1024)} KB)</span>
                    </div>
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveTab("inbox")}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sendMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sendMutation.isPending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      )}

      {/* MESSAGE LIST TAB (Inbox / Sent / Pending) */}
      {activeTab !== "compose" && (
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No messages found in this folder</p>
              <p className="text-xs text-slate-500">
                {activeTab === "pending" ? "All messages have been approved." : "Start a new conversation with your team."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className="p-4 hover:bg-slate-900/50 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {msg.sender_name?.[0] || "U"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">
                          {activeTab === "sent" ? `To: ${msg.recipient_name}` : `From: ${msg.sender_name}`}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {activeTab === "sent" ? `(${msg.recipient_role || "Team Member"})` : `(${msg.sender_role || "Team Member"})`}
                        </span>

                        {/* Approval Badges */}
                        {msg.requires_approval && msg.approval_status === "pending" && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending Founder Approval
                          </span>
                        )}
                        {msg.requires_approval && msg.approval_status === "approved" && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Approved by Founder
                          </span>
                        )}
                        {msg.requires_approval && msg.approval_status === "rejected" && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-slate-100">{msg.subject}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{msg.body}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    {msg.has_attachments && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-violet-400" />
                        {msg.attachments?.length || 1} file(s)
                      </span>
                    )}

                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(msg.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>

                    {/* Pending Actions for Founder in List */}
                    {activeTab === "pending" && isFounder && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => actionMutation.mutate({ messageId: msg.id, action: "approve" })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => actionMutation.mutate({ messageId: msg.id, action: "reject" })}
                          className="px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MESSAGE VIEWER MODAL */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-violet-400 font-bold block mb-1">
                  {selectedMessage.subject}
                </span>
                <div className="text-xs text-slate-300 space-y-0.5">
                  <p>
                    <strong>From:</strong> {selectedMessage.sender_name} ({selectedMessage.sender_role || "Team Member"})
                  </p>
                  <p>
                    <strong>To:</strong> {selectedMessage.recipient_name} ({selectedMessage.recipient_role || "Team Member"})
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                ✕
              </button>
            </div>

            {/* Approval Notice inside viewer */}
            {selectedMessage.requires_approval && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  selectedMessage.approval_status === "approved"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : selectedMessage.approval_status === "rejected"
                    ? "bg-red-500/10 border-red-500/30 text-red-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Moderation Status:</strong>{" "}
                  {selectedMessage.approval_status === "approved"
                    ? "Approved by Founder & Delivered"
                    : selectedMessage.approval_status === "rejected"
                    ? `Rejected by Founder (${selectedMessage.rejection_reason || "Policy"})`
                    : "Pending Founder Approval before recipient delivery"}
                </span>
              </div>
            )}

            {/* Message Body */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {selectedMessage.body}
            </div>

            {/* Attachments Preview */}
            {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-violet-400" /> Attached Files (
                  {selectedMessage.attachments.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedMessage.attachments.map((att: any, i: number) => (
                    <a
                      key={i}
                      href={att.url}
                      download={att.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500/50 transition flex items-center justify-between text-xs group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                        <span className="text-slate-200 font-medium truncate group-hover:text-violet-400">
                          {att.name}
                        </span>
                      </div>
                      <Download className="w-4 h-4 text-slate-500 group-hover:text-violet-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {isFounder && selectedMessage.requires_approval && selectedMessage.approval_status === "pending" ? (
                <div className="flex items-center gap-2 w-full justify-end">
                  <button
                    onClick={() => actionMutation.mutate({ messageId: selectedMessage.id, action: "reject" })}
                    className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject Message
                  </button>
                  <button
                    onClick={() => actionMutation.mutate({ messageId: selectedMessage.id, action: "approve" })}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Deliver
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setRecipientId(selectedMessage.sender_id);
                    setSubject(`Re: ${selectedMessage.subject}`);
                    setSelectedMessage(null);
                    setActiveTab("compose");
                  }}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-1.5 ml-auto"
                >
                  <Reply className="w-4 h-4" /> Reply
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
