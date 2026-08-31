import { NextRequest, NextResponse } from "next/server";
import {
  getKnowledgePagesAsync,
  createKnowledgePageAsync,
} from "@/lib/knowledge-repository";
import { authenticateRequest } from "@/lib/server-auth";
import { isFounderOrAdmin } from "@/lib/user-repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;

    const pages = await getKnowledgePagesAsync({ search, category });

    return NextResponse.json({
      success: true,
      data: pages,
    });
  } catch (error: any) {
    console.error("Error fetching knowledge pages:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const authorName = `${user.first_name} ${user.last_name || ""}`.trim() || user.role;

    const page = await createKnowledgePageAsync({
      title: body.title,
      slug: body.slug,
      category: body.category || body.page_type || "sop",
      page_type: body.page_type || "sop",
      icon: body.icon || "📋",
      content: body.content || "",
      author_id: user.id,
      author_name: authorName,
      is_pinned: Boolean(body.is_pinned),
    });

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error: any) {
    console.error("Error creating knowledge page:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create page" },
      { status: 500 }
    );
  }
}
