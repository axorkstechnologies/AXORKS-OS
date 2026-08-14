import { NextRequest, NextResponse } from "next/server";
import { getInvoicesAsync, createInvoiceAsync } from "@/lib/business-repository";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  try {
    const authHeader = req.headers.get("authorization");
    const backendRes = await fetch(`${API_BASE_URL}/api/v1/finance/invoices?${searchParams.toString()}`, {
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

  const invoices = await getInvoicesAsync();
  return NextResponse.json({
    data: invoices,
    items: invoices,
    total: invoices.length,
    page: 1,
    per_page: 100,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    try {
      const authHeader = req.headers.get("authorization");
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/finance/invoices`, {
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

    const newInvoice = await createInvoiceAsync(body);

    return NextResponse.json({ data: newInvoice });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to create invoice" }] },
      { status: 500 }
    );
  }
}
