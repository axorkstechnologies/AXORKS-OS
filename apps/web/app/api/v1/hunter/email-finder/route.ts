import { NextRequest, NextResponse } from "next/server";
import { findEmail } from "@/lib/hunter";

export async function POST(req: NextRequest) {
  try {
    const { domain, first_name, last_name } = await req.json();
    if (!domain || !first_name || !last_name) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }
    const data = await findEmail(domain, first_name, last_name);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
