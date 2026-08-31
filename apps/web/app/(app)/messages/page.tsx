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
  const isFounder = Boolean(
    currentUser?.role === "Founder" ||
      currentUser?.email === "mujahidaryan222149@gmail.com" ||
      currentUser?.email === "muhammad.mujahid@axorks.com"
  );

  const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "pending" | "compose">("inbox");
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  // Compose State
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Array<{ name: string; size: number; type: string; url: string }>>([]);

  // Fetch Team Users for Recipient Selector
  const { data: usersResponse } = useQuery<{ success: boolean; data: any[] } | any[]>({
    queryKey: ["team-users-messaging"],
    queryFn: () => apiClient("/api/v1/iam/users"),
  });

  const availableUsers: any[] = Array.isArray(usersResponse)
    ? usersResponse
    : (usersResponse as any)?.data || [];

  const availableRecipients = availableUsers.filter((u: any) => u.id !== currentUser?.id);

  // Fetch Messages based on active tab
  const { data: messagesData, isLoading, refetch } = useQuery<any>({
    queryKey: ["internal-messages", activeTab],
    queryFn: () => apiClient(`/api/v1/messages?folder=${activeTab === "compose" ? "inbox" : activeTab}`),
  });

  const messages: any[] = Array.isArray(messagesData)
    ? messagesData
    : (messagesData as any)?.data || [];

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
      }),
    onSuccess: (res: any) => {
      const created = res?.data || res;
      if (created?.requires_approval && created?.approval_status === "pending") {
        toast.success("Message sent for approval");
      } else {
        toast.success("Message sent successfully!");
      }
      setRecipientId("");
      setSubject("");
      setBody("");
      setAttachments([]);
      setActiveTab("sent");
      queryClient.invalidateQueries({ queryKey: ["internal-messages"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Error sending message");
    },
  });

  // Approve / Reject Mutation (Founder Only)
  const actionMutation = useMutation({
    mutationFn: ({ messageId, action, reason }: { messageId: string; action: "approve" | "reject"; reason?: string }) =>
      apiClient(`/api/v1/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ action, rejection_reason: reason }),
      }),
    onSuccess: (res, vars) => {
      toast.success(vars.action === "approve" ? "Message approved & delivered!" : "Message rejected.");
      queryClient.invalidateQueries({ queryKey: ["internal-messages"] });
      setSelectedMessage(null);
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/50 via-slate-950 to-indigo-950/40" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-bold">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Internal Communication Channel</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Team Messages & File Exchange</span>
              {isFounder && <Crown className="w-5 h-5 text-amber-400" />}
            </h1>
            <p className="text-slate-300 text-xs md:text-sm font-medium max-w-2xl">
              Secure internal team messaging, document exchange, and project coordination.
            </p>
          </div>

          <button
            onClick={() => setActiveTab("compose")}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-600/40 flex items-center gap-2 self-start md:self-auto transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Message
          </button>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-3.5 py-2 rounded-xl text-xs transition border ${
              activeTab === "inbox"
                ? "bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-600/40 font-black"
                : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800 font-semibold"
            }`}
          >
            <Inbox className="w-4 h-4 inline-block mr-1.5" /> Inbox
          </button>

          <button
            onClick={() => setActiveTab("sent")}
            className={`px-3.5 py-2 rounded-xl text-xs transition border ${
              activeTab === "sent"
                ? "bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-600/40 font-black"
                : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800 font-semibold"
            }`}
          >
            <Send className="w-4 h-4 inline-block mr-1.5" /> Sent
          </button>

          {isFounder && (
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3.5 py-2 rounded-xl text-xs transition border ${
                activeTab === "pending"
                  ? "bg-amber-600 text-white border-amber-500 shadow-sm shadow-amber-600/40 font-black"
                  : "bg-slate-950 text-amber-300 border-amber-500/30 hover:text-white hover:bg-amber-950/40 font-bold"
              }`}
            >
              <ShieldCheck className="w-4 h-4 inline-block mr-1.5" />
              <span>Review Queue</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("compose")}
            className={`px-3.5 py-2 rounded-xl text-xs transition border ${
              activeTab === "compose"
                ? "bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-600/40 font-black"
                : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800 font-semibold"
            }`}
          >
            <Plus className="w-4 h-4 inline-block mr-1.5" /> Compose
          </button>
        </div>

        {activeTab !== "compose" && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 font-medium transition"
              />
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 transition"
              title="Refresh messages"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* COMPOSE TAB */}
      {activeTab === "compose" && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-5 max-w-4xl mx-auto shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-400" /> Compose Internal Message
            </h2>
            <span className="text-xs text-slate-400 font-mono font-semibold">Secure Direct Dispatch</span>
          </div>

          {/* Recipient Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Recipient *</label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-violet-500"
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
            <label className="text-xs font-bold text-slate-300">Subject</label>
            <input
              type="text"
              placeholder="e.g. Outreach Strategy / Project Deliverables"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500 font-medium"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Message *</label>
            <textarea
              rows={6}
              placeholder="Write your message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-violet-500 font-sans leading-relaxed"
            />
          </div>

          {/* Attachment list & upload */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-violet-400" /> Attach Files
              </label>
              <label className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5 border border-slate-700 shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Add File
                <input type="file" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                      <span className="text-white font-bold truncate">{att.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({Math.round(att.size / 1024)} KB)</span>
                    </div>
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-400 p-1"
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
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sendMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-600/40 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sendMutation.isPending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      )}

      {/* MESSAGE LIST TAB (Inbox / Sent / Pending) */}
      {activeTab !== "compose" && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">No messages found in this folder</p>
              <p className="text-xs text-slate-400 font-medium">
                {activeTab === "pending" ? "Review queue is currently clear." : "Start a new conversation with your team."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className="p-4 hover:bg-slate-900/60 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      {msg.sender_name?.[0] || "U"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {activeTab === "sent" ? `To: ${msg.recipient_name}` : `From: ${msg.sender_name}`}
                        </span>
                        <span className="text-[11px] text-slate-300 font-mono">
                          {activeTab === "sent" ? `(${msg.recipient_role || "Team Member"})` : `(${msg.sender_role || "Team Member"})`}
                        </span>

                        {/* Neutral High-Contrast Badges */}
                        {msg.requires_approval && msg.approval_status === "pending" && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending Approval
                          </span>
                        )}
                        {msg.requires_approval && msg.approval_status === "approved" && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                        )}
                        {msg.requires_approval && msg.approval_status === "rejected" && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Not Delivered
                          </span>
                        )}
                        {!msg.requires_approval && activeTab === "sent" && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white">{msg.subject}</h3>
                      <p className="text-xs text-slate-300 line-clamp-1 font-normal">{msg.body}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    {msg.has_attachments && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-900 border border-slate-700 text-slate-200 font-bold flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-violet-400" />
                        {msg.attachments?.length || 1} file(s)
                      </span>
                    )}

                    <span className="text-[11px] text-slate-300 font-mono font-medium">
                      {new Date(msg.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>

                    {/* Review Actions only for Founder in pending tab */}
                    {activeTab === "pending" && isFounder && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => actionMutation.mutate({ messageId: msg.id, action: "approve" })}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => actionMutation.mutate({ messageId: msg.id, action: "reject" })}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
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
          <div className="bg-slate-950 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-sm font-bold text-violet-300 block mb-1">
                  {selectedMessage.subject}
                </span>
                <div className="text-xs text-slate-200 space-y-0.5">
                  <p>
                    <strong className="text-slate-400">From:</strong> {selectedMessage.sender_name} ({selectedMessage.sender_role || "Team Member"})
                  </p>
                  <p>
                    <strong className="text-slate-400">To:</strong> {selectedMessage.recipient_name} ({selectedMessage.recipient_role || "Team Member"})
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Neutral Status Notice */}
            {selectedMessage.requires_approval && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border font-semibold ${
                  selectedMessage.approval_status === "approved"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : selectedMessage.approval_status === "rejected"
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                    : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Status:</strong>{" "}
                  {selectedMessage.approval_status === "approved"
                    ? "Delivered"
                    : selectedMessage.approval_status === "rejected"
                    ? "Message could not be delivered"
                    : "Pending Approval"}
                </span>
              </div>
            )}

            {/* Message Body */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {selectedMessage.body}
            </div>

            {/* Attachments Preview */}
            {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
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
                      className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-violet-500 transition flex items-center justify-between text-xs group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                        <span className="text-white font-bold truncate group-hover:text-violet-300">
                          {att.name}
                        </span>
                      </div>
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
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
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject
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
