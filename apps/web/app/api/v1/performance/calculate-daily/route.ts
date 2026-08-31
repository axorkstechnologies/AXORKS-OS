import { NextRequest, NextResponse } from "next/server";
import { recalculateDailyKpiAsync } from "@/lib/performance-repository";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // empty
    }

    await recalculateDailyKpiAsync(body?.date);

    return NextResponse.json({
      success: true,
      message: "Daily performance calculations updated in Neon DB",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate daily metrics" },
      { status: 500 }
    );
  }
}
