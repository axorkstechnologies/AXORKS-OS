"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmailSendSchema, EmailSendInput, AttachmentInput } from "@/lib/validators/email";
import { RecipientSelector } from "./RecipientSelector";
import { AttachmentUploader } from "./AttachmentUploader";
import { TemplateSelector } from "./TemplateSelector";
import { EmailPreview } from "./EmailPreview";
import { RecentRecipients } from "./RecentRecipients";
import { useAuthStore } from "@/stores/auth-store";
import { WORKSPACE_ALIASES } from "@/lib/email/constants";
import { toast } from "sonner";
import {
  Send,
  Sparkles,
  Save,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Table as TableIcon,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

interface ComposeEmailProps {
  initialTo?: string[];
  initialSubject?: string;
  initialBody?: string;
  initialSenderAlias?: string;
  threadId?: string;
  inReplyTo?: string;
  leadId?: string;
  onSuccess?: () => void;
}

export function ComposeEmail({
  initialTo = [],
  initialSubject = "",
  initialBody = "",
  initialSenderAlias = "sales@axorks.com",
  threadId,
  inReplyTo,
  leadId,
  onSuccess,
}: ComposeEmailProps) {
  const { user: currentUser, accessToken } = useAuthStore();
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAiAccordion, setShowAiAccordion] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [lastDraftSaved, setLastDraftSaved] = useState<string | null>(null);

  // AI Prompt Form fields
  const [aiCompany, setAiCompany] = useState("");
  const [aiIndustry, setAiIndustry] = useState("Software & Tech");
  const [aiDecisionMaker, setAiDecisionMaker] = useState("");
  const [aiPainPoints, setAiPainPoints] = useState("");
  const [aiService, setAiService] = useState("Full-Stack Software Development");

  const defaultSenderName = currentUser?.first_name
    ? `${currentUser.first_name} ${currentUser.last_name || ""} (Axorks Technologies)`.trim()
    : "Axorks Technologies";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmailSendInput>({
    resolver: zodResolver(EmailSendSchema),
    defaultValues: {
      to: initialTo,
      cc: [],
      bcc: [],
      subject: initialSubject,
      html: initialBody || "<p>Dear Team,</p><p>Write your message here...</p>",
      senderAlias: initialSenderAlias || "sales@axorks.com",
      senderName: defaultSenderName,
      threadId,
      inReplyTo,
      attachments: [],
      leadId,
      sentByUserId: currentUser?.id,
      sentByUserName: currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim() : "Team Member",
      isFollowup: false,
    },
  });

  const watchTo = watch("to");
  const watchCc = watch("cc");
  const watchBcc = watch("bcc");
  const watchSubject = watch("subject");
  const watchHtml = watch("html");
  const watchSenderAlias = watch("senderAlias");
  const watchIsFollowup = watch("isFollowup");

  // Keep sender user synced
  useEffect(() => {
    if (currentUser) {
      setValue("sentByUserId", currentUser.id);
      setValue("sentByUserName", currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim() : "Team Member");
    }
  }, [currentUser, setValue]);

  // Draft Autosave effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (watchSubject || watchHtml) {
        localStorage.setItem(
          "axorks_email_draft",
          JSON.stringify({ to: watchTo, subject: watchSubject, html: watchHtml, senderAlias: watchSenderAlias })
        );
        setLastDraftSaved(new Date().toLocaleTimeString());
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [watchTo, watchSubject, watchHtml, watchSenderAlias]);

  // AI Email Generator trigger
  const handleGenerateAiEmail = async () => {
    if (!aiCompany) {
      toast.error("Please enter a company name for AI generation");
      return;
    }

    setIsAiGenerating(true);
    try {
      const res = await fetch("/api/email/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: aiCompany,
          industry: aiIndustry,
          decisionMaker: aiDecisionMaker,
          painPoints: aiPainPoints,
          interestedService: aiService,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setValue("subject", data.subject);
        setValue("html", data.html);
        toast.success("Personalized AI Email generated!");
        setShowAiAccordion(false);
      } else {
        toast.error(data.error || "Failed to generate AI email");
      }
    } catch {
      toast.error("Error generating AI email");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Formatting Toolbar Helper
  const applyFormat = (tag: string, endTag?: string) => {
    const current = watchHtml;
    if (tag === "ul") {
      setValue("html", current + "<ul><li>Item 1</li><li>Item 2</li></ul>");
    } else if (tag === "ol") {
      setValue("html", current + "<ol><li>First</li><li>Second</li></ol>");
    } else if (tag === "table") {
      setValue(
        "html",
        current +
          "<table border='1' style='border-collapse:collapse;width:100%;'><tr><th>Header 1</th><th>Header 2</th></tr><tr><td>Data 1</td><td>Data 2</td></tr></table>"
      );
    } else if (tag === "code") {
      setValue("html", current + "<pre><code>// Code block</code></pre>");
    } else if (tag === "a") {
      setValue("html", current + ' <a href="https://axorks.com" target="_blank">Axorks Website</a> ');
    } else if (tag === "button") {
      setValue(
        "html",
        current +
          ' <p><a href="#" style="background:#7c3aed;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Schedule Call</a></p> '
      );
    } else {
      setValue("html", `${current} <${tag}>Formatted Text</${endTag || tag}> `);
    }
  };

  // Submit Handler
  const onSubmit = async (data: EmailSendInput) => {
    setIsSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          ...data,
          sentByUserId: currentUser?.id,
          sentByUserName: currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim() : "Team Member",
          sentByUserEmail: currentUser?.email,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(`Email sent successfully from ${data.senderAlias || "sales@axorks.com"} to ${data.to.join(", ")}!`);
        localStorage.removeItem("axorks_email_draft");
        if (onSuccess) onSuccess();
      } else {
        const errorMsg = result.error || result.message || "Failed to send email";
        toast.error(errorMsg);
      }
    } catch (err: any) {
      toast.error(err.message || "Error sending email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-4xl mx-auto">
      {/* Top Action Bar & Draft Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <TemplateSelector
            onSelect={(t) => {
              setValue("subject", t.subject);
              setValue("html", t.html);
              toast.info(`Applied template: ${t.name}`);
            }}
          />
          <EmailPreview
            to={watchTo}
            cc={watchCc}
            bcc={watchBcc}
            subject={watchSubject}
            html={watchHtml}
          />
          <button
            type="button"
            onClick={() => setShowAiAccordion(!showAiAccordion)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            AI Generator
          </button>
        </div>

        <div className="flex items-center gap-3">
          {lastDraftSaved && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Save className="w-3 h-3 text-emerald-500" /> Draft saved {lastDraftSaved}
            </span>
          )}
          <button
            type="submit"
            disabled={isSending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition transform active:scale-95 disabled:opacity-50"
          >
            {isSending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Send from {watchSenderAlias?.replace("@axorks.com", "")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Generator Accordion Panel */}
      {showAiAccordion && (
        <div className="p-4 bg-gradient-to-r from-violet-950/40 via-indigo-950/20 to-slate-900 border border-violet-500/30 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-violet-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-violet-400" /> AI Outreach Personalization Engine
            </h4>
            <button
              type="button"
              onClick={() => setShowAiAccordion(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Company Name *</label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={aiCompany}
                onChange={(e) => setAiCompany(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Decision Maker Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Tech (CTO)"
                value={aiDecisionMaker}
                onChange={(e) => setAiDecisionMaker(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Service / Solution</label>
              <input
                type="text"
                placeholder="e.g. Full-Stack Software Development"
                value={aiService}
                onChange={(e) => setAiService(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-slate-400 font-medium">Pain Points / Context</label>
              <input
                type="text"
                placeholder="e.g. Scaling API latency and slow deployment cycles"
                value={aiPainPoints}
                onChange={(e) => setAiPainPoints(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateAiEmail}
              disabled={isAiGenerating}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0"
            >
              {isAiGenerating ? "Generating..." : "Generate AI Draft"}
            </button>
          </div>
        </div>
      )}

      {/* Main Sender & Recipient Card */}
      <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        {/* Sender Alias & Follow-up Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-violet-400" /> Send From Google Workspace Alias *
            </label>
            <div className="relative mt-1">
              <select
                {...register("senderAlias")}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:border-violet-500 font-mono font-bold appearance-none cursor-pointer"
              >
                {WORKSPACE_ALIASES.map((alias) => (
                  <option key={alias} value={alias}>
                    {alias} ({alias === "sales@axorks.com" ? "Primary Sales" : alias.split("@")[0]})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300 select-none">
              <input
                type="checkbox"
                {...register("isFollowup")}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500"
              />
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Mark as Follow-up Sequence
              </span>
            </label>
          </div>
        </div>

        {/* Recent CRM Contacts Pills */}
        <RecentRecipients
          selectedEmails={watchTo}
          onSelect={(email) => setValue("to", [...watchTo, email])}
        />

        {/* TO Recipient */}
        <Controller
          name="to"
          control={control}
          render={({ field }) => (
            <RecipientSelector
              label="To *"
              value={field.value}
              onChange={field.onChange}
              placeholder="Enter recipient emails..."
            />
          )}
        />
        {errors.to && <p className="text-xs text-red-500">{errors.to.message}</p>}

        {/* Toggle CC/BCC */}
        {!showCcBcc && (
          <button
            type="button"
            onClick={() => setShowCcBcc(true)}
            className="text-xs text-violet-400 hover:underline font-medium"
          >
            + Add CC / BCC
          </button>
        )}

        {/* CC & BCC Selectors */}
        {showCcBcc && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-800">
            <Controller
              name="cc"
              control={control}
              render={({ field }) => (
                <RecipientSelector
                  label="CC"
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add CC recipient..."
                />
              )}
            />
            <Controller
              name="bcc"
              control={control}
              render={({ field }) => (
                <RecipientSelector
                  label="BCC"
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Add BCC recipient..."
                />
              )}
            />
          </div>
        )}

        {/* Subject Input */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Subject *
          </label>
          <input
            type="text"
            {...register("subject")}
            placeholder="Enter email subject line..."
            className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 font-medium"
          />
          {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
        </div>
      </div>

      {/* Editor & Formatting Card */}
      <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Email Body (Rich HTML)
          </label>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => applyFormat("strong", "strong")}
              title="Bold"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("em", "em")}
              title="Italic"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("ul")}
              title="Bullet List"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("ol")}
              title="Numbered List"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("a")}
              title="Link"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("table")}
              title="Table"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("code")}
              title="Code Block"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <textarea
          {...register("html")}
          rows={10}
          className="w-full p-3 font-mono text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-100 focus:outline-none focus:border-violet-500 leading-relaxed"
        />
        {errors.html && <p className="text-xs text-red-500">{errors.html.message}</p>}
      </div>

      {/* Attachment Uploader Card */}
      <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-xl">
        <Controller
          name="attachments"
          control={control}
          render={({ field }) => (
            <AttachmentUploader
              attachments={field.value || []}
              onChange={field.onChange}
            />
          )}
        />
      </div>
    </form>
  );
}
