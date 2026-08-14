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
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";

interface ComposeEmailProps {
  initialTo?: string[];
  initialSubject?: string;
  initialBody?: string;
  leadId?: string;
  onSuccess?: () => void;
}

export function ComposeEmail({
  initialTo = [],
  initialSubject = "",
  initialBody = "",
  leadId,
  onSuccess,
}: ComposeEmailProps) {
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
      attachments: [],
      leadId,
    },
  });

  const watchTo = watch("to");
  const watchCc = watch("cc");
  const watchBcc = watch("bcc");
  const watchSubject = watch("subject");
  const watchHtml = watch("html");
  const watchAttachments = watch("attachments");

  // Draft Autosave effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (watchSubject || watchHtml) {
        localStorage.setItem(
          "axorks_email_draft",
          JSON.stringify({ to: watchTo, subject: watchSubject, html: watchHtml })
        );
        setLastDraftSaved(new Date().toLocaleTimeString());
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [watchTo, watchSubject, watchHtml]);

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
    } catch (err) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(`Email sent successfully to ${data.to.join(", ")}!`);
        localStorage.removeItem("axorks_email_draft");
        if (onSuccess) onSuccess();
      } else {
        const errorMsg = result.error || result.message || "Failed to send email via Resend";
        toast.error(errorMsg);
      }
    } catch (err: any) {
      toast.error(err.message || "Error sending email via Resend API");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-4xl mx-auto">
      {/* Top Action Bar & Draft Status */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-950/40 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Email Generator
          </button>
        </div>

        <div className="flex items-center gap-3">
          {lastDraftSaved && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Save className="w-3 h-3 text-emerald-500" /> Draft saved {lastDraftSaved}
            </span>
          )}
          <button
            type="submit"
            disabled={isSending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-600/30 transition disabled:opacity-50"
          >
            {isSending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Send via Resend
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Generator Accordion Panel */}
      {showAiAccordion && (
        <div className="p-4 bg-gradient-to-r from-violet-900/20 via-indigo-900/10 to-slate-900 border border-violet-500/30 rounded-xl space-y-3">
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
                className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Decision Maker Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Tech (CTO)"
                value={aiDecisionMaker}
                onChange={(e) => setAiDecisionMaker(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Service / Solution</label>
              <input
                type="text"
                placeholder="e.g. Next.js & Cloud Modernization"
                value={aiService}
                onChange={(e) => setAiService(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-slate-100"
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
                className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-slate-100 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateAiEmail}
              disabled={isAiGenerating}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0"
            >
              {isAiGenerating ? "Generating..." : "Generate AI Draft"}
            </button>
          </div>
        </div>
      )}

      {/* Main Recipient & Subject Card */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
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
            className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
          >
            + Add CC / BCC
          </button>
        )}

        {/* CC & BCC Selectors */}
        {showCcBcc && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
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
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Subject *
          </label>
          <input
            type="text"
            {...register("subject")}
            placeholder="Enter email subject line..."
            className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
        </div>
      </div>

      {/* Editor & Formatting Card */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Email Body (Rich HTML)
          </label>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => applyFormat("strong", "strong")}
              title="Bold"
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-violet-600 rounded"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("em", "em")}
              title="Italic"
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-violet-600 rounded"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("ul")}
              title="Bullet List"
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-violet-600 rounded"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("ol")}
              title="Numbered List"
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-violet-600 rounded"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("a")}
              title="Link"
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-violet-600 rounded"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("table")}
              title="Table"
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-violet-600 rounded"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("code")}
              title="Code Block"
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-violet-600 rounded"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("button")}
              title="CTA Button"
              className="px-2 py-0.5 text-[10px] font-bold bg-violet-600 text-white rounded hover:bg-violet-700"
            >
              + CTA Button
            </button>
          </div>
        </div>

        <textarea
          {...register("html")}
          rows={10}
          className="w-full p-3 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        {errors.html && <p className="text-xs text-red-500">{errors.html.message}</p>}
      </div>

      {/* Attachment Uploader Card */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
