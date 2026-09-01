/**
 * Axorks OS — Central Business Repository (Neon PostgreSQL Integration)
 *
 * Provides database-backed CRUD operations for Projects, Leads, CRM Contacts,
 * Invoices, Proposals, and Email Follow-ups.
 */

import { sql, DATABASE_URL } from "./db";

// ─── Projects Repository ─────────────────────────────────────────────

export interface ProjectRecord {
  id: string;
  name: string;
  client_name: string;
  status: string;
  budget: number;
  spent: number;
  deadline: string;
  health: string;
  description?: string;
  tech_stack?: string[];
  team_members?: string[];
  assigned_to?: string[];
  assigned_to_names?: string[];
  assigned_by?: string;
  assigned_at?: string;
  created_at: string;
  updated_at: string;
}

export async function getProjectsAsync(): Promise<ProjectRecord[]> {
  try {
    const rows = await sql`SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC`;
    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        client_name: r.client_name || "Internal",
        status: r.status || "in_progress",
        budget: Number(r.budget || 0),
        spent: Number(r.spent || 0),
        deadline: r.deadline ? new Date(r.deadline).toISOString().split("T")[0] : "2026-12-31",
        health: r.health || "good",
        description: r.description || "",
        tech_stack: r.tech_stack || ["Next.js", "TypeScript"],
        team_members: r.team_members || ["Muhammad Mujahid", "Farwa"],
        assigned_to: Array.isArray(r.assigned_to) ? r.assigned_to : [],
        assigned_to_names: Array.isArray(r.assigned_to_names) ? r.assigned_to_names : [],
        assigned_by: r.assigned_by || undefined,
        assigned_at: r.assigned_at ? new Date(r.assigned_at).toISOString() : undefined,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }));
    }

    // Seed default project into DB if empty
    const seed = await sql`
      INSERT INTO projects (name, client_name, status, budget, spent, deadline, health, description, tech_stack, team_members, assigned_to_names)
      VALUES (
        'Axorks OS Enterprise System',
        'Axorks Technologies',
        'in_progress',
        45000.00,
        18500.00,
        '2026-09-30',
        'good',
        'Next-Gen Operating System for Software Agencies',
        ARRAY['Next.js', 'TypeScript', 'PostgreSQL', 'TailwindCSS'],
        ARRAY['Muhammad Mujahid', 'Farwa', 'Farhana Bakht'],
        ARRAY['Muhammad Mujahid']
      ) RETURNING *;
    `;
    if (seed && seed.length > 0) {
      return seed.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        client_name: r.client_name,
        status: r.status,
        budget: Number(r.budget),
        spent: Number(r.spent),
        deadline: new Date(r.deadline).toISOString().split("T")[0],
        health: r.health,
        description: r.description,
        tech_stack: r.tech_stack,
        team_members: r.team_members,
        assigned_to: Array.isArray(r.assigned_to) ? r.assigned_to : [],
        assigned_to_names: Array.isArray(r.assigned_to_names) ? r.assigned_to_names : [],
        assigned_by: r.assigned_by || undefined,
        assigned_at: r.assigned_at ? new Date(r.assigned_at).toISOString() : undefined,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      }));
    }
  } catch (err) {
    console.error("Error fetching projects from Neon DB:", err);
  }
  return [];
}

export async function assignProjectEngineersAsync(
  projectId: string,
  assignedToUserIds: string[],
  assignedToNames: string[],
  assignedBy: string = "Founder"
): Promise<ProjectRecord | null> {
  try {
    const rows = await sql`
      UPDATE projects
      SET assigned_to = ${assignedToUserIds},
          assigned_to_names = ${assignedToNames},
          assigned_by = ${assignedBy},
          assigned_at = NOW(),
          updated_at = NOW()
      WHERE id::text = ${projectId}
      RETURNING *;
    `;

    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        id: String(r.id),
        name: r.name,
        client_name: r.client_name,
        status: r.status,
        budget: Number(r.budget || 0),
        spent: Number(r.spent || 0),
        deadline: r.deadline ? new Date(r.deadline).toISOString().split("T")[0] : "2026-12-31",
        health: r.health,
        description: r.description,
        tech_stack: r.tech_stack,
        team_members: r.team_members,
        assigned_to: Array.isArray(r.assigned_to) ? r.assigned_to : [],
        assigned_to_names: Array.isArray(r.assigned_to_names) ? r.assigned_to_names : [],
        assigned_by: r.assigned_by,
        assigned_at: r.assigned_at ? new Date(r.assigned_at).toISOString() : undefined,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      };
    }
  } catch (err) {
    console.error("Error assigning project engineers in Neon DB:", err);
  }
  return null;
}

