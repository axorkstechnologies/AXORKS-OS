import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const rows = await sql`
      CREATE TABLE IF NOT EXISTS hr_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_name TEXT NOT NULL,
        reviewer_name TEXT NOT NULL,
        rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
        feedback TEXT,
        review_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      SELECT * FROM hr_reviews ORDER BY created_at DESC;
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
      CREATE TABLE IF NOT EXISTS hr_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_name TEXT NOT NULL,
        reviewer_name TEXT NOT NULL,
        rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
        feedback TEXT,
        review_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      INSERT INTO hr_reviews (employee_name, reviewer_name, rating, feedback, review_date, created_at)
      VALUES (${body.employee_name || "Farwa"}, ${body.reviewer_name || "Muhammad Mujahid (Founder)"}, ${body.rating || 5.0}, ${body.feedback || "Outstanding client outreach performance"}, CURRENT_DATE, NOW())
      RETURNING *;
    `;
    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to submit review" }] },
      { status: 500 }
    );
  }
}
