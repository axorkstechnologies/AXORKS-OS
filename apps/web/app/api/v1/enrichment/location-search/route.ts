import { NextRequest, NextResponse } from "next/server";
import { searchLocationBusinessDiscovery } from "@/lib/enrichment";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessType = searchParams.get("business_type")?.trim() || searchParams.get("industry")?.trim();
  const location = searchParams.get("location")?.trim() || searchParams.get("area")?.trim();

  if (!businessType || !location) {
    return NextResponse.json(
      { success: false, error: "Both business_type and location are required" },
      { status: 400 }
    );
  }

  const result = await searchLocationBusinessDiscovery(businessType, location);
  return NextResponse.json(result);
}
