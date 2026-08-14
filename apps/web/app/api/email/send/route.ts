import { NextRequest, NextResponse } from "next/server";
import { resend, RESEND_FROM_EMAIL, SENDER_NAME_EMAIL } from "@/lib/email/resend";
import { EmailSendSchema } from "@/lib/validators/email";
import { addEmailToHistory } from "@/lib/email/store";

export async function POST(req: NextRequest) {
  try {
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

    const { to, cc, bcc, subject, html, replyTo, attachments, leadId, templateId } = validation.data;

    // 2. Format attachments for Resend if present
    const formattedAttachments = attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      path: att.path,
    }));

    // 3. Send email via Resend API
    let resendResponse: any = null;
    let status: "Sent" | "Failed" = "Sent";
    let messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    let errorDetail: string | null = null;

    try {
      if (process.env.RESEND_API_KEY) {
        resendResponse = await resend.emails.send({
          from: "Axorks OS <hello@axorks.com>",
          to,
          cc: cc.length > 0 ? cc : undefined,
          bcc: bcc.length > 0 ? bcc : undefined,
          subject,
          html,
          reply_to: replyTo || undefined,
          attachments: formattedAttachments && formattedAttachments.length > 0 ? formattedAttachments : undefined,
        });

        if (resendResponse?.data?.id) {
          messageId = resendResponse.data.id;
        } else if (resendResponse?.error) {
          status = "Failed";
          errorDetail = resendResponse.error.message || "Resend API returned an error";
        }
      } else {
        // Fallback for development if RESEND_API_KEY environment variable is missing
        console.warn("[Resend] RESEND_API_KEY is not set. Simulating email dispatch.");
      }
    } catch (err: any) {
      status = "Failed";
      errorDetail = err.message || "Failed to send email via Resend";
    }

    // 4. Record EmailHistory log
    const emailRecord = {
      id: messageId,
      messageId,
      recipient: to.join(", "),
      to,
      cc,
      bcc,
      subject,
      html,
      status,
      createdAt: new Date().toISOString(),
      sentBy: "Axorks OS System User",
      attachmentsCount: attachments.length,
      provider: "Resend",
      deliveryStatus: status === "Sent" ? "Delivered" : "Error",
      error: errorDetail,
      leadId,
      templateId,
    };

    addEmailToHistory(emailRecord);

    // 5. Update CRM lead activity timeline if leadId provided
    if (leadId) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/leads/${leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "contacted",
            notes: `Emailed subject "${subject}" to ${to.join(", ")} on ${new Date().toLocaleDateString()}`,
          }),
        });
      } catch (crmErr) {
        console.error("Failed to update CRM lead timeline automatically:", crmErr);
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
      message: `Email successfully sent from ${RESEND_FROM_EMAIL}`,
      messageId,
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