export async function createProjectAsync(data: {
  name: string;
  client_name?: string;
  budget?: number;
  spent?: number;
  deadline?: string;
  status?: string;
  health?: string;
  description?: string;
  tech_stack?: string[];
  team_members?: string[];
}): Promise<ProjectRecord> {
  const name = data.name.trim();
  const clientName = data.client_name || "Direct Client";
  const budget = data.budget || 0;
  const spent = data.spent || 0;
  const deadline = data.deadline || "2026-12-31";
  const status = data.status || "in_progress";
  const health = data.health || "good";
  const description = data.description || "";
  const techStack = data.tech_stack || ["TypeScript", "Next.js"];
  const teamMembers = data.team_members || ["Muhammad Mujahid"];

  const rows = await sql`
    INSERT INTO projects (name, client_name, budget, spent, deadline, status, health, description, tech_stack, team_members, created_at, updated_at)
    VALUES (${name}, ${clientName}, ${budget}, ${spent}, ${deadline}, ${status}, ${health}, ${description}, ${techStack}, ${teamMembers}, NOW(), NOW())
    RETURNING *;
  `;

  const r = rows[0];
  return {
    id: String(r.id),
    name: r.name,
    client_name: r.client_name,
    status: r.status,
    budget: Number(r.budget),
    spent: Number(r.spent),
    deadline: new Date(r.deadline).toISOString().split("T")[0],
    health: r.health,
    description: r.description,
    tech_stack: r.tech_stack,
    team_members: r.team_members,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

// ─── Leads Repository ────────────────────────────────────────────────

export interface LeadRecord {
  id: string;
  business_name: string;
  website?: string;
  industry?: string;
  country?: string;
  decision_maker_name?: string;
  decision_maker_title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  source?: string;
  status?: string;
  score?: number;
  notes?: string;
  ai_research?: any;
  verification_status?: "verified" | "risky" | "invalid" | "unverified";
  verification_score?: number;
  is_verified?: boolean;
  mx_valid?: boolean;
  verification_notes?: string;
  first_contacted_by?: string | null;
  first_contacted_by_name?: string | null;
  contacted_at?: string | null;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
}

export function mapDbRowToLeadRecord(r: any): LeadRecord {
  return {
    id: String(r.id),
    business_name: r.business_name || r.company || "Prospect Company",
    website: r.website || "",
    industry: r.industry || "Technology",
    country: r.country || "USA",
    decision_maker_name: r.decision_maker_name || r.name || "Contact",
    decision_maker_title: r.decision_maker_title || r.title || "Director",
    email: r.email || "",
    phone: r.phone || "",
    linkedin_url: r.linkedin_url || "",
    source: r.source || "manual",
    status: r.status || "new",
    score: Number(r.score || 75),
    notes: r.notes || "",
    ai_research: r.ai_research || null,
    verification_status: r.verification_status || (r.is_verified ? "verified" : "unverified"),
    verification_score: Number(r.verification_score || (r.is_verified ? 90 : 50)),
    is_verified: Boolean(r.is_verified || r.verification_status === "verified"),
    mx_valid: Boolean(r.mx_valid),
    verification_notes: r.verification_notes || "",
    first_contacted_by: r.first_contacted_by || null,
    first_contacted_by_name: r.first_contacted_by_name || null,
    contacted_at: r.contacted_at ? new Date(r.contacted_at).toISOString() : null,
    assigned_to: r.assigned_to || null,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function getLeadsAsync(filters: {
  userId?: string;
  isFounder?: boolean;
  search?: string;
  status?: string;
  verifiedOnly?: boolean;
  verificationStatus?: string;
} = {}): Promise<LeadRecord[]> {
  try {
    const isFounder = filters.isFounder || false;
    const userId = filters.userId;
    const search = filters.search?.trim();
    const status = filters.status?.trim();
    const verifiedOnly = filters.verifiedOnly;
    const vStatus = filters.verificationStatus?.trim();

    let rows: any[] = [];

    // Base query filters
    if (isFounder) {
      rows = await sql`
        SELECT * FROM leads 
        WHERE deleted_at IS NULL
          AND (${search ? sql`(LOWER(business_name) ILIKE ${`%${search.toLowerCase()}%`} OR LOWER(email) ILIKE ${`%${search.toLowerCase()}%`} OR LOWER(decision_maker_name) ILIKE ${`%${search.toLowerCase()}%`})` : sql`TRUE`})
          AND (${status ? sql`status = ${status}` : sql`TRUE`})
          AND (${verifiedOnly ? sql`(is_verified = TRUE OR verification_status = 'verified')` : sql`TRUE`})
          AND (${vStatus ? sql`verification_status = ${vStatus}` : sql`TRUE`})
        ORDER BY created_at DESC;
      `;
    } else if (userId) {
      rows = await sql`
        SELECT * FROM leads 
        WHERE deleted_at IS NULL 
          AND (first_contacted_by IS NULL OR first_contacted_by = ${userId} OR assigned_to = ${userId})
          AND (${search ? sql`(LOWER(business_name) ILIKE ${`%${search.toLowerCase()}%`} OR LOWER(email) ILIKE ${`%${search.toLowerCase()}%`} OR LOWER(decision_maker_name) ILIKE ${`%${search.toLowerCase()}%`})` : sql`TRUE`})
          AND (${status ? sql`status = ${status}` : sql`TRUE`})
          AND (${verifiedOnly ? sql`(is_verified = TRUE OR verification_status = 'verified')` : sql`TRUE`})
          AND (${vStatus ? sql`verification_status = ${vStatus}` : sql`TRUE`})
        ORDER BY created_at DESC;
      `;
    } else {
      rows = await sql`
        SELECT * FROM leads 
        WHERE deleted_at IS NULL 
          AND first_contacted_by IS NULL
          AND (${search ? sql`(LOWER(business_name) ILIKE ${`%${search.toLowerCase()}%`} OR LOWER(email) ILIKE ${`%${search.toLowerCase()}%`} OR LOWER(decision_maker_name) ILIKE ${`%${search.toLowerCase()}%`})` : sql`TRUE`})
          AND (${status ? sql`status = ${status}` : sql`TRUE`})
          AND (${verifiedOnly ? sql`(is_verified = TRUE OR verification_status = 'verified')` : sql`TRUE`})
          AND (${vStatus ? sql`verification_status = ${vStatus}` : sql`TRUE`})
        ORDER BY created_at DESC;
      `;
    }

    if (rows && rows.length > 0) {
      return rows.map(mapDbRowToLeadRecord);
    }
  } catch (err) {
    console.error("Error fetching leads from Neon DB:", err);
  }
  return [];
}

export async function recordLeadOutreachAsync(
  leadIdOrEmail: string,
  userId: string,
  userName: string,
  action: "email" | "call" | "note" = "email"
): Promise<boolean> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadIdOrEmail);

    let rows: any[] = [];
    if (isUuid) {
      rows = await sql`
        UPDATE leads
        SET 
          status = CASE WHEN status = 'new' THEN 'contacted' ELSE status END,
          first_contacted_by = COALESCE(first_contacted_by, ${userId}),
          first_contacted_by_name = COALESCE(first_contacted_by_name, ${userName}),
          contacted_at = COALESCE(contacted_at, NOW()),
          updated_at = NOW()
        WHERE id::text = ${leadIdOrEmail}
          AND (first_contacted_by IS NULL OR first_contacted_by = ${userId})
        RETURNING *;
      `;
    } else {
      const emailLower = leadIdOrEmail.toLowerCase().trim();
      rows = await sql`
        UPDATE leads
        SET 
          status = CASE WHEN status = 'new' THEN 'contacted' ELSE status END,
          first_contacted_by = COALESCE(first_contacted_by, ${userId}),
          first_contacted_by_name = COALESCE(first_contacted_by_name, ${userName}),
          contacted_at = COALESCE(contacted_at, NOW()),
          updated_at = NOW()
        WHERE LOWER(email) = ${emailLower}
          AND (first_contacted_by IS NULL OR first_contacted_by = ${userId})
        RETURNING *;
      `;
    }

    return rows && rows.length > 0;
  } catch (err) {
    console.error("Error claiming lead exclusivity:", err);
    return false;
  }
}

export async function getLeadByIdAsync(id: string): Promise<LeadRecord | null> {
  try {
    const rows = await sql`
      SELECT * FROM leads 
      WHERE id::text = ${id} AND deleted_at IS NULL
      LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      return mapDbRowToLeadRecord(rows[0]);
    }
  } catch (err) {
    console.error("Error fetching lead by ID from Neon DB:", err);
  }
  return null;
}

export async function createLeadAsync(data: Partial<LeadRecord> & any): Promise<LeadRecord> {
  const businessName = (data.business_name || data.company || data.company_name || data.name || "New Lead").trim();
  const website = data.website || "";
  const industry = data.industry || "General";
  const country = data.country || "USA";
  const dmName = data.decision_maker_name || data.name || data.contact_name || "";
  const dmTitle = data.decision_maker_title || data.title || data.position || "";
  const email = (data.email || "").trim();
  const phone = data.phone || "";
  const linkedinUrl = data.linkedin_url || "";
  const source = data.source || "manual";
  const status = data.status || "new";
  const score = data.score || 50;
  const notes = data.notes || "";
  const aiResearch = data.ai_research ? (typeof data.ai_research === "string" ? data.ai_research : JSON.stringify(data.ai_research)) : null;
  const isVerified = Boolean(data.is_verified || data.verification_status === "verified");
  const vStatus = data.verification_status || (isVerified ? "verified" : "unverified");
  const vScore = data.verification_score || (isVerified ? 90 : 50);
  const mxValid = Boolean(data.mx_valid || isVerified);
  const vNotes = data.verification_notes || "";

  const rows = await sql`
    INSERT INTO leads (
      business_name, name, company, title,
      website, industry, country,
      decision_maker_name, decision_maker_title,
      email, phone, linkedin_url,
      source, status, score, notes, ai_research,
      verification_status, verification_score, is_verified, mx_valid, verification_notes,
      created_at, updated_at
    )
    VALUES (
      ${businessName}, ${dmName || businessName}, ${businessName}, ${dmTitle},
      ${website}, ${industry}, ${country},
      ${dmName}, ${dmTitle},
      ${email}, ${phone}, ${linkedinUrl},
      ${source}, ${status}, ${score}, ${notes}, ${aiResearch},
      ${vStatus}, ${vScore}, ${isVerified}, ${mxValid}, ${vNotes},
      NOW(), NOW()
    )
    RETURNING *;
  `;

  return mapDbRowToLeadRecord(rows[0]);
}

export async function updateLeadResearchAsync(id: string, researchData: any): Promise<boolean> {
  try {
    const researchJson = JSON.stringify(researchData);
    const score = researchData.confidence_score !== undefined ? researchData.confidence_score : 85;
    const website = researchData.verified_website || undefined;
    const email = researchData.verified_email || undefined;
    const dmName = researchData.decision_maker_name || undefined;
    const dmTitle = researchData.decision_maker_role || undefined;
    const linkedinUrl = researchData.decision_maker_linkedin || researchData.social_media?.linkedin_company || undefined;
    const status = researchData.verification_status === "verified_real" ? "qualified" : undefined;
    const isReal = researchData.verification_status === "verified_real";

    await sql`
      UPDATE leads
      SET
        ai_research = ${researchJson},
        score = COALESCE(${score}, score),
        website = COALESCE(${website}, website),
        email = COALESCE(${email}, email),
        decision_maker_name = COALESCE(${dmName}, decision_maker_name),
        decision_maker_title = COALESCE(${dmTitle}, decision_maker_title),
        linkedin_url = COALESCE(${linkedinUrl}, linkedin_url),
        status = COALESCE(${status}, status),
        is_verified = ${isReal},
        verification_status = ${isReal ? 'verified' : 'unverified'},
        updated_at = NOW()
      WHERE id = ${id};
    `;
    return true;
  } catch (err) {
    console.error("Error updating lead research in Neon DB:", err);
    return false;
  }
}

// ─── CRM Contacts Repository ────────────────────────────────────────

export interface CRMContactRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  title?: string;
  type?: string;
  status?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function getCRMContactsAsync(): Promise<CRMContactRecord[]> {
  try {
    const rows = await sql`SELECT * FROM crm_contacts WHERE deleted_at IS NULL ORDER BY created_at DESC`;
    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        id: String(r.id),
        first_name: r.first_name,
        last_name: r.last_name || "",
        email: r.email || "",
        phone: r.phone || "",
        company_name: r.company_name || "",
        title: r.title || "",
        type: r.type || "lead",
        status: r.status || "active",
        notes: r.notes || "",
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }));
    }

    // Seed default contact if empty
    const seed = await sql`
      INSERT INTO crm_contacts (first_name, last_name, email, phone, company_name, title, type, status)
      VALUES ('Sarah', 'Jenkins', 'sarah.j@innovate.example.com', '+1 (555) 987-6543', 'Innovate Labs', 'Head of Product', 'client', 'active')
      RETURNING *;
    `;
    if (seed && seed.length > 0) {
      return seed.map((r: any) => ({
        id: String(r.id),
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        phone: r.phone,
        company_name: r.company_name,
        title: r.title,
        type: r.type,
        status: r.status,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      }));
    }
  } catch (err) {
    console.error("Error fetching CRM contacts from Neon DB:", err);
  }
  return [];
}

export async function createCRMContactAsync(data: Partial<CRMContactRecord>): Promise<CRMContactRecord> {
  const firstName = data.first_name?.trim() || "New";
  const lastName = data.last_name?.trim() || "Contact";
  const email = data.email?.trim() || "";
  const phone = data.phone || "";
  const companyName = data.company_name || "";
  const title = data.title || "";
  const type = data.type || "lead";
  const status = data.status || "active";
  const notes = data.notes || "";

  const rows = await sql`
    INSERT INTO crm_contacts (first_name, last_name, email, phone, company_name, title, type, status, notes, created_at, updated_at)
    VALUES (${firstName}, ${lastName}, ${email}, ${phone}, ${companyName}, ${title}, ${type}, ${status}, ${notes}, NOW(), NOW())
    RETURNING *;
  `;

  const r = rows[0];
  return {
    id: String(r.id),
    first_name: r.first_name,
    last_name: r.last_name,
    email: r.email,
    phone: r.phone,
    company_name: r.company_name,
    title: r.title,
    type: r.type,
    status: r.status,
    notes: r.notes,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

// ─── Invoices Repository ─────────────────────────────────────────────

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function getInvoicesAsync(): Promise<InvoiceRecord[]> {
  try {
    const rows = await sql`SELECT * FROM invoices WHERE deleted_at IS NULL ORDER BY created_at DESC`;
    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        id: String(r.id),
        invoice_number: r.invoice_number,
        client_name: r.client_name,
        client_email: r.client_email || "",
        amount: Number(r.amount),
        status: r.status || "pending",
        issue_date: r.issue_date ? new Date(r.issue_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        due_date: r.due_date ? new Date(r.due_date).toISOString().split("T")[0] : undefined,
        notes: r.notes || "",
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }));
    }

    // Seed default invoice if empty
    const seed = await sql`
      INSERT INTO invoices (invoice_number, client_name, client_email, amount, status, issue_date, due_date)
      VALUES ('INV-2026-001', 'Innovate Labs', 'finance@innovate.example.com', 12500.00, 'paid', '2026-08-01', '2026-08-15')
      RETURNING *;
    `;
    if (seed && seed.length > 0) {
      return seed.map((r: any) => ({
        id: String(r.id),
        invoice_number: r.invoice_number,
        client_name: r.client_name,
        client_email: r.client_email,
        amount: Number(r.amount),
        status: r.status,
        issue_date: new Date(r.issue_date).toISOString().split("T")[0],
        due_date: new Date(r.due_date).toISOString().split("T")[0],
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      }));
    }
  } catch (err) {
    console.error("Error fetching invoices from Neon DB:", err);
  }
  return [];
}

export async function createInvoiceAsync(data: Partial<InvoiceRecord>): Promise<InvoiceRecord> {
  const invNumber = data.invoice_number || `INV-${Date.now().toString().slice(-6)}`;
  const clientName = data.client_name?.trim() || "Client";
  const clientEmail = data.client_email || "";
  const amount = data.amount || 0;
  const status = data.status || "pending";
  const issueDate = data.issue_date || new Date().toISOString().split("T")[0];
  const dueDate = data.due_date || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
  const notes = data.notes || "";

  const rows = await sql`
    INSERT INTO invoices (invoice_number, client_name, client_email, amount, status, issue_date, due_date, notes, created_at, updated_at)
    VALUES (${invNumber}, ${clientName}, ${clientEmail}, ${amount}, ${status}, ${issueDate}, ${dueDate}, ${notes}, NOW(), NOW())
    RETURNING *;
  `;

  const r = rows[0];
  return {
    id: String(r.id),
    invoice_number: r.invoice_number,
    client_name: r.client_name,
    client_email: r.client_email,
    amount: Number(r.amount),
    status: r.status,
    issue_date: new Date(r.issue_date).toISOString().split("T")[0],
    due_date: new Date(r.due_date).toISOString().split("T")[0],
    notes: r.notes,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

// ─── Proposals Repository ─────────────────────────────────────────────

export interface ProposalRecord {
  id: string;
  title: string;
  client_name: string;
  client_email?: string;
  value: number;
  status: string;
  valid_until?: string;
  content?: string;
  created_at: string;
  updated_at: string;
}

export async function getProposalsAsync(): Promise<ProposalRecord[]> {
  try {
    const rows = await sql`SELECT * FROM proposals WHERE deleted_at IS NULL ORDER BY created_at DESC`;
    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        id: String(r.id),
        title: r.title,
        client_name: r.client_name,
        client_email: r.client_email || "",
        value: Number(r.value || 0),
        status: r.status || "draft",
        valid_until: r.valid_until ? new Date(r.valid_until).toISOString().split("T")[0] : undefined,
        content: r.content || "",
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }));
    }

    // Seed default proposal if empty
    const seed = await sql`
      INSERT INTO proposals (title, client_name, client_email, value, status, valid_until)
      VALUES ('Custom AI Portal Architecture', 'Apex Tech Solutions', 'alex.vance@apextech.example.com', 28000.00, 'sent', '2026-09-15')
      RETURNING *;
    `;
    if (seed && seed.length > 0) {
      return seed.map((r: any) => ({
        id: String(r.id),
        title: r.title,
        client_name: r.client_name,
        client_email: r.client_email,
        value: Number(r.value),
        status: r.status,
        valid_until: new Date(r.valid_until).toISOString().split("T")[0],
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      }));
    }
  } catch (err) {
    console.error("Error fetching proposals from Neon DB:", err);
  }
  return [];
}

export async function createProposalAsync(data: Partial<ProposalRecord>): Promise<ProposalRecord> {
  const title = data.title?.trim() || "New Proposal";
  const clientName = data.client_name?.trim() || "Client";
  const clientEmail = data.client_email || "";
  const value = data.value || 0;
  const status = data.status || "draft";
  const validUntil = data.valid_until || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const content = data.content || "";

  const rows = await sql`
    INSERT INTO proposals (title, client_name, client_email, value, status, valid_until, content, created_at, updated_at)
    VALUES (${title}, ${clientName}, ${clientEmail}, ${value}, ${status}, ${validUntil}, ${content}, NOW(), NOW())
    RETURNING *;
  `;

  const r = rows[0];
  return {
    id: String(r.id),
    title: r.title,
    client_name: r.client_name,
    client_email: r.client_email,
    value: Number(r.value),
    status: r.status,
    valid_until: new Date(r.valid_until).toISOString().split("T")[0],
    content: r.content,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

// ─── Email Follow-ups Repository ──────────────────────────────────────

export interface EmailFollowupRecord {
  id: string;
  lead_id?: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body?: string;
  status: "sent" | "waiting" | "followup_needed" | "replied";
  attempts: number;
  last_sent_at: string;
  next_followup_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function getEmailFollowupsAsync(): Promise<EmailFollowupRecord[]> {
  try {
    const rows = await sql`SELECT * FROM email_followups ORDER BY last_sent_at DESC`;
    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        id: String(r.id),
        lead_id: r.lead_id ? String(r.lead_id) : undefined,
        recipient_email: r.recipient_email,
        recipient_name: r.recipient_name || "",
        subject: r.subject,
        body: r.body || "",
        status: r.status || "followup_needed",
        attempts: Number(r.attempts || 1),
        last_sent_at: r.last_sent_at ? new Date(r.last_sent_at).toISOString() : new Date().toISOString(),
        next_followup_date: r.next_followup_date ? new Date(r.next_followup_date).toISOString().split("T")[0] : undefined,
        notes: r.notes || "",
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }));
    }

    // Seed initial follow-ups if empty
    const seed = await sql`
      INSERT INTO email_followups (recipient_email, recipient_name, subject, body, status, attempts, last_sent_at, next_followup_date, notes)
      VALUES (
        'alex.vance@apextech.example.com',
        'Alex Vance',
        'Following up: AI Operating System Demo for Apex Tech',
        'Hi Alex, wanted to follow up on our previous note regarding custom AI portal architecture...',
        'followup_needed',
        1,
        NOW() - INTERVAL '3 days',
        CURRENT_DATE,
        'Tried 3 days ago. No reply yet — ready for 2nd touch.'
      ) RETURNING *;
    `;
    if (seed && seed.length > 0) {
      return seed.map((r: any) => ({
        id: String(r.id),
        recipient_email: r.recipient_email,
        recipient_name: r.recipient_name,
        subject: r.subject,
        body: r.body,
        status: r.status,
        attempts: Number(r.attempts),
        last_sent_at: new Date(r.last_sent_at).toISOString(),
        next_followup_date: new Date(r.next_followup_date).toISOString().split("T")[0],
        notes: r.notes,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      }));
    }
  } catch (err) {
    console.error("Error fetching email followups from Neon DB:", err);
  }
  return [];
}

export async function createEmailFollowupAsync(data: Partial<EmailFollowupRecord>): Promise<EmailFollowupRecord> {
  const recipientEmail = data.recipient_email?.trim() || "";
  const recipientName = data.recipient_name || "";
  const subject = data.subject?.trim() || "Follow-up";
  const body = data.body || "";
  const status = data.status || "waiting";
  const attempts = data.attempts || 1;
  const leadId = data.lead_id || null;
  const nextDate = data.next_followup_date || new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];
  const notes = data.notes || "";

  const rows = await sql`
    INSERT INTO email_followups (lead_id, recipient_email, recipient_name, subject, body, status, attempts, last_sent_at, next_followup_date, notes, created_at, updated_at)
    VALUES (${leadId}, ${recipientEmail}, ${recipientName}, ${subject}, ${body}, ${status}, ${attempts}, NOW(), ${nextDate}, ${notes}, NOW(), NOW())
    RETURNING *;
  `;

  const r = rows[0];
  return {
    id: String(r.id),
    lead_id: r.lead_id ? String(r.lead_id) : undefined,
    recipient_email: r.recipient_email,
    recipient_name: r.recipient_name,
    subject: r.subject,
    body: r.body,
    status: r.status,
    attempts: Number(r.attempts),
    last_sent_at: new Date(r.last_sent_at).toISOString(),
    next_followup_date: new Date(r.next_followup_date).toISOString().split("T")[0],
    notes: r.notes,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

export async function updateEmailFollowupAsync(id: string, updates: Partial<EmailFollowupRecord>): Promise<EmailFollowupRecord | null> {
  try {
    if (updates.status !== undefined) {
      await sql`UPDATE email_followups SET status = ${updates.status}, updated_at = NOW() WHERE id::text = ${id}`;
    }
    if (updates.attempts !== undefined) {
      await sql`UPDATE email_followups SET attempts = ${updates.attempts}, last_sent_at = NOW(), updated_at = NOW() WHERE id::text = ${id}`;
    }
    const rows = await sql`SELECT * FROM email_followups WHERE id::text = ${id} LIMIT 1`;
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        id: String(r.id),
        lead_id: r.lead_id ? String(r.lead_id) : undefined,
        recipient_email: r.recipient_email,
        recipient_name: r.recipient_name,
        subject: r.subject,
        body: r.body,
        status: r.status,
        attempts: Number(r.attempts),
        last_sent_at: new Date(r.last_sent_at).toISOString(),
        next_followup_date: r.next_followup_date ? new Date(r.next_followup_date).toISOString().split("T")[0] : undefined,
        notes: r.notes,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      };
    }
  } catch (err) {
    console.error("Error updating email followup in Neon DB:", err);
  }
  return null;
}

// ─── Screen Recordings Repository ───────────────────────────────────

export interface ScreenRecordingRecord {
  id: string;
  user_id?: string;
  employee_id?: string | null;
  employee_name?: string | null;
  recorded_by_id?: string | null;
  recorded_by_name?: string | null;
  recording_type: "screen" | "call";
  media_type: "screen_video" | "screenshot" | "call_audio";
  title: string;
  file_url?: string | null;
  image_data?: string | null;
  duration_seconds: number;
  file_size_bytes?: number;
  expires_at: string;
  created_at: string;
}

export async function getScreenRecordingsAsync(filters: {
  employeeId?: string;
} = {}): Promise<ScreenRecordingRecord[]> {
  try {
    // 1. Auto-purge expired recordings (> 1 day old) automatically
    await sql`
      DELETE FROM screen_recordings 
      WHERE expires_at IS NOT NULL AND expires_at < NOW();
    `;

    // 2. Fetch active non-expired recordings
    let rows: any[] = [];
    if (filters.employeeId) {
      rows = await sql`
        SELECT * FROM screen_recordings
        WHERE employee_id = ${filters.employeeId}
        ORDER BY created_at DESC;
      `;
    } else {
      rows = await sql`
        SELECT * FROM screen_recordings
        ORDER BY created_at DESC;
      `;
    }

    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        id: String(r.id),
        user_id: r.user_id || undefined,
        employee_id: r.employee_id || null,
        employee_name: r.employee_name || "All Staff",
        recorded_by_id: r.recorded_by_id || null,
        recorded_by_name: r.recorded_by_name || "Founder",
        recording_type: r.recording_type === "call" ? "call" : "screen",
        media_type: (r.media_type as any) || (r.recording_type === "call" ? "call_audio" : "screen_video"),
        title: r.title,
        file_url: r.file_url || null,
        image_data: r.image_data || null,
        duration_seconds: Number(r.duration_seconds || 0),
        file_size_bytes: Number(r.file_size_bytes || 0),
        expires_at: r.expires_at ? new Date(r.expires_at).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date(r.created_at).toISOString(),
      }));
    }
  } catch (err) {
    console.error("Error fetching screen recordings from Neon DB:", err);
  }
  return [];
}

export async function createScreenRecordingAsync(data: {
  title: string;
  recording_type?: "screen" | "call";
  media_type?: "screen_video" | "screenshot" | "call_audio";
  file_url?: string | null;
  image_data?: string | null;
  duration_seconds?: number;
  file_size_bytes?: number;
  user_id?: string;
  employee_id?: string | null;
  employee_name?: string | null;
  recorded_by_id?: string | null;
  recorded_by_name?: string | null;
}): Promise<ScreenRecordingRecord> {
  const title = data.title.trim();
  const recordingType = data.recording_type || (data.media_type === "call_audio" ? "call" : "screen");
  const mediaType = data.media_type || (recordingType === "call" ? "call_audio" : "screen_video");
  const fileUrl = data.file_url || null;
  const imageData = data.image_data || null;
  const duration = data.duration_seconds || 0;
  const fileSizeBytes = data.file_size_bytes || 0;
  const employeeId = data.employee_id || data.user_id || null;
  const employeeName = data.employee_name || "Employee";
  const recordedById = data.recorded_by_id || "00000000-0000-0000-0000-00000000000a";
  const recordedByName = data.recorded_by_name || "Founder / Co-Founder";

  const rows = await sql`
    INSERT INTO screen_recordings (
      employee_id, employee_name, recorded_by_id, recorded_by_name,
      recording_type, media_type, title, file_url, image_data,
      duration_seconds, file_size_bytes, expires_at, created_at
    ) VALUES (
      ${employeeId}, ${employeeName}, ${recordedById}, ${recordedByName},
      ${recordingType}, ${mediaType}, ${title}, ${fileUrl}, ${imageData},
      ${duration}, ${fileSizeBytes}, (NOW() + INTERVAL '1 day'), NOW()
    )
    RETURNING *;
  `;

  const r = rows[0];
  return {
    id: String(r.id),
    user_id: r.user_id || undefined,
    employee_id: r.employee_id || null,
    employee_name: r.employee_name || employeeName,
    recorded_by_id: r.recorded_by_id || recordedById,
    recorded_by_name: r.recorded_by_name || recordedByName,
    recording_type: r.recording_type === "call" ? "call" : "screen",
    media_type: (r.media_type as any) || mediaType,
    title: r.title,
    file_url: r.file_url || null,
    image_data: r.image_data || null,
    duration_seconds: Number(r.duration_seconds || 0),
    file_size_bytes: Number(r.file_size_bytes || 0),
    expires_at: r.expires_at ? new Date(r.expires_at).toISOString() : new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(r.created_at).toISOString(),
  };
}

export async function deleteScreenRecordingAsync(id: string): Promise<boolean> {
  try {
    await sql`DELETE FROM screen_recordings WHERE id::text = ${id};`;
    return true;
  } catch (err) {
    console.error("Error deleting screen recording:", err);
    return false;
  }
}

// ─── Workspace Emails & Google Workspace Repository ─────────────────

export type {
  WorkspaceEmailRecord,
  AliasMetric,
  EmployeeEmailMetric,
  EmailAnalyticsReport,
} from "./email/constants";
import type {
  WorkspaceEmailRecord,
  AliasMetric,
  EmployeeEmailMetric,
  EmailAnalyticsReport,
} from "./email/constants";

export async function getWorkspaceEmailsAsync(filters: {
  direction?: "inbound" | "outbound" | "all";
  alias?: string;
  is_read?: boolean;
  search?: string;
  thread_id?: string;
  limit?: number;
  offset?: number;
  userId?: string;
  userEmail?: string;
  isFounder?: boolean;
} = {}): Promise<WorkspaceEmailRecord[]> {
  try {
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    const isFounder = filters.isFounder || false;
    const search = filters.search?.trim();
    const direction = filters.direction;
    const queryAlias = filters.alias?.toLowerCase();
    const userId = filters.userId;
    const userEmail = filters.userEmail?.toLowerCase();

    // Strict Access Control: Non-founders cannot access Founder's personal inbox alias
    if (!isFounder && queryAlias && queryAlias === "muhammad.mujahid@axorks.com") {
      return [];
    }

    let rows: any[] = [];

    if (isFounder) {
      // Founder has full visibility into all emails
      rows = await sql`
        SELECT * FROM workspace_emails
        WHERE (${direction && direction !== "all" ? sql`direction = ${direction}` : sql`TRUE`})
          AND (${queryAlias && queryAlias !== "all" ? sql`(LOWER(sender_alias) = ${queryAlias} OR LOWER(recipient_email) = ${queryAlias} OR LOWER(sender_email) = ${queryAlias})` : sql`TRUE`})
          AND (${search ? sql`(
            LOWER(subject) ILIKE ${`%${search.toLowerCase()}%`} OR
            LOWER(snippet) ILIKE ${`%${search.toLowerCase()}%`} OR
            LOWER(sender_email) ILIKE ${`%${search.toLowerCase()}%`} OR
            LOWER(recipient_email) ILIKE ${`%${search.toLowerCase()}%`} OR
            LOWER(sender_name) ILIKE ${`%${search.toLowerCase()}%`} OR
            LOWER(body_text) ILIKE ${`%${search.toLowerCase()}%`}
          )` : sql`TRUE`})
          AND (${filters.is_read !== undefined ? sql`is_read = ${filters.is_read}` : sql`TRUE`})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `;
    } else {
      // Non-founders can see:
      // 1. All shared business aliases (sales@, contact@, hello@, careers@)
      // 2. All emails sent by themselves (sent_by_user_id or sender_email)
      rows = await sql`
        SELECT * FROM workspace_emails
        WHERE (${direction && direction !== "all" ? sql`direction = ${direction}` : sql`TRUE`})
          AND (${queryAlias && queryAlias !== "all" ? sql`(
            LOWER(sender_alias) = ${queryAlias} OR 
            LOWER(recipient_email) = ${queryAlias} OR 
            LOWER(sender_email) = ${queryAlias}
          )` : sql`(
            LOWER(sender_alias) IN ('sales@axorks.com', 'contact@axorks.com', 'hello@axorks.com', 'careers@axorks.com') OR
            LOWER(recipient_email) IN ('sales@axorks.com', 'contact@axorks.com', 'hello@axorks.com', 'careers@axorks.com') OR
            (${userId ? sql`sent_by_user_id = ${userId}` : sql`FALSE`}) OR
            (${userEmail ? sql`LOWER(sender_email) = ${userEmail}` : sql`FALSE`})
          )`})
          AND (${search ? sql`(
            LOWER(subject) ILIKE ${`%${search.toLowerCase()}%`} OR
            LOWER(snippet) ILIKE ${`%${search.toLowerCase()}%`} OR
            LOWER(sender_email) ILIKE ${`%${search.toLowerCase()}%`} OR
            LOWER(recipient_email) ILIKE ${`%${search.toLowerCase()}%`} OR
            LOWER(sender_name) ILIKE ${`%${search.toLowerCase()}%`} OR
            LOWER(body_text) ILIKE ${`%${search.toLowerCase()}%`}
          )` : sql`TRUE`})
          AND (${filters.is_read !== undefined ? sql`is_read = ${filters.is_read}` : sql`TRUE`})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset};
      `;
    }

    if (rows && rows.length > 0) {
      return rows.map(mapDbRowToWorkspaceEmail);
    }
  } catch (err) {
    console.error("Error fetching workspace emails from Neon DB:", err);
  }
  return [];
}

export async function getWorkspaceEmailByIdAsync(
  id: string,
  isFounder: boolean = false
): Promise<WorkspaceEmailRecord | null> {
  try {
    const rows = await sql`
      SELECT * FROM workspace_emails
      WHERE id::text = ${id} OR message_id = ${id}
      LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      const email = mapDbRowToWorkspaceEmail(rows[0]);

      // Strict check: if not Founder and this email is addressed to/from Founder personal inbox only
      if (!isFounder) {
        const BUSINESS_ALIASES = ["sales@axorks.com", "contact@axorks.com", "hello@axorks.com", "careers@axorks.com"];
        const senderAlias = (email.sender_alias || "").toLowerCase();
        const recipient = (email.recipient_email || "").toLowerCase();
        const isBusinessEmail = BUSINESS_ALIASES.includes(senderAlias) || BUSINESS_ALIASES.includes(recipient);

        if (!isBusinessEmail) {
          return null; // Block access to Founder personal email
        }
      }

      return email;
    }
  } catch (err) {
    console.error("Error fetching email by ID from Neon DB:", err);
  }
  return null;
}

