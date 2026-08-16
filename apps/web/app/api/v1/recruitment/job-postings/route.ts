import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const rows = await sql`
      CREATE TABLE IF NOT EXISTS job_postings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        location TEXT NOT NULL DEFAULT 'Remote',
        type TEXT NOT NULL DEFAULT 'Full-time',
        status TEXT NOT NULL DEFAULT 'active',
        applicants_count INT DEFAULT 0,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      SELECT * FROM job_postings ORDER BY created_at DESC;
    `;

    if (rows && rows.length > 0) {
      return NextResponse.json({ data: rows });
    }

    const seed = await sql`
      INSERT INTO job_postings (title, department, location, type, status, applicants_count, description)
      VALUES 
      ('Senior Full Stack Engineer (Next.js/TypeScript)', 'Engineering', 'Remote / London', 'Full-time', 'active', 14, 'Lead architecture on high-performance enterprise applications'),
      ('Marketing & Growth Lead', 'Marketing', 'Remote / USA', 'Full-time', 'active', 8, 'Drive organic lead generation and agency outbound campaigns')
      RETURNING *;
    `;
    return NextResponse.json({ data: seed });
  } catch (error: any) {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows = await sql`
      CREATE TABLE IF NOT EXISTS job_postings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        location TEXT NOT NULL DEFAULT 'Remote',
        type TEXT NOT NULL DEFAULT 'Full-time',
        status TEXT NOT NULL DEFAULT 'active',
        applicants_count INT DEFAULT 0,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      INSERT INTO job_postings (title, department, location, type, status, applicants_count, description, created_at)
      VALUES (${body.title}, ${body.department || "Engineering"}, ${body.location || "Remote"}, ${body.type || "Full-time"}, 'active', 0, ${body.description || ""}, NOW())
      RETURNING *;
    `;
    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to create job posting" }] },
      { status: 500 }
    );
  }
}
