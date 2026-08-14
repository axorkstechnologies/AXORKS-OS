import { NextRequest, NextResponse } from "next/server";
import { findEmailProspeo } from "@/lib/enrichment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain, first_name, last_name } = body;

    if (!domain) {
      return NextResponse.json({ errors: [{ message: "Domain is required" }] }, { status: 400 });
    }

    const result = await findEmailProspeo(domain, first_name, last_name);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ errors: [{ message: error.message || "Prospeo search error" }] }, { status: 500 });
  }
}
