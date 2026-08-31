/**
 * Axorks OS — Internal Messaging & Communication Repository (Neon PostgreSQL)
 *
 * Implements employee-to-employee messaging, file attachments, and
 * the strict backend-enforced Farhana approval workflow (Founder moderation).
 */

import { sql } from "./db";

export interface InternalMessageAttachment {
  name: string;
  size: number;
  type: string;
  url: string; // Base64 data URL or storage URL
}

export interface InternalMessageRecord {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role?: string;
  recipient_id: string;
  recipient_name: string;
  recipient_role?: string;
  subject: string;
  body: string;
  body_html?: string;
  has_attachments: boolean;
  attachments: InternalMessageAttachment[];
  is_read: boolean;
  requires_approval: boolean;
  approval_status: "none" | "pending" | "approved" | "rejected";
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  parent_message_id?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Identifies if a user is Farhana (Co-Founder) requiring strict Founder approval on all messages.
 */
export function isFarhanaUser(user: { id?: string; email?: string; first_name?: string; role?: string }): boolean {
  const email = (user.email || "").toLowerCase();
  const name = (user.first_name || "").toLowerCase();
  const role = (user.role || "").toLowerCase();
  const id = String(user.id || "").toLowerCase();

  return (
    email === "heyfarii@gmail.com" ||
    email === "farhana.bakht@axorks.com" ||
    name === "farhana" ||
    role === "co-founder" ||
    id === "00000000-0000-0000-0000-00000000000b" ||
    id === "user_cofounder_02"
  );
}

/**
 * Identifies if a user is the Founder (Muhammad Mujahid).
 */
export function isFounderUser(user: { id?: string; email?: string; first_name?: string; role?: string }): boolean {
  const email = (user.email || "").toLowerCase();
  const role = (user.role || "").toLowerCase();
  const name = (user.first_name || "").toLowerCase();
  const id = String(user.id || "").toLowerCase();

  return (
    email === "mujahidaryan222149@gmail.com" ||
    email === "muhammad.mujahid@axorks.com" ||
    role === "founder" ||
    name === "muhammad" ||
    id === "00000000-0000-0000-0000-00000000000a" ||
    id === "user_founder_01"
  );
}

function mapDbRowToMessage(r: any): InternalMessageRecord {
  let parsedAttachments: InternalMessageAttachment[] = [];
  if (r.attachments) {
    if (typeof r.attachments === "string") {
      try {
        parsedAttachments = JSON.parse(r.attachments);
      } catch {}
    } else if (Array.isArray(r.attachments)) {
      parsedAttachments = r.attachments;
    }
  }

  return {
    id: String(r.id),
    sender_id: String(r.sender_id),
    sender_name: r.sender_name,
    sender_role: r.sender_role || undefined,
    recipient_id: String(r.recipient_id),
    recipient_name: r.recipient_name,
    recipient_role: r.recipient_role || undefined,
    subject: r.subject || "(No Subject)",
    body: r.body,
    body_html: r.body_html || `<p>${(r.body || "").replace(/\n/g, "<br/>")}</p>`,
    has_attachments: Boolean(r.has_attachments),
    attachments: parsedAttachments,
    is_read: Boolean(r.is_read),
    requires_approval: Boolean(r.requires_approval),
    approval_status: r.approval_status || "none",
    approved_by: r.approved_by || null,
    approved_at: r.approved_at ? new Date(r.approved_at).toISOString() : null,
    rejection_reason: r.rejection_reason || null,
    parent_message_id: r.parent_message_id ? String(r.parent_message_id) : null,
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

/**
 * Sends an internal message or file attachment.
 * Strictly enforces that if Farhana is either sender OR recipient, the message
 * MUST be set to requires_approval = TRUE and approval_status = 'pending' (unless Founder sent it).
 */
export async function sendInternalMessageAsync(data: {
  sender_id: string;
  sender_name: string;
  sender_role?: string;
  sender_email?: string;
  recipient_id: string;
  recipient_name: string;
  recipient_role?: string;
  recipient_email?: string;
  subject?: string;
  body: string;
  body_html?: string;
  attachments?: InternalMessageAttachment[];
  parent_message_id?: string;
}): Promise<InternalMessageRecord> {
  const isSenderFounder = isFounderUser({
    id: data.sender_id,
    email: data.sender_email,
    first_name: data.sender_name,
    role: data.sender_role,
  });

  const isSenderFarhana = isFarhanaUser({
    id: data.sender_id,
    email: data.sender_email,
    first_name: data.sender_name,
    role: data.sender_role,
  });

  const isRecipientFarhana = isFarhanaUser({
    id: data.recipient_id,
    email: data.recipient_email,
    first_name: data.recipient_name,
    role: data.recipient_role,
  });

  // If Founder himself sent to Farhana, it does not require approval
  // If Farhana sends to anyone -> requires approval
  // If any non-founder sends to Farhana -> requires approval
  // All other employee messages -> instant delivery
  const requiresApproval = isSenderFarhana || (!isSenderFounder && isRecipientFarhana);
  const approvalStatus = requiresApproval ? "pending" : "none";
  const hasAttachments = (data.attachments && data.attachments.length > 0) || false;

  const rows = await sql`
    INSERT INTO internal_messages (
      sender_id, sender_name, sender_role,
      recipient_id, recipient_name, recipient_role,
      subject, body, body_html,
      has_attachments, attachments,
      is_read, requires_approval, approval_status,
      parent_message_id, created_at, updated_at
    ) VALUES (
      ${data.sender_id}, ${data.sender_name}, ${data.sender_role || "Team Member"},
      ${data.recipient_id}, ${data.recipient_name}, ${data.recipient_role || "Team Member"},
      ${data.subject || "Message from " + data.sender_name}, ${data.body},
      ${data.body_html || `<p>${data.body.replace(/\n/g, "<br/>")}</p>`},
      ${hasAttachments}, ${JSON.stringify(data.attachments || [])}::jsonb,
      FALSE, ${requiresApproval}, ${approvalStatus},
      ${data.parent_message_id || null}, NOW(), NOW()
    ) RETURNING *;
  `;

  return mapDbRowToMessage(rows[0]);
}

/**
 * Retrieves the message inbox for a user.
 * Messages sent to the user that require approval are ONLY returned if approval_status = 'approved'.
 */
export async function getReceivedMessagesAsync(userId: string): Promise<InternalMessageRecord[]> {
  const rows = await sql`
    SELECT * FROM internal_messages
    WHERE (recipient_id::text = ${userId} OR recipient_id = ${userId})
      AND (requires_approval = FALSE OR approval_status = 'approved')
    ORDER BY created_at DESC;
  `;
  return rows.map(mapDbRowToMessage);
}

/**
 * Retrieves the sent messages for a user.
 * Users can see their own sent messages along with their approval status.
 */
export async function getSentMessagesAsync(userId: string): Promise<InternalMessageRecord[]> {
  const rows = await sql`
    SELECT * FROM internal_messages
    WHERE sender_id::text = ${userId} OR sender_id = ${userId}
    ORDER BY created_at DESC;
  `;
  return rows.map(mapDbRowToMessage);
}

/**
 * Retrieves messages pending Founder approval (Founder Only).
 */
export async function getPendingApprovalMessagesAsync(): Promise<InternalMessageRecord[]> {
  const rows = await sql`
    SELECT * FROM internal_messages
    WHERE requires_approval = TRUE AND approval_status = 'pending'
    ORDER BY created_at DESC;
  `;
  return rows.map(mapDbRowToMessage);
}

/**
 * Approves a message pending moderation (Founder Only).
 */
export async function approveMessageAsync(messageId: string, founderId: string = "00000000-0000-0000-0000-00000000000a"): Promise<InternalMessageRecord> {
  const rows = await sql`
    UPDATE internal_messages
    SET approval_status = 'approved',
        approved_by = ${founderId},
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id::text = ${messageId}
    RETURNING *;
  `;
  if (rows.length === 0) throw new Error("Message not found");
  return mapDbRowToMessage(rows[0]);
}

/**
 * Rejects a message pending moderation (Founder Only).
 */
export async function rejectMessageAsync(
  messageId: string,
  rejectionReason: string = "Rejected by policy",
  founderId: string = "00000000-0000-0000-0000-00000000000a"
): Promise<InternalMessageRecord> {
  const rows = await sql`
    UPDATE internal_messages
    SET approval_status = 'rejected',
        approved_by = ${founderId},
        rejection_reason = ${rejectionReason},
        updated_at = NOW()
    WHERE id::text = ${messageId}
    RETURNING *;
  `;
  if (rows.length === 0) throw new Error("Message not found");
  return mapDbRowToMessage(rows[0]);
}

/**
 * Marks a message as read by recipient.
 */
export async function markMessageAsReadAsync(messageId: string, userId: string): Promise<boolean> {
  await sql`
    UPDATE internal_messages
    SET is_read = TRUE, updated_at = NOW()
    WHERE id::text = ${messageId} AND (recipient_id::text = ${userId} OR recipient_id = ${userId});
  `;
  return true;
}
