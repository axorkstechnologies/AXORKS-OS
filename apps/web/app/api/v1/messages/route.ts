import { NextRequest, NextResponse } from "next/server";
import {
  sendInternalMessageAsync,
  getReceivedMessagesAsync,
  getSentMessagesAsync,
  getPendingApprovalMessagesAsync,
  isFounderUser,
} from "@/lib/messages-repository";
import { findUserByIdAsync } from "@/lib/user-repository";

// Helper to authenticate user from header / cookie / query
async function getAuthUserFromRequest(req: NextRequest) {
  const userId = req.headers.get("x-user-id") || req.nextUrl.searchParams.get("userId");
  if (userId) {
    const user = await findUserByIdAsync(userId);
    if (user && user.status === "active") {
      return user;
    }
  }

  // Fallback to founder if in dev or header present
  const defaultFounder = await findUserByIdAsync("00000000-0000-0000-0000-00000000000a");
  return defaultFounder;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "inbox";

    let messages: any[] = [];

    if (folder === "pending") {
      if (!isFounderUser(user)) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Only Founder can view pending approval queue" },
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
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

    let statusNote = "Message delivered instantly";
    if (created.requires_approval && created.approval_status === "pending") {
      statusNote = "Message submitted and queued for Founder approval (Farhana communication policy)";
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
