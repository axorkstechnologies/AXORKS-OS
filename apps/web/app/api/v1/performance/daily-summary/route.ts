import { NextRequest, NextResponse } from "next/server";
import { getDailyKpiLogsAsync } from "@/lib/performance-repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;

    const data = await getDailyKpiLogsAsync(userId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching daily KPI logs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch daily logs" },
      { status: 500 }
    );
  }
}
