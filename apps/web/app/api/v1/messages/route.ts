import { NextRequest, NextResponse } from "next/server";
import {
  sendInternalMessageAsync,
  getReceivedMessagesAsync,
  getSentMessagesAsync,
  getPendingApprovalMessagesAsync,
  isFounderUser,
} from "@/lib/messages-repository";
import { authenticateRequest } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized: Valid session required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "inbox";

    let messages: any[] = [];

    if (folder === "pending") {
      if (!isFounderUser(user)) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Access restricted" },
          { status: 403 }
        );
      }
      messages = await getPendingApprovalMessagesAsync();
    } else if (folder === "sent") {
      messages = await getSentMessagesAsync(user.id);
    } else {
      messages = await getReceivedMessagesAsync(user.id);
    }

    return NextResponse.json({
      success: true,
      folder,
      count: messages.length,
      data: messages,
    });
  } catch (error: any) {
    console.error("Error fetching internal messages:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized: Valid session required" }, { status: 401 });
    }

    const body = await req.json();
    const {
      recipient_id,
      recipient_name,
      recipient_role,
      recipient_email,
      subject,
      body: messageBody,
      body_html,
      attachments,
      parent_message_id,
    } = body;

    if (!recipient_id || !messageBody) {
      return NextResponse.json(
        { success: false, error: "recipient_id and body are required" },
        { status: 400 }
      );
    }

    const created = await sendInternalMessageAsync({
      sender_id: user.id,
      sender_name: `${user.first_name} ${user.last_name || ""}`.trim(),
      sender_role: user.role,
      sender_email: user.email,
      recipient_id,
      recipient_name: recipient_name || "Team Member",
      recipient_role: recipient_role,
      recipient_email: recipient_email,
      subject: subject || "Internal Message",
      body: messageBody,
      body_html,
      attachments: attachments || [],
      parent_message_id,
    });

    // Neutral UX notification message — never reveals internal policy details
    let statusNote = "Message delivered successfully";
    if (created.requires_approval && created.approval_status === "pending") {
      statusNote = "Message sent for approval";
    }

    return NextResponse.json({
      success: true,
      message: statusNote,
      data: created,
    });
  } catch (error: any) {
    console.error("Error sending internal message:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
