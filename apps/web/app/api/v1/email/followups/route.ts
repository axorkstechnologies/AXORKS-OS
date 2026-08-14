import { NextRequest, NextResponse } from "next/server";
import {
  getEmailFollowupsAsync,
  createEmailFollowupAsync,
  updateEmailFollowupAsync,
} from "@/lib/business-repository";

export async function GET(req: NextRequest) {
  const followups = await getEmailFollowupsAsync();
  return NextResponse.json({ data: followups });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newRecord = await createEmailFollowupAsync({
      lead_id: body.lead_id,
      recipient_email: body.recipient_email || body.email,
      recipient_name: body.recipient_name || body.name,
      subject: body.subject || "Follow-up",
      body: body.body || "",
      status: body.status || "followup_needed",
      attempts: body.attempts || 1,
      next_followup_date: body.next_followup_date,
      notes: body.notes || "",
    });
    return NextResponse.json({ data: newRecord });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to create email followup" }] },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, attempts } = body;

    if (!id) {
      return NextResponse.json(
        { errors: [{ message: "Followup ID is required" }] },
        { status: 400 }
      );
    }

    const updated = await updateEmailFollowupAsync(id, { status, attempts });
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to update email followup" }] },
      { status: 500 }
    );
  }
}
