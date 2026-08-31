import { NextResponse } from "next/server";
import { getGoogleWorkspaceStatus, getGoogleOAuthRedirectUri } from "@/lib/email/gmail-service";

export async function GET() {
  try {
    const status = await getGoogleWorkspaceStatus();
    const redirectUri = getGoogleOAuthRedirectUri();

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        redirectUri,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving Google Workspace status:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve status" },
      { status: 500 }
    );
  }
}
