import { NextRequest, NextResponse } from "next/server";
import { findDomainEmailsUnified } from "@/lib/enrichment";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain")?.trim();

  if (!domain) {
    return NextResponse.json(
      { errors: [{ message: "Please provide a valid domain name (e.g. apextech.example.com)" }] },
      { status: 400 }
    );
  }

  try {
    const result = await findDomainEmailsUnified(domain);
    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to search domain emails" }] },
      { status: 500 }
    );
  }
}