export async function updateWorkspaceEmailAsync(
  id: string,
  updates: Partial<{ is_read: boolean; is_starred: boolean; converted_to_client: boolean; status: string }>
): Promise<boolean> {
  try {
    if (updates.is_read !== undefined) {
      await sql`UPDATE workspace_emails SET is_read = ${updates.is_read}, updated_at = NOW() WHERE id::text = ${id} OR message_id = ${id};`;
    }
    if (updates.is_starred !== undefined) {
      await sql`UPDATE workspace_emails SET is_starred = ${updates.is_starred}, updated_at = NOW() WHERE id::text = ${id} OR message_id = ${id};`;
    }
    if (updates.converted_to_client !== undefined) {
      await sql`UPDATE workspace_emails SET converted_to_client = ${updates.converted_to_client}, updated_at = NOW() WHERE id::text = ${id} OR message_id = ${id};`;
    }
    if (updates.status !== undefined) {
      await sql`UPDATE workspace_emails SET status = ${updates.status}, updated_at = NOW() WHERE id::text = ${id} OR message_id = ${id};`;
    }
    return true;
  } catch (err) {
    console.error("Error updating workspace email:", err);
    return false;
  }
}

export async function getEmailAnalyticsAsync(): Promise<EmailAnalyticsReport> {
  const aliasesList = [
    "sales@axorks.com",
    "contact@axorks.com",
    "hello@axorks.com",
    "careers@axorks.com",
    "muhammad.mujahid@axorks.com",
  ];

  try {
    // 1. Fetch total counts from DB
    const totalSentRows = await sql`SELECT COUNT(*)::int AS count FROM workspace_emails WHERE direction = 'outbound';`;
    const totalRecvRows = await sql`SELECT COUNT(*)::int AS count FROM workspace_emails WHERE direction = 'inbound';`;
    const totalFollowupRows = await sql`SELECT COUNT(*)::int AS count FROM workspace_emails WHERE is_followup = TRUE;`;
    const totalConvertRows = await sql`SELECT COUNT(*)::int AS count FROM workspace_emails WHERE converted_to_client = TRUE;`;

    const totalSent = totalSentRows[0]?.count || 0;
    const totalReceived = totalRecvRows[0]?.count || 0;
    const totalFollowups = totalFollowupRows[0]?.count || 0;
    const totalConversions = totalConvertRows[0]?.count || 0;

    // 2. Fetch alias breakdowns
    const aliasMetrics: AliasMetric[] = [];
    for (const alias of aliasesList) {
      const sentRows = await sql`
        SELECT COUNT(*)::int AS count FROM workspace_emails
        WHERE direction = 'outbound' AND LOWER(sender_alias) = ${alias.toLowerCase()};
      `;
      const recvRows = await sql`
        SELECT COUNT(*)::int AS count FROM workspace_emails
        WHERE direction = 'inbound' AND LOWER(sender_alias) = ${alias.toLowerCase()};
      `;
      const fRows = await sql`
        SELECT COUNT(*)::int AS count FROM workspace_emails
        WHERE direction = 'outbound' AND is_followup = TRUE AND LOWER(sender_alias) = ${alias.toLowerCase()};
      `;
      const cRows = await sql`
        SELECT COUNT(*)::int AS count FROM workspace_emails
        WHERE converted_to_client = TRUE AND LOWER(sender_alias) = ${alias.toLowerCase()};
      `;

      const sCount = sentRows[0]?.count || 0;
      const rCount = recvRows[0]?.count || 0;
      const fCount = fRows[0]?.count || 0;
      const cCount = cRows[0]?.count || 0;
      const rate = sCount > 0 ? Math.round((cCount / sCount) * 1000) / 10 : 0;

      aliasMetrics.push({
        alias,
        total_sent: sCount,
        total_received: rCount,
        followups_sent: fCount,
        converted_clients: cCount,
        conversion_rate: rate,
      });
    }

    // 3. Fetch active users and calculate employee metrics
    const users = await sql`
      SELECT id, first_name, last_name, role, avatar_url FROM users
      WHERE deleted_at IS NULL;
    `;

    const employeeMetrics: EmployeeEmailMetric[] = [];
    const executiveMetrics: EmployeeEmailMetric[] = [];

    for (const u of users) {
      const uId = String(u.id);
      const uName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Team Member";
      const uRole = u.role || "Team Member";
      const uEmail = (u.email || "").toLowerCase();

      const uSent = await sql`
        SELECT COUNT(*)::int AS count FROM workspace_emails
        WHERE direction = 'outbound' AND (
          sent_by_user_id::text = ${uId} OR 
          (sender_email IS NOT NULL AND LOWER(sender_email) = ${uEmail}) OR
          sent_by_user_name ILIKE ${`%${u.first_name}%`}
        );
      `;
      const uFollow = await sql`
        SELECT COUNT(*)::int AS count FROM workspace_emails
        WHERE direction = 'outbound' AND is_followup = TRUE AND (
          sent_by_user_id::text = ${uId} OR 
          (sender_email IS NOT NULL AND LOWER(sender_email) = ${uEmail}) OR
          sent_by_user_name ILIKE ${`%${u.first_name}%`}
        );
      `;
      const uConv = await sql`
        SELECT COUNT(*)::int AS count FROM workspace_emails
        WHERE converted_to_client = TRUE AND (
          sent_by_user_id::text = ${uId} OR 
          (sender_email IS NOT NULL AND LOWER(sender_email) = ${uEmail}) OR
          sent_by_user_name ILIKE ${`%${u.first_name}%`}
        );
      `;

      const s = uSent[0]?.count || 0;
      const f = uFollow[0]?.count || 0;
      const c = uConv[0]?.count || 0;
      const convRate = s > 0 ? Math.round((c / s) * 1000) / 10 : 0;
      const score = (s * 1) + (f * 2) + (c * 10);

      const metric: EmployeeEmailMetric = {
        user_id: uId,
        user_name: uName,
        role: uRole,
        avatar_url: u.avatar_url || undefined,
        total_sent: s,
        followups_sent: f,
        converted_clients: c,
        conversion_rate: convRate,
        score,
      };

      const isExecutive =
        uRole === "Founder" ||
        uRole === "Co-Founder" ||
        uEmail === "mujahidaryan222149@gmail.com" ||
        uEmail === "heyfarii@gmail.com" ||
        uEmail === "muhammad.mujahid@axorks.com" ||
        uEmail === "farhana.bakht@axorks.com";

      if (isExecutive) {
        executiveMetrics.push(metric);
      } else {
        employeeMetrics.push(metric);
      }
    }

    // Sort employee leaderboard by score descending
    employeeMetrics.sort((a, b) => b.score - a.score);
    executiveMetrics.sort((a, b) => b.score - a.score);

    // Assign badges to employee leaderboard
    if (employeeMetrics.length > 0) employeeMetrics[0].badge = "Outreach Champion 👑";
    if (employeeMetrics.length > 1) employeeMetrics[1].badge = "Top Closer 🎯";
    if (employeeMetrics.length > 2) employeeMetrics[2].badge = "Rising Star 🚀";

    const topPerformer = employeeMetrics.length > 0 ? employeeMetrics[0] : null;

    return {
      overview: {
        total_emails_sent: totalSent,
        total_emails_received: totalReceived,
        total_followups_sent: totalFollowups,
        total_conversions: totalConversions,
        overall_conversion_rate: totalSent > 0 ? Math.round((totalConversions / totalSent) * 1000) / 10 : 0,
      },
      aliases: aliasMetrics,
      employees: employeeMetrics,
      executive_metrics: executiveMetrics,
      high_performer_day: topPerformer,
      high_performer_month: topPerformer,
    };
  } catch (err) {
    console.error("Error generating email analytics report:", err);
    return {
      overview: {
        total_emails_sent: 0,
        total_emails_received: 0,
        total_followups_sent: 0,
        total_conversions: 0,
        overall_conversion_rate: 0,
      },
      aliases: aliasesList.map((a) => ({
        alias: a,
        total_sent: 0,
        total_received: 0,
        followups_sent: 0,
        converted_clients: 0,
        conversion_rate: 0,
      })),
      employees: [],
      high_performer_day: null,
      high_performer_month: null,
    };
  }
}

