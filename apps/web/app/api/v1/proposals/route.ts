import { NextRequest, NextResponse } from "next/server";
import { getProposalsAsync, createProposalAsync } from "@/lib/business-repository";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  try {
    const authHeader = req.headers.get("authorization");
    const backendRes = await fetch(`${API_BASE_URL}/api/v1/proposals?${searchParams.toString()}`, {
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

  const proposals = await getProposalsAsync();
  return NextResponse.json({
    data: proposals,
    items: proposals,
    total: proposals.length,
    page: 1,
    per_page: 100,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    try {
      const authHeader = req.headers.get("authorization");
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/proposals`, {
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

    const newProposal = await createProposalAsync(body);

    return NextResponse.json({ data: newProposal });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to create proposal" }] },
      { status: 500 }
    );
  }
}
