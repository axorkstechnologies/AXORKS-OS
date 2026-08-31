import { NextResponse } from "next/server";
import { getEmailAnalyticsAsync } from "@/lib/business-repository";

export async function GET() {
  try {
    const report = await getEmailAnalyticsAsync();
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error("Error generating email analytics:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate analytics" },
      { status: 500 }
    );
  }
}
