import { NextRequest, NextResponse } from "next/server";

const globalScoreStore = globalThis as unknown as {
  __axorks_score_history?: Record<string, Array<{
    id: string;
    lead_id: string;
    new_score: number;
    reason: string;
    scored_by: string;
    created_at: string;
  }>>;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const history = globalScoreStore.__axorks_score_history?.[id] || [];
    return NextResponse.json({ data: history });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to fetch score history" }] },
      { status: 500 }
    );
  }
}
