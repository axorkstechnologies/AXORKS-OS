import { NextRequest, NextResponse } from "next/server";
import { getLeadByIdAsync } from "@/lib/business-repository";
import { sql } from "@/lib/db";
import { authenticateRequest } from "@/lib/server-auth";
import { syncLeadConversionAsync } from "@/lib/performance-repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const dbLead = await getLeadByIdAsync(id);
  if (dbLead) {
    return NextResponse.json({ data: dbLead });
  }

  return NextResponse.json(
    { success: false, error: "Lead not found" },
    { status: 404 }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const authUser = await authenticateRequest(req);
    const body = await req.json();

    const businessName = body.business_name || undefined;
    const website = body.website || undefined;
    const email = body.email || undefined;
    const phone = body.phone || undefined;
    const dmName = body.decision_maker_name || undefined;
    const dmTitle = body.decision_maker_title || undefined;
    const status = body.status || undefined;
    const score = body.score !== undefined ? body.score : undefined;
    const notes = body.notes || undefined;
    const linkedinUrl = body.linkedin_url || undefined;
    const aiResearch = body.ai_research ? JSON.stringify(body.ai_research) : undefined;
    const dealValue = Number(body.deal_value || body.revenue || body.amount || 0);

    const existingLead = await getLeadByIdAsync(id);

    await sql`
      UPDATE leads
      SET
        business_name = COALESCE(${businessName}, business_name),
        website = COALESCE(${website}, website),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        decision_maker_name = COALESCE(${dmName}, decision_maker_name),
        decision_maker_title = COALESCE(${dmTitle}, decision_maker_title),
        status = COALESCE(${status}, status),
        score = COALESCE(${score}, score),
        notes = COALESCE(${notes}, notes),
        linkedin_url = COALESCE(${linkedinUrl}, linkedin_url),
        ai_research = COALESCE(${aiResearch}, ai_research),
        updated_at = NOW()
      WHERE id = ${id};
    `;

    // Real-Time KPI Conversion Tracking:
    // If status transitioned to converted/won, record it in employee_daily_kpis and workspace_emails
    const isNowConverted =
      status === "converted" ||
      status === "won" ||
      status === "closed_won" ||
      body.converted_to_client === true;

    const wasAlreadyConverted =
      existingLead?.status === "converted" ||
      existingLead?.status === "won" ||
      existingLead?.status === "closed_won";

    if (isNowConverted && !wasAlreadyConverted) {
      try {
        const activeUserId =
          authUser?.id ||
          existingLead?.first_contacted_by ||
          "00000000-0000-0000-0000-00000000000a";
        const activeUserName =
          (authUser ? `${authUser.first_name} ${authUser.last_name || ""}`.trim() : null) ||
          existingLead?.first_contacted_by_name ||
          "Axorks Team Member";
        const activeUserEmail = authUser?.email || "sales@axorks.com";

        await syncLeadConversionAsync(activeUserId, activeUserName, activeUserEmail, dealValue);

        // Update workspace_emails to mark related threads converted
        const leadEmail = (email || existingLead?.email || "").toLowerCase().trim();
        if (leadEmail) {
          await sql`
            UPDATE workspace_emails
            SET converted_to_client = TRUE, updated_at = NOW()
            WHERE lead_id::text = ${id} OR LOWER(recipient_email) = ${leadEmail} OR LOWER(sender_email) = ${leadEmail};
          `;
        }
      } catch (kpiErr) {
        console.error("Failed to sync lead conversion to KPIs:", kpiErr);
      }
    }

    const updated = await getLeadByIdAsync(id);
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to update lead" }] },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await sql`
      UPDATE leads
      SET deleted_at = NOW()
      WHERE id = ${id};
    `;

    return NextResponse.json({ data: { message: "Lead deleted successfully" } });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to delete lead" }] },
      { status: 500 }
    );
  }
}
