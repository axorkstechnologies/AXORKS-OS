import { NextRequest, NextResponse } from "next/server";
import { getKnowledgePageBySlugAsync } from "@/lib/knowledge-repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const page = await getKnowledgePageBySlugAsync(slug);
    if (!page) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: page });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
