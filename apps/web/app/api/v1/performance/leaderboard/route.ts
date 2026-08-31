import { NextRequest, NextResponse } from "next/server";
import { getPerformanceLeaderboardAsync } from "@/lib/performance-repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "daily") as "daily" | "monthly" | "all";

    const data = await getPerformanceLeaderboardAsync(period);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching performance leaderboard:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
