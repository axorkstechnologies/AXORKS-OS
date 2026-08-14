// Shared in-memory fallback store for leads when FastAPI backend is unreachable

export interface LeadRecord {
  id: string;
  organization_id: string;
  workspace_id: string;
  business_name: string | null;
  website: string | null;
  industry: string | null;
  country: string | null;
  company_size: string | null;
  revenue_range: string | null;
  linkedin_url: string | null;
  decision_maker_name: string | null;
  decision_maker_title: string | null;
  phone: string | null;
  email: string | null;
  source: string;
  source_detail: string | null;
  status: string;
  score: number;
  owner_id: string | null;
  notes: string | null;
  tags: string[];
  custom_fields: Record<string, any>;
  // ─── Pipeline Tracking Fields ───────────────────
  first_contact_method: string | null;
  result: string | null;
  meeting_scheduled: boolean;
  proposal_sent: boolean;
  closed: boolean;
  revenue: number | null;
  created_at: string;
  updated_at: string;
}

export const LEADS_STORE: LeadRecord[] = [
  {
    id: "lead_init_01",
    organization_id: "00000000-0000-0000-0000-000000000001",
    workspace_id: "00000000-0000-0000-0000-000000000001",
    business_name: "Acme Software Corp",
    website: "https://acmesoftware.com",
    industry: "Enterprise Software",
    country: "United States",
    company_size: "50-200",
    revenue_range: "$5M - $10M",
    linkedin_url: "https://linkedin.com/company/acme",
    decision_maker_name: "Alex Johnson",
    decision_maker_title: "VP of Engineering",
    phone: "+1 (555) 234-5678",
    email: "alex.j@acmesoftware.com",
    source: "manual",
    source_detail: "Direct Outreach",
    status: "new",
    score: 85,
    owner_id: null,
    notes: "Interested in custom AI workflow automation.",
    tags: ["enterprise", "ai"],
    custom_fields: {},
    first_contact_method: "email",
    result: "interested",
    meeting_scheduled: false,
    proposal_sent: false,
    closed: false,
    revenue: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "lead_init_02",
    organization_id: "00000000-0000-0000-0000-000000000001",
    workspace_id: "00000000-0000-0000-0000-000000000001",
    business_name: "Innovate AI Labs",
    website: "https://innovateai.io",
    industry: "Artificial Intelligence",
    country: "United Kingdom",
    company_size: "10-50",
    revenue_range: "$1M - $5M",
    linkedin_url: null,
    decision_maker_name: "Sarah Jenkins",
    decision_maker_title: "CTO",
    phone: "+44 20 7946 0912",
    email: "sarah@innovateai.io",
    source: "website",
    source_detail: "Website Contact Form",
    status: "contacted",
    score: 92,
    owner_id: null,
    notes: "Requires full-stack platform development.",
    tags: ["high-priority"],
    custom_fields: {},
    first_contact_method: "phone",
    result: "callback",
    meeting_scheduled: true,
    proposal_sent: false,
    closed: false,
    revenue: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function addLeadToStore(input: Partial<LeadRecord>): LeadRecord {
  const newLead: LeadRecord = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    organization_id: input.organization_id || "00000000-0000-0000-0000-000000000001",
    workspace_id: input.workspace_id || "00000000-0000-0000-0000-000000000001",
    business_name: input.business_name || input.decision_maker_name || input.email || input.phone || `New Lead #${LEADS_STORE.length + 1}`,
    website: input.website || null,
    industry: input.industry || null,
    country: input.country || null,
    company_size: input.company_size || null,
    revenue_range: input.revenue_range || null,
    linkedin_url: input.linkedin_url || null,
    decision_maker_name: input.decision_maker_name || null,
    decision_maker_title: input.decision_maker_title || null,
    phone: input.phone || null,
    email: input.email || null,
    source: input.source || "manual",
    source_detail: input.source_detail || null,
    status: input.status || "new",
    score: input.score || 50,
    owner_id: input.owner_id || null,
    notes: input.notes || null,
    tags: input.tags || [],
    custom_fields: input.custom_fields || {},
    first_contact_method: input.first_contact_method || null,
    result: input.result || null,
    meeting_scheduled: input.meeting_scheduled || false,
    proposal_sent: input.proposal_sent || false,
    closed: input.closed || false,
    revenue: input.revenue || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  LEADS_STORE.unshift(newLead);
  return newLead;
}
