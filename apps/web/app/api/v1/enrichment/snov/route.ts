import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.SNOV_API_KEY;
  const apiSecret = process.env.SNOV_API_SECRET;
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain")?.trim();

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ success: false, error: "SNOV_API_KEY / SNOV_API_SECRET not configured" }, { status: 500 });
  }

  if (!domain) {
    return NextResponse.json({ success: false, error: "Domain parameter is required" }, { status: 400 });
  }

  try {
    // 1. Obtain Access Token from Snov.io OAuth endpoint
    const tokenRes = await fetch("https://api.snov.io/v1/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: apiKey,
        client_secret: apiSecret,
      }),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      return NextResponse.json({ success: false, error: tokenJson.message || "Failed to authenticate with Snov.io API" }, { status: 400 });
    }

    const accessToken = tokenJson.access_token;

    // 2. Fetch Domain Emails
    const domainRes = await fetch(`https://api.snov.io/v2/domain-emails-with-info?domain=${encodeURIComponent(domain)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const domainJson = await domainRes.json();
    const emails = domainJson.emails?.map((e: any) => ({
      email: e.email,
      first_name: e.firstName,
      last_name: e.lastName,
      position: e.position,
      status: e.status,
    })) || [];

    return NextResponse.json({
      success: true,
      provider: "Snov.io",
      domain,
      emails,
      total: emails.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
