import { NextRequest, NextResponse } from "next/server";
import { getKnowledgePagesAsync } from "@/lib/knowledge-repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const pages = await getKnowledgePagesAsync({ search: q });
    return NextResponse.json({ success: true, data: pages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
