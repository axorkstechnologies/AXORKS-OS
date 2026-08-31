import { NextRequest, NextResponse } from "next/server";
import { generateGoogleAuthUrl, getGoogleOAuthRedirectUri } from "@/lib/email/gmail-service";

export async function GET(req: NextRequest) {
  try {
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
