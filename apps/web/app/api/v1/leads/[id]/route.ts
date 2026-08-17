import { NextRequest, NextResponse } from "next/server";
import { getLeadByIdAsync } from "@/lib/business-repository";
import { sql } from "@/lib/db";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const authHeader = req.headers.get("authorization");
    const backendRes = await fetch(`${API_BASE_URL}/api/v1/leads/${id}`, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data?.data) return NextResponse.json(data);
    }
  } catch (err) {
    // Backend unreachable, fallback to Neon DB
  }

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
    const body = await req.json();

    try {
      const authHeader = req.headers.get("authorization");
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/leads/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch (err) {
      // Backend unreachable, fallback to Neon DB
    }

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
    try {
      const authHeader = req.headers.get("authorization");
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/leads/${id}`, {
        method: "DELETE",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      });

      if (backendRes.ok) {
        return NextResponse.json({ data: { message: "Lead deleted" } });
      }
    } catch (err) {
      // Backend unreachable, fallback to Neon DB
    }

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
