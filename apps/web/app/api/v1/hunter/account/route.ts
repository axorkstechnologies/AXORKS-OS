import { NextRequest, NextResponse } from "next/server";
import { getAccountInfo } from "@/lib/hunter";

export async function GET(req: NextRequest) {
  try {
    const data = await getAccountInfo();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
