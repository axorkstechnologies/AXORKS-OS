/**
 * Axorks OS — Email Constants & Shared Types (Client & Server Safe)
 */

export const PRIMARY_WORKSPACE_EMAIL = "muhammad.mujahid@axorks.com";

export const WORKSPACE_ALIASES = [
  "sales@axorks.com",
  "contact@axorks.com",
  "hello@axorks.com",
  "careers@axorks.com",
  "muhammad.mujahid@axorks.com",
] as const;

export type WorkspaceAlias = (typeof WORKSPACE_ALIASES)[number];

export interface WorkspaceEmailRecord {
  id: string;
  message_id?: string;
  thread_id?: string;
  direction: "inbound" | "outbound";
  sender_email: string;
  sender_name?: string;
  sender_alias?: string;
  recipient_email: string;
  recipient_name?: string;
  to_recipients: string[];
  cc_recipients: string[];
  bcc_recipients: string[];
  subject: string;
  body_html?: string;
  body_text?: string;
  snippet?: string;
  is_read: boolean;
  is_starred: boolean;
  has_attachments: boolean;
  attachments?: any[];
  lead_id?: string;
  sent_by_user_id?: string;
  sent_by_user_name?: string;
  is_followup: boolean;
  converted_to_client: boolean;
  status: "sent" | "delivered" | "failed" | "received" | "draft";
  provider: "gmail" | "resend";
  error_message?: string;
  sent_at?: string;
  received_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AliasMetric {
  alias: string;
  total_sent: number;
  total_received: number;
  followups_sent: number;
  converted_clients: number;
  conversion_rate: number;
}

export interface EmployeeEmailMetric {
  user_id: string;
  user_name: string;
  role: string;
  avatar_url?: string;
  total_sent: number;
  followups_sent: number;
  converted_clients: number;
  conversion_rate: number;
  score: number;
  badge?: string;
}

export interface EmailAnalyticsReport {
  overview: {
    total_emails_sent: number;
    total_emails_received: number;
    total_followups_sent: number;
    total_conversions: number;
    overall_conversion_rate: number;
  };
  aliases: AliasMetric[];
  employees: EmployeeEmailMetric[];
  high_performer_day: EmployeeEmailMetric | null;
  high_performer_month: EmployeeEmailMetric | null;
}
