import { NextRequest, NextResponse } from "next/server";
import { sql, DATABASE_URL } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const statusFilter = searchParams.get("status")?.toLowerCase() || "";

    if (!DATABASE_URL) {
      return NextResponse.json({ success: true, data: [], analytics: { sentToday: 0, thisWeek: 0, thisMonth: 0, totalSent: 0, failedEmails: 0 } });
    }

    const rows = await sql`
      SELECT 
        id,
        message_id,
        thread_id,
        direction,
        sender_email,
        sender_name,
        sender_alias,
        recipient_email,
        recipient_name,
        subject,
        body_html,
        body_text,
        snippet,
        status,
        provider,
        error_message,
        sent_by_user_id,
        sent_by_user_name,
        is_followup,
        converted_to_client,
        sent_at,
        created_at
      FROM workspace_emails
      WHERE direction = 'outbound'
      ORDER BY created_at DESC, sent_at DESC
      LIMIT 200;
    `;

    let mapped = rows.map((r: any) => {
      const isSent = (r.status || "").toLowerCase() === "sent";
      const isFailed = (r.status || "").toLowerCase() === "failed";
      const status = isSent ? "Sent" : isFailed ? "Failed" : "Sent";
      const deliveryStatus = isSent ? "Delivered" : "Error";

      let providerLabel = "Internal";
      if (r.provider === "gmail") providerLabel = "Gmail API";
      else if (r.provider === "resend") providerLabel = "Resend";

      return {
        id: String(r.id || r.message_id),
        messageId: r.message_id || String(r.id),
        threadId: r.thread_id,
        recipient: r.recipient_email || "Recipient",
        subject: r.subject || "(No Subject)",
        status,
        provider: providerLabel,
        deliveryStatus,
        sentBy: r.sent_by_user_name || r.sender_name || "Team Member",
        senderAlias: r.sender_alias || r.sender_email || "sales@axorks.com",
        createdAt: r.sent_at || r.created_at || new Date().toISOString(),
        error: r.error_message || undefined,
        isFollowup: Boolean(r.is_followup),
        convertedToClient: Boolean(r.converted_to_client),
      };
    });

    if (search) {
      mapped = mapped.filter(
        (item) =>
          item.recipient.toLowerCase().includes(search) ||
          item.subject.toLowerCase().includes(search) ||
          item.sentBy.toLowerCase().includes(search) ||
          item.senderAlias.toLowerCase().includes(search)
      );
    }

    if (statusFilter) {
      mapped = mapped.filter(
        (item) => item.status.toLowerCase() === statusFilter
      );
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const sentToday = mapped.filter((e) => e.createdAt && e.createdAt.startsWith(todayStr)).length;
    const totalSent = mapped.filter((e) => e.status === "Sent").length;
    const totalFailed = mapped.filter((e) => e.status === "Failed").length;

    // Contact groupings
    const contactMap: Record<string, number> = {};
    mapped.forEach((m) => {
      if (m.recipient) {
        contactMap[m.recipient] = (contactMap[m.recipient] || 0) + 1;
      }
    });

    const topContacts = Object.entries(contactMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([email, count]) => ({ email, count }));

    return NextResponse.json({
      success: true,
      data: mapped,
      analytics: {
        sentToday,
        thisWeek: mapped.length,
        thisMonth: mapped.length,
        bounceRate: "0.0%",
        failedEmails: totalFailed,
        totalSent,
        topContacts,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving email history from Neon DB:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load email history" },
      { status: 500 }
    );
  }
}
