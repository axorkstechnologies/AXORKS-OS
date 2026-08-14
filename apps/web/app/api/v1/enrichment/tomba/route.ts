import { NextRequest, NextResponse } from "next/server";
import { searchDomainTomba } from "@/lib/enrichment";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain")?.trim();

  if (!domain) {
    return NextResponse.json({ errors: [{ message: "Domain name is required" }] }, { status: 400 });
  }

  const result = await searchDomainTomba(domain);
  return NextResponse.json(result);
}
