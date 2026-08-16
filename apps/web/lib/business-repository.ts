/**
 * Axorks OS — Central Business Repository (Neon PostgreSQL Integration)
 *
 * Provides database-backed CRUD operations for Projects, Leads, CRM Contacts,
 * Invoices, Proposals, and Email Follow-ups.
 */

import { sql } from "@/lib/db";

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
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }));
    }

    // Seed default project into DB if empty
    const seed = await sql`
      INSERT INTO projects (name, client_name, status, budget, spent, deadline, health, description, tech_stack, team_members)
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
        ARRAY['Muhammad Mujahid', 'Farwa', 'Farhana Bakht']
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
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      }));
    }
  } catch (err) {
    console.error("Error fetching projects from Neon DB:", err);
  }
  return [];
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
  source?: string;
  status?: string;
  score?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function getLeadsAsync(): Promise<LeadRecord[]> {
  try {
    const rows = await sql`SELECT * FROM leads WHERE deleted_at IS NULL ORDER BY created_at DESC`;
    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        id: String(r.id),
        business_name: r.business_name || "Prospect Company",
        website: r.website || "",
        industry: r.industry || "Technology",
        country: r.country || "USA",
        decision_maker_name: r.decision_maker_name || "Contact",
        decision_maker_title: r.decision_maker_title || "Director",
        email: r.email || "",
        phone: r.phone || "",
        source: r.source || "manual",
        status: r.status || "new",
        score: Number(r.score || 75),
        notes: r.notes || "",
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      }));
    }

    // Seed default lead if empty
    const seed = await sql`
      INSERT INTO leads (business_name, website, industry, country, decision_maker_name, decision_maker_title, email, phone, source, status, score)
      VALUES (
        'Apex Tech Solutions',
        'https://apextech.example.com',
        'Software',
        'United States',
        'Alex Vance',
        'VP of Engineering',
        'alex.vance@apextech.example.com',
        '+1 (555) 234-5678',
        'cold_email',
        'qualified',
        85
      ) RETURNING *;
    `;
    if (seed && seed.length > 0) {
      return seed.map((r: any) => ({
        id: String(r.id),
        business_name: r.business_name,
        website: r.website,
        industry: r.industry,
        country: r.country,
        decision_maker_name: r.decision_maker_name,
        decision_maker_title: r.decision_maker_title,
        email: r.email,
        phone: r.phone,
        source: r.source,
        status: r.status,
        score: Number(r.score),
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      }));
    }
  } catch (err) {
    console.error("Error fetching leads from Neon DB:", err);
  }
  return [];
}

export async function createLeadAsync(data: Partial<LeadRecord>): Promise<LeadRecord> {
  const businessName = data.business_name?.trim() || "New Lead";
  const website = data.website || "";
  const industry = data.industry || "General";
  const country = data.country || "USA";
  const dmName = data.decision_maker_name || "";
  const dmTitle = data.decision_maker_title || "";
  const email = data.email || "";
  const phone = data.phone || "";
  const source = data.source || "manual";
  const status = data.status || "new";
  const score = data.score || 50;
  const notes = data.notes || "";

  const rows = await sql`
    INSERT INTO leads (business_name, website, industry, country, decision_maker_name, decision_maker_title, email, phone, source, status, score, notes, created_at, updated_at)
    VALUES (${businessName}, ${website}, ${industry}, ${country}, ${dmName}, ${dmTitle}, ${email}, ${phone}, ${source}, ${status}, ${score}, ${notes}, NOW(), NOW())
    RETURNING *;
  `;

  const r = rows[0];
  return {
    id: String(r.id),
    business_name: r.business_name,
    website: r.website,
    industry: r.industry,
    country: r.country,
    decision_maker_name: r.decision_maker_name,
    decision_maker_title: r.decision_maker_title,
    email: r.email,
    phone: r.phone,
    source: r.source,
    status: r.status,
    score: Number(r.score),
    notes: r.notes,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  };
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
  recorded_by_id?: string;
  recording_type: "screen" | "call";
  title: string;
  file_url?: string | null;
  duration_seconds: number;
  created_at: string;
}

export async function getScreenRecordingsAsync(): Promise<ScreenRecordingRecord[]> {
  try {
    const rows = await sql`
      CREATE TABLE IF NOT EXISTS screen_recordings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT,
        recorded_by_id TEXT,
        recording_type TEXT NOT NULL,
        title TEXT NOT NULL,
        file_url TEXT,
        duration_seconds INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      SELECT * FROM screen_recordings ORDER BY created_at DESC;
    `;
    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        id: String(r.id),
        user_id: r.user_id || undefined,
        recorded_by_id: r.recorded_by_id || "user_founder_01",
        recording_type: r.recording_type === "call" ? "call" : "screen",
        title: r.title,
        file_url: r.file_url || null,
        duration_seconds: Number(r.duration_seconds || 0),
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
  file_url?: string | null;
  duration_seconds?: number;
  user_id?: string;
}): Promise<ScreenRecordingRecord> {
  const title = data.title.trim();
  const recordingType = data.recording_type || "screen";
  const fileUrl = data.file_url || null;
  const duration = data.duration_seconds || 0;
  const userId = data.user_id || "00000000-0000-0000-0000-00000000000a";

  const rows = await sql`
    CREATE TABLE IF NOT EXISTS screen_recordings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT,
      recorded_by_id TEXT,
      recording_type TEXT NOT NULL,
      title TEXT NOT NULL,
      file_url TEXT,
      duration_seconds INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    INSERT INTO screen_recordings (user_id, recorded_by_id, recording_type, title, file_url, duration_seconds, created_at)
    VALUES (${userId}, '00000000-0000-0000-0000-00000000000a', ${recordingType}, ${title}, ${fileUrl}, ${duration}, NOW())
    RETURNING *;
  `;

  const r = rows[0];
  return {
    id: String(r.id),
    user_id: r.user_id || undefined,
    recorded_by_id: r.recorded_by_id || "user_founder_01",
    recording_type: r.recording_type === "call" ? "call" : "screen",
    title: r.title,
    file_url: r.file_url || null,
    duration_seconds: Number(r.duration_seconds || 0),
    created_at: new Date(r.created_at).toISOString(),
  };
}

