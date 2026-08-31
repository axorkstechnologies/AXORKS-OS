import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceEmailsAsync } from "@/lib/business-repository";
import { syncGmailInbox, getGoogleWorkspaceStatus } from "@/lib/email/gmail-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const alias = searchParams.get("alias") || undefined;
    const direction = (searchParams.get("direction") as any) || "inbound";
    const search = searchParams.get("search") || undefined;
    const isReadParam = searchParams.get("is_read");
    const isRead = isReadParam !== null ? isReadParam === "true" : undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const emails = await getWorkspaceEmailsAsync({
      alias: alias && alias !== "all" ? alias : undefined,
      direction,
      search,
      is_read: isRead,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      total: emails.length,
      data: emails,
    });
  } catch (error: any) {
    console.error("Error retrieving workspace inbox emails:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load inbox emails" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const status = await getGoogleWorkspaceStatus();

    if (!status.connected) {
      return NextResponse.json({
        success: false,
        message: "Google Workspace account is not connected yet. Please authorize via Google OAuth first.",
        connected: false,
      });
    }

    const syncResult = await syncGmailInbox({ maxResults: 30 });

    return NextResponse.json({
      success: true,
      message: `Gmail Inbox synced: ${syncResult.newMessages} new messages fetched.`,
      data: syncResult,
    });
  } catch (error: any) {
    console.error("Error syncing Gmail inbox:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync Gmail inbox" },
      { status: 500 }
    );
  }
}
