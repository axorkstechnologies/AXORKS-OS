import { NextRequest, NextResponse } from "next/server";
import { verifyEmailAddressAsync, verifyEmailBatchAsync } from "@/lib/email-verifier";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Single email verification
    if (body.email && typeof body.email === "string") {
      const result = await verifyEmailAddressAsync(body.email);

      // If leadId is provided, persist the verification status into the database
      if (body.leadId) {
        try {
          await sql`
            UPDATE leads
            SET verification_status = ${result.status},
                verification_score = ${result.score},
                is_verified = ${result.status === "verified"},
                mx_valid = ${result.mx_records_found},
                verification_notes = ${result.reason},
                updated_at = NOW()
            WHERE id::text = ${String(body.leadId)};
          `;
        } catch (dbErr) {
          console.error("Failed to update lead verification in DB:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Batch emails verification
    if (Array.isArray(body.emails) && body.emails.length > 0) {
      const resultMap = await verifyEmailBatchAsync(body.emails);
      const resultsArray = Array.from(resultMap.values());

      return NextResponse.json({
        success: true,
        total: resultsArray.length,
        verified_count: resultsArray.filter((r) => r.status === "verified").length,
        invalid_count: resultsArray.filter((r) => r.status === "invalid").length,
        data: resultsArray,
      });
    }

    // Batch leads verification (updates DB for each lead)
    if (Array.isArray(body.leads) && body.leads.length > 0) {
      const emailList = body.leads.map((l: any) => l.email).filter(Boolean);
      const resultMap = await verifyEmailBatchAsync(emailList);

      const updatedLeads: any[] = [];
      for (const lead of body.leads) {
        if (!lead.email) continue;
        const verification = resultMap.get(lead.email.toLowerCase().trim());
        if (verification) {
          const isVerified = verification.status === "verified";
          try {
            await sql`
              UPDATE leads
              SET verification_status = ${verification.status},
                  verification_score = ${verification.score},
                  is_verified = ${isVerified},
                  mx_valid = ${verification.mx_records_found},
                  verification_notes = ${verification.reason},
                  updated_at = NOW()
              WHERE id::text = ${String(lead.id)};
            `;
          } catch (e) {}

          updatedLeads.push({
            ...lead,
            verification_status: verification.status,
            verification_score: verification.score,
            is_verified: isVerified,
            mx_valid: verification.mx_records_found,
            verification_notes: verification.reason,
          });
        }
      }

      return NextResponse.json({
        success: true,
        total: updatedLeads.length,
        verified_count: updatedLeads.filter((l) => l.is_verified).length,
        data: updatedLeads,
      });
    }

    return NextResponse.json(
      { success: false, error: "Please provide an 'email', 'emails' array, or 'leads' array." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error in /api/v1/email/verify route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify email" },
      { status: 500 }
    );
  }
}
