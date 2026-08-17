import { NextRequest, NextResponse } from "next/server";
import { researchLeadsWithGemini } from "@/lib/gemini-lead-research";
import { getLeadByIdAsync, updateLeadResearchAsync } from "@/lib/business-repository";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let leadData = await req.json().catch(() => null);

    if (!leadData || !leadData.business_name) {
      const dbLead = await getLeadByIdAsync(id);
      if (!dbLead) {
        return NextResponse.json(
          { success: false, error: "Lead not found" },
          { status: 404 }
        );
      }
      leadData = dbLead;
    }

    const results = await researchLeadsWithGemini([
      {
        id: id,
        lead_id: id,
        business_name: leadData.business_name,
        website: leadData.website,
        industry: leadData.industry,
        country: leadData.country,
        decision_maker_name: leadData.decision_maker_name,
        decision_maker_title: leadData.decision_maker_title,
        email: leadData.email,
        phone: leadData.phone,
        source: leadData.source,
      },
    ]);

    const result = results[0];
    if (result) {
      await updateLeadResearchAsync(id, result);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Single lead research API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to research lead" },
      { status: 500 }
    );
  }
}
