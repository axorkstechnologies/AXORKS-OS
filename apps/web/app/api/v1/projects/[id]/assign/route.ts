import { NextRequest, NextResponse } from "next/server";
import { assignProjectEngineersAsync } from "@/lib/business-repository";
import { isFounderOrAdmin } from "@/lib/user-repository";
import { authenticateRequest } from "@/lib/server-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Valid session required" },
        { status: 401 }
      );
    }

    if (!isFounderOrAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Founder or Admin can assign engineers to projects" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { assigned_to, assigned_to_names } = body;

    if (!Array.isArray(assigned_to)) {
      return NextResponse.json(
        { success: false, error: "assigned_to must be an array of user IDs" },
        { status: 400 }
      );
    }

    const assignedBy = `${user.first_name} ${user.last_name || ""}`.trim() || user.role;
    const updated = await assignProjectEngineersAsync(
      id,
      assigned_to,
      assigned_to_names || [],
      assignedBy
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Project not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Assigned project to ${assigned_to.length} engineer(s) in Neon DB`,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error assigning engineers to project:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
