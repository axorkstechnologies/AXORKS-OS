import { NextRequest, NextResponse } from "next/server";
import { generateGoogleAuthUrl, getGoogleOAuthRedirectUri } from "@/lib/email/gmail-service";
import { authenticateRequest } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const isFounder = Boolean(
      user.role === "Founder" ||
        user.email === "mujahidaryan222149@gmail.com" ||
        user.email === "muhammad.mujahid@axorks.com"
    );

    if (!isFounder) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only the Founder can authorize Google Workspace connection.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const redirectMode = searchParams.get("redirect") === "true";
    const authUrl = generateGoogleAuthUrl();
    const redirectUri = getGoogleOAuthRedirectUri();

    if (redirectMode) {
      return NextResponse.redirect(authUrl);
    }

    return NextResponse.json({
      success: true,
      authUrl,
      redirectUri,
      scope: "https://www.googleapis.com/auth/gmail.modify",
      data: {
        authUrl,
        redirectUri,
        scope: "https://www.googleapis.com/auth/gmail.modify",
      },
    });
  } catch (error: any) {
    console.error("Error generating Google Auth URL:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate Google Auth URL",
        errorDetails: String(error?.stack || error),
        data: null,
      },
      { status: 500 }
    );
  }
}
