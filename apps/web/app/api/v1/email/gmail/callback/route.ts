import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCodeForTokens, syncGmailInbox } from "@/lib/email/gmail-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const baseUrl = req.nextUrl.origin || "http://localhost:3000";

  if (error) {
    console.error("Google OAuth returned error in callback:", error);
    return NextResponse.redirect(`${baseUrl}/email?oauth=error&message=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/email?oauth=error&message=No+authorization+code+received`);
  }

  try {
    const tokenInfo = await exchangeGoogleCodeForTokens(code);
    console.log(`[Google OAuth] Successfully connected Google Workspace account: ${tokenInfo.email}`);

    // Trigger initial inbox sync in the background
    syncGmailInbox({ maxResults: 20 }).catch((syncErr) => {
      console.warn("Initial inbox sync error:", syncErr.message);
    });

    return NextResponse.redirect(`${baseUrl}/email?oauth=success&account=${encodeURIComponent(tokenInfo.email)}`);
  } catch (err: any) {
    console.error("Failed to complete Google OAuth exchange:", err);
    return NextResponse.redirect(
      `${baseUrl}/email?oauth=error&message=${encodeURIComponent(err.message || "OAuth exchange failed")}`
    );
  }
}
