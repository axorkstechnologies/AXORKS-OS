import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const rows = await sql`
      CREATE TABLE IF NOT EXISTS job_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id TEXT,
        applicant_name TEXT NOT NULL,
        applicant_email TEXT NOT NULL,
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        resume_url TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      SELECT * FROM job_applications ORDER BY created_at DESC;
    `;
    return NextResponse.json({ data: rows || [] });
  } catch (error: any) {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows = await sql`
      CREATE TABLE IF NOT EXISTS job_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id TEXT,
        applicant_name TEXT NOT NULL,
        applicant_email TEXT NOT NULL,
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        resume_url TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      INSERT INTO job_applications (job_id, applicant_name, applicant_email, phone, status, resume_url, notes, created_at)
      VALUES (${body.job_id || null}, ${body.applicant_name}, ${body.applicant_email}, ${body.phone || null}, 'new', ${body.resume_url || null}, ${body.notes || null}, NOW())
      RETURNING *;
    `;
    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to submit job application" }] },
      { status: 500 }
    );
  }
}
