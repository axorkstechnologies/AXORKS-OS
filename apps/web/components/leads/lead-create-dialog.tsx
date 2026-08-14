"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { X } from "lucide-react";

interface LeadCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LeadCreateDialog({ open, onClose, onSuccess }: LeadCreateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [decisionMakerName, setDecisionMakerName] = useState("");
  const [decisionMakerTitle, setDecisionMakerTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [source, setSource] = useState("manual");
  const [sourceDetail, setSourceDetail] = useState("");
  const [status, setStatus] = useState("new");
  const [notes, setNotes] = useState("");
  // ─── Tracking Fields ─────────────────────────────
  const [firstContactMethod, setFirstContactMethod] = useState("");
  const [result, setResult] = useState("");
  const [meetingScheduled, setMeetingScheduled] = useState(false);
  const [proposalSent, setProposalSent] = useState(false);
  const [closed, setClosed] = useState(false);
  const [revenue, setRevenue] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient("/api/v1/leads", {
        method: "POST",
        body: JSON.stringify({
          business_name: businessName || null,
          decision_maker_name: decisionMakerName || null,
          decision_maker_title: decisionMakerTitle || null,
          email: email || null,
          phone: phone || null,
          website: website || null,
          industry: industry || null,
          country: country || null,
          source,
          source_detail: sourceDetail || null,
          status,
          notes: notes || null,
          first_contact_method: firstContactMethod || null,
          result: result || null,
          meeting_scheduled: meetingScheduled,
          proposal_sent: proposalSent,
          closed,
          revenue: revenue ? parseFloat(revenue) : null,
        }),
      });
      toast.success("Lead created successfully");
      // Reset form
      setBusinessName("");
      setDecisionMakerName("");
      setDecisionMakerTitle("");
      setEmail("");
      setPhone("");
      setWebsite("");
      setIndustry("");
      setCountry("");
      setSource("manual");
      setSourceDetail("");
      setStatus("new");
      setNotes("");
      setFirstContactMethod("");
      setResult("");
      setMeetingScheduled(false);
      setProposalSent(false);
      setClosed(false);
      setRevenue("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-medium placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-950 p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white">New Lead</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs text-slate-200">
          {/* ─── Company Info ─────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Business / Company Name</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Corp" className={inputClass} />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Website URL</label>
              <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://acme.com" className={inputClass} />
            </div>
          </div>

          {/* ─── Decision Maker ───────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Decision Maker Name</label>
              <input type="text" value={decisionMakerName} onChange={(e) => setDecisionMakerName(e.target.value)} placeholder="Jane Doe" className={inputClass} />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Title / Role</label>
              <input type="text" value={decisionMakerTitle} onChange={(e) => setDecisionMakerTitle(e.target.value)} placeholder="CEO / Director" className={inputClass} />
            </div>
          </div>

          {/* ─── Contact Info ─────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" className={inputClass} />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Phone / WhatsApp</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={inputClass} />
            </div>
          </div>

          {/* ─── Location & Industry ─────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Industry</label>
              <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Software / Healthcare" className={inputClass} />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Country</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" className={inputClass} />
            </div>
          </div>

          {/* ─── Source & Status ──────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Lead Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
                <option value="manual">Manual Entry</option>
                <option value="hunter">Hunter (API)</option>
                <option value="google_maps">Google Maps</option>
                <option value="linkedin">LinkedIn</option>
                <option value="clutch">Clutch</option>
                <option value="goodfirms">GoodFirms</option>
                <option value="yelp">Yelp</option>
                <option value="bbb">BBB</option>
                <option value="manta">Manta</option>
                <option value="cold_call">Phone Call / WhatsApp</option>
                <option value="referral">Referral / Word of Mouth</option>
                <option value="website">Website Contact Form</option>
                <option value="cold_email">Email Inquiry / Cold Email</option>
                <option value="other">Other External Source</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Initial Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Source Detail / Reference</label>
            <input type="text" value={sourceDetail} onChange={(e) => setSourceDetail(e.target.value)}
              placeholder="e.g. WhatsApp message from +123456, Referred by Alex" className={inputClass} />
          </div>

          {/* ─── Tracking Pipeline Fields ────────────────── */}
          <div className="border-t border-slate-800 pt-3 mt-2">
            <h3 className="text-xs font-bold text-violet-400 mb-3 uppercase tracking-wider">Pipeline Tracking</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">First Contact Method</label>
                <select value={firstContactMethod} onChange={(e) => setFirstContactMethod(e.target.value)} className={inputClass}>
                  <option value="">Not yet contacted</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone Call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="linkedin">LinkedIn Message</option>
                  <option value="meeting">In-Person Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Result</label>
                <select value={result} onChange={(e) => setResult(e.target.value)} className={inputClass}>
                  <option value="">Pending</option>
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="callback">Callback Requested</option>
                  <option value="no_response">No Response</option>
                  <option value="wrong_contact">Wrong Contact</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={meetingScheduled} onChange={(e) => setMeetingScheduled(e.target.checked)}
                  className="w-4 h-4 accent-violet-600 rounded" />
                <span className="text-slate-200 font-medium">Meeting Scheduled</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={proposalSent} onChange={(e) => setProposalSent(e.target.checked)}
                  className="w-4 h-4 accent-violet-600 rounded" />
                <span className="text-slate-200 font-medium">Proposal Sent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={closed} onChange={(e) => setClosed(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded" />
                <span className="text-slate-200 font-medium">Closed / Won</span>
              </label>
            </div>

            <div className="mt-3">
              <label className="block font-semibold text-slate-300 mb-1">Revenue (USD)</label>
              <input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)}
                placeholder="0.00" step="0.01" min="0" className={inputClass} />
            </div>
          </div>

          {/* ─── Notes ───────────────────────────────────── */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Notes / Requirements</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Add key notes, requested services, or initial conversation details..."
              className={inputClass} />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold disabled:opacity-50 transition shadow-lg shadow-violet-600/30">
              {loading ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
