import { NextRequest, NextResponse } from "next/server";
import { getCRMContactsAsync, createCRMContactAsync } from "@/lib/business-repository";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  try {
    const authHeader = req.headers.get("authorization");
    const backendRes = await fetch(`${API_BASE_URL}/api/v1/crm/contacts?${searchParams.toString()}`, {
      headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch {
    // Fallback directly to Neon DB
  }

  const contacts = await getCRMContactsAsync();
  return NextResponse.json({
    data: contacts,
    items: contacts,
    total: contacts.length,
    page: 1,
    per_page: 100,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    try {
      const authHeader = req.headers.get("authorization");
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/crm/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data?.data) return NextResponse.json(data);
      }
    } catch {
      // Fallback directly to Neon DB
    }

    const newContact = await createCRMContactAsync(body);

    return NextResponse.json({ data: newContact });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to create contact" }] },
      { status: 500 }
    );
  }
}
