import { NextRequest, NextResponse } from "next/server";
import { resend, RESEND_FROM_EMAIL } from "@/lib/email/resend";
import { EmailSendSchema } from "@/lib/validators/email";
import { addEmailToHistory } from "@/lib/email/store";
import { sendGmailMessage, getGoogleWorkspaceStatus } from "@/lib/email/gmail-service";
import { authenticateRequest } from "@/lib/server-auth";
import { syncEmailKpiAsync } from "@/lib/performance-repository";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL || "";
const sql = neon(DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/db");

export async function POST(req: NextRequest) {
  try {
    const authUser = await authenticateRequest(req);
    const body = await req.json();

    // 1. Validate payload with Zod
    const validation = EmailSendSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      to,
      cc,
      bcc,
      subject,
      html,
      text,
      senderAlias = "sales@axorks.com",
      senderName = "Axorks Technologies",
      replyTo,
      threadId,
      inReplyTo,
      references,
      attachments,
      leadId,
      templateId,
      sentByUserId,
      sentByUserName,
      isFollowup = false,
    } = validation.data;

    const activeUserId = authUser?.id || sentByUserId || "00000000-0000-0000-0000-00000000000a";
    const activeUserName = authUser
      ? `${authUser.first_name} ${authUser.last_name || ""}`.trim()
      : sentByUserName || "Axorks Team Member";

    let status: "Sent" | "Failed" = "Sent";
    let messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    let activeThreadId = threadId || messageId;
    let provider: "Gmail API" | "Resend" | "Internal" = "Internal";
    let errorDetail: string | null = null;

    // 2. Check if Google Workspace is connected via Gmail API
    const googleStatus = await getGoogleWorkspaceStatus();

    if (googleStatus.connected) {
      try {
        const gmailResult = await sendGmailMessage({
          to,
          cc,
          bcc,
          subject,
          html,
          text,
          senderAlias,
          senderName,
          replyTo: replyTo || senderAlias,
          threadId,
          inReplyTo,
          references,
          attachments,
          sentByUserId: activeUserId,
          sentByUserName: activeUserName,
          leadId,
          isFollowup,
        });

        messageId = gmailResult.messageId;
        activeThreadId = gmailResult.threadId;
        provider = "Gmail API";
      } catch (gmailErr: any) {
        console.warn("[Gmail API] Dispatch failed, falling back to Resend:", gmailErr.message);
        // Fallback to Resend below if Gmail encounters temporary issue
      }
    }

    // 3. Fallback to Resend API if Gmail API was not used or failed
    if (provider !== "Gmail API") {
      try {
        if (process.env.RESEND_API_KEY) {
          const formattedAttachments = attachments?.map((att) => ({
            filename: att.filename,
            content: att.content,
            path: att.path,
          }));

          const resendResponse = await resend.emails.send({
            from: `${senderName} <${senderAlias || RESEND_FROM_EMAIL}>`,
            to,
            cc: cc.length > 0 ? cc : undefined,
            bcc: bcc.length > 0 ? bcc : undefined,
            subject,
            html,
            reply_to: replyTo || senderAlias || undefined,
            attachments: formattedAttachments && formattedAttachments.length > 0 ? formattedAttachments : undefined,
          });

          if (resendResponse?.data?.id) {
            messageId = resendResponse.data.id;
            provider = "Resend";
          } else if (resendResponse?.error) {
            status = "Failed";
            errorDetail = resendResponse.error.message || "Resend API returned an error";
          }
        } else {
          provider = "Internal";
        }
      } catch (resendErr: any) {
        status = "Failed";
        errorDetail = resendErr.message || "Failed to send email via Resend";
      }

      // Record in Neon DB for Resend / Internal dispatch
      if (DATABASE_URL) {
        try {
          await sql`
            INSERT INTO workspace_emails (
              message_id, thread_id, direction, sender_email, sender_name, sender_alias,
              recipient_email, recipient_name, to_recipients, cc_recipients, bcc_recipients,
              subject, body_html, body_text, snippet, is_read, has_attachments,
              lead_id, sent_by_user_id, sent_by_user_name, is_followup, status, provider,
              sent_at, created_at, updated_at
            ) VALUES (
              ${messageId}, ${activeThreadId}, 'outbound', ${senderAlias}, ${senderName}, ${senderAlias},
              ${to[0] || ""}, ${to[0] || ""}, ${JSON.stringify(to)}::jsonb,
              ${JSON.stringify(cc || [])}::jsonb, ${JSON.stringify(bcc || [])}::jsonb,
              ${subject}, ${html || ""}, ${text || ""},
              ${(text || html || "").substring(0, 160).replace(/<[^>]*>/g, "")},
              TRUE, ${(attachments?.length || 0) > 0},
              ${leadId || null}, ${activeUserId}, ${activeUserName},
              ${Boolean(isFollowup)}, ${status === "Sent" ? "sent" : "failed"}, ${provider === "Resend" ? "resend" : "gmail"},
              NOW(), NOW(), NOW()
            )
            ON CONFLICT (message_id) DO NOTHING;
          `;
        } catch (dbErr) {
          console.error("Failed to save email to Neon DB:", dbErr);
        }
      }
    }

    // 4. Record in EmailHistory store
    const emailRecord = {
      id: messageId,
      messageId,
      threadId: activeThreadId,
      recipient: to.join(", "),
      to,
      cc,
      bcc,
      senderAlias,
      subject,
      html,
      status,
      createdAt: new Date().toISOString(),
      sentBy: activeUserName,
      attachmentsCount: attachments.length,
      provider,
      deliveryStatus: status === "Sent" ? "Delivered" : "Error",
      error: errorDetail,
      leadId,
      templateId,
      isFollowup,
    };

    addEmailToHistory(emailRecord);

    // 5. Update CRM Lead Exclusivity: Mark lead contacted by active employee
    if (status === "Sent" && DATABASE_URL) {
      try {
        const toEmail = to[0] ? to[0].toLowerCase().trim() : "";
        await sql`
          UPDATE leads
          SET status = CASE WHEN status = 'new' THEN 'contacted' ELSE status END,
              first_contacted_by = COALESCE(first_contacted_by, ${activeUserId}),
              first_contacted_by_name = COALESCE(first_contacted_by_name, ${activeUserName}),
              contacted_at = COALESCE(contacted_at, NOW()),
              notes = COALESCE(notes || E'\n', '') || ${`[${new Date().toLocaleDateString()}] Emailed from ${senderAlias} by ${activeUserName} with subject "${subject}"`},
              updated_at = NOW()
          WHERE (id::text = ${leadId || null} OR LOWER(email) = ${toEmail})
            AND (first_contacted_by IS NULL OR first_contacted_by = ${activeUserId});
        `;
      } catch (crmErr) {
        console.error("Failed to update CRM lead exclusivity in DB:", crmErr);
      }
    }

    // 6. REAL-TIME KPI: Increment emails_sent (and followups_sent) in employee_daily_kpis
    if (status === "Sent") {
      try {
        const senderEmail = authUser?.email || "unknown@axorks.com";
        await syncEmailKpiAsync(activeUserId, activeUserName, senderEmail, Boolean(isFollowup));
      } catch (kpiErr) {
        console.error("Failed to sync email KPI in employee_daily_kpis:", kpiErr);
      }
    }

    if (status === "Failed") {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to dispatch email",
          error: errorDetail,
          record: emailRecord,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email successfully sent from ${senderAlias} via ${provider}`,
      messageId,
      threadId: activeThreadId,
      data: emailRecord,
    });
  } catch (error: any) {
    console.error("Error in /api/email/send route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error while sending email",
      },
      { status: 500 }
    );
  }
}
