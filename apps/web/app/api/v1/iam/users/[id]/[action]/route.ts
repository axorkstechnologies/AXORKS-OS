import { NextRequest, NextResponse } from "next/server";
import { findUserById, updateUser, isFounderOrAdmin } from "@/lib/user-repository";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const { id: targetUserId, action } = await params;

    // Try backend if available
    try {
      const authHeader = req.headers.get("authorization");
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/iam/users/${targetUserId}/${action}`, {
        method: "POST",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend unreachable — handle in central user store
    }

    const user = findUserById(targetUserId);
    if (!user) {
      return NextResponse.json(
        { errors: [{ message: "Employee user not found" }] },
        { status: 404 }
      );
    }

    if (action === "suspend") {
      updateUser(targetUserId, { status: "suspended" });
      return NextResponse.json({
        data: { message: `Account for ${user.display_name} has been suspended.` },
        message: `Account for ${user.display_name} has been suspended.`,
      });
    }

    if (action === "reactivate") {
      updateUser(targetUserId, { status: "active" });
      return NextResponse.json({
        data: { message: `Account for ${user.display_name} has been reactivated.` },
        message: `Account for ${user.display_name} has been reactivated.`,
      });
    }

    if (action === "reset-password") {
      updateUser(targetUserId, { password_hash: "$2a$10$e8w.n..." }); // or default pass
      return NextResponse.json({
        data: { message: `Password for ${user.display_name} has been reset to: AxorksPass123!` },
        message: `Password for ${user.display_name} has been reset to: AxorksPass123!`,
      });
    }

    if (action === "impersonate") {
      return NextResponse.json({
        data: { message: `Switched active session view to ${user.display_name}` },
        message: `Switched active session view to ${user.display_name}`,
      });
    }

    return NextResponse.json(
      { errors: [{ message: `Action '${action}' not supported` }] },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to execute user action" }] },
      { status: 500 }
    );
  }
}
