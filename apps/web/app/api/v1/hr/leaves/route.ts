import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const rows = await sql`
      CREATE TABLE IF NOT EXISTS hr_leaves (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id TEXT NOT NULL,
        employee_name TEXT NOT NULL,
        leave_type TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      SELECT * FROM hr_leaves ORDER BY created_at DESC;
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
      CREATE TABLE IF NOT EXISTS hr_leaves (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id TEXT NOT NULL,
        employee_name TEXT NOT NULL,
        leave_type TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      INSERT INTO hr_leaves (employee_id, employee_name, leave_type, start_date, end_date, status, reason, created_at)
      VALUES (${body.employee_id || "EMP-003"}, ${body.employee_name || "Farwa"}, ${body.leave_type || "Annual"}, ${body.start_date || new Date().toISOString().split("T")[0]}, ${body.end_date || new Date().toISOString().split("T")[0]}, 'pending', ${body.reason || "Personal"}, NOW())
      RETURNING *;
    `;
    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to submit leave request" }] },
      { status: 500 }
    );
  }
}
