import { z } from "zod";

export const AttachmentSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  content: z.string().optional(), // base64 string or URL
  path: z.string().optional(),
  contentType: z.string().optional(),
  size: z.number().max(25 * 1024 * 1024, "Attachment cannot exceed 25 MB").optional(),
});

export const EmailSendSchema = z.object({
  to: z.array(z.string().email("Invalid email address")).min(1, "At least one recipient is required"),
  cc: z.array(z.string().email("Invalid CC email address")).optional().default([]),
  bcc: z.array(z.string().email("Invalid BCC email address")).optional().default([]),
  subject: z.string().min(1, "Subject is required").max(500, "Subject is too long"),
  html: z.string().min(1, "Email body cannot be empty"),
  text: z.string().optional(),
  senderAlias: z.string().optional().default("sales@axorks.com"),
  senderName: z.string().optional().default("Axorks Technologies"),
  replyTo: z.string().email("Invalid reply-to email").optional(),
  threadId: z.string().optional(),
  inReplyTo: z.string().optional(),
  references: z.string().optional(),
  attachments: z.array(AttachmentSchema).optional().default([]),
  leadId: z.string().optional(),
  templateId: z.string().optional(),
  sentByUserId: z.string().optional(),
  sentByUserName: z.string().optional(),
  isFollowup: z.boolean().optional().default(false),
});

export type EmailSendInput = z.infer<typeof EmailSendSchema>;
export type AttachmentInput = z.infer<typeof AttachmentSchema>;

export const AIGenerateEmailSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  industry: z.string().optional().default("Software & IT"),
  decisionMaker: z.string().optional(),
  painPoints: z.string().optional(),
  interestedService: z.string().optional().default("Full-stack Software Development"),
  country: z.string().optional(),
  previousCommunication: z.string().optional(),
});

export type AIGenerateEmailInput = z.infer<typeof AIGenerateEmailSchema>;
