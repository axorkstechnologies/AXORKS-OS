import { NextRequest, NextResponse } from "next/server";
import { researchLeadsWithGemini, LeadToResearch } from "@/lib/gemini-lead-research";
import { updateLeadResearchAsync } from "@/lib/business-repository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const leads: LeadToResearch[] = body.leads;
    const saveToDb: boolean = Boolean(body.save_to_db);

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide an array of leads to research.", errors: [{ message: "Please provide an array of leads to research." }] },
        { status: 400 }
      );
    }

    // Run Gemini deep research
    const results = await researchLeadsWithGemini(leads);

    // If persistence requested and leads have valid IDs, update in Neon DB
    if (saveToDb) {
      for (const res of results) {
        if (res.lead_id && !res.lead_id.startsWith("lead-") && !res.lead_id.startsWith("temp-")) {
          await updateLeadResearchAsync(res.lead_id, res);
        }
      }
    }

    const verifiedRealCount = results.filter((r) => r.verification_status === "verified_real").length;
    const suspiciousCount = results.filter((r) => r.verification_status === "suspicious_bogus").length;

    return NextResponse.json({
      success: true,
      total_researched: results.length,
      verified_real_count: verifiedRealCount,
      suspicious_count: suspiciousCount,
      data: results,
    });
  } catch (error: any) {
    console.error("Bulk lead research API error:", error);
    const errorMessage = error.message || "Failed to research leads with Gemini AI";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errors: [{ message: errorMessage }],
        detail: errorMessage,
      },
      { status: 500 }
    );
  }
}
