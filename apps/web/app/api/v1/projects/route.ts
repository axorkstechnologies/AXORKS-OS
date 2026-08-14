import { NextRequest, NextResponse } from "next/server";
import { getProjectsAsync, createProjectAsync } from "@/lib/business-repository";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  try {
    const authHeader = req.headers.get("authorization");
    const backendRes = await fetch(`${API_BASE_URL}/api/v1/projects?${searchParams.toString()}`, {
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

  const projects = await getProjectsAsync();
  return NextResponse.json({
    data: projects,
    items: projects,
    total: projects.length,
    page: 1,
    per_page: 100,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    try {
      const authHeader = req.headers.get("authorization");
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/projects`, {
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

    const newProject = await createProjectAsync({
      name: body.name || body.title || "New Project",
      client_name: body.client_name || body.client || "Client",
      budget: Number(body.budget || body.value || 0),
      spent: Number(body.spent || 0),
      deadline: body.deadline || body.due_date || "2026-12-31",
      status: body.status || "in_progress",
      health: body.health || "good",
      description: body.description || "",
      tech_stack: body.tech_stack || ["TypeScript", "Next.js"],
      team_members: body.team_members || ["Muhammad Mujahid"],
    });

    return NextResponse.json({ data: newProject });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to create project" }] },
      { status: 500 }
    );
  }
}
