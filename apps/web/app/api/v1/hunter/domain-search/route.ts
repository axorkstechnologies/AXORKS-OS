import { NextRequest, NextResponse } from "next/server";
import { searchDomain } from "@/lib/hunter";

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();
    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }
    const data = await searchDomain(domain);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === "HUNTER_API_KEY not configured") {
      return NextResponse.json({ error: "HUNTER_API_KEY not configured" }, { status: 500 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