function mapDbRowToWorkspaceEmail(r: any): WorkspaceEmailRecord {
  return {
    id: String(r.id),
    message_id: r.message_id || undefined,
    thread_id: r.thread_id || undefined,
    direction: r.direction === "inbound" ? "inbound" : "outbound",
    sender_email: r.sender_email,
    sender_name: r.sender_name || undefined,
    sender_alias: r.sender_alias || "sales@axorks.com",
    recipient_email: r.recipient_email,
    recipient_name: r.recipient_name || undefined,
    to_recipients: Array.isArray(r.to_recipients) ? r.to_recipients : (r.to_recipients ? [r.to_recipients] : [r.recipient_email]),
    cc_recipients: Array.isArray(r.cc_recipients) ? r.cc_recipients : [],
    bcc_recipients: Array.isArray(r.bcc_recipients) ? r.bcc_recipients : [],
    subject: r.subject || "(No Subject)",
    body_html: r.body_html || undefined,
    body_text: r.body_text || undefined,
    snippet: r.snippet || "",
    is_read: Boolean(r.is_read),
    is_starred: Boolean(r.is_starred),
    has_attachments: Boolean(r.has_attachments),
    attachments: Array.isArray(r.attachments) ? r.attachments : [],
    lead_id: r.lead_id ? String(r.lead_id) : undefined,
    sent_by_user_id: r.sent_by_user_id ? String(r.sent_by_user_id) : undefined,
    sent_by_user_name: r.sent_by_user_name || undefined,
    is_followup: Boolean(r.is_followup),
    converted_to_client: Boolean(r.converted_to_client),
    status: r.status || "sent",
    provider: r.provider || "gmail",
    error_message: r.error_message || undefined,
    sent_at: r.sent_at ? new Date(r.sent_at).toISOString() : undefined,
    received_at: r.received_at ? new Date(r.received_at).toISOString() : undefined,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
  };
}


