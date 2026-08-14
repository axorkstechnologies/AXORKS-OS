import { NextRequest, NextResponse } from "next/server";
import { findUserByIdAsync, updateUserAsync, hashPassword } from "@/lib/user-repository";

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
        if (data?.data) return NextResponse.json(data);
      }
    } catch {
      // Backend unreachable — fallback directly to Neon DB queries
    }

    const user = await findUserByIdAsync(targetUserId);
    if (!user) {
      return NextResponse.json(
        { errors: [{ message: "Employee user not found" }] },
        { status: 404 }
      );
    }

    // Founder is never suspendable / lockable / modifiable
    if (
      user.role.toLowerCase() === "founder" &&
      ["suspend", "lock", "deactivate", "delete"].includes(action)
    ) {
      return NextResponse.json(
        { errors: [{ message: "Founder account cannot be suspended or modified" }] },
        { status: 403 }
      );
    }

    if (action === "suspend") {
      await updateUserAsync(targetUserId, { status: "suspended" });
      return NextResponse.json({
        data: { message: `Account for ${user.display_name} has been suspended.` },
        message: `Account for ${user.display_name} has been suspended.`,
      });
    }

    if (action === "reactivate") {
      await updateUserAsync(targetUserId, { status: "active" });
      return NextResponse.json({
        data: { message: `Account for ${user.display_name} has been reactivated.` },
        message: `Account for ${user.display_name} has been reactivated.`,
      });
    }

    if (action === "reset-password") {
      let body: any = {};
      try {
        body = await req.json();
      } catch {
        // empty body
      }
      const targetPassword = body.new_password || body.password || "AxorksPass123!";
      const newHash = hashPassword(targetPassword);
      await updateUserAsync(targetUserId, { password_hash: newHash });
      return NextResponse.json({
        data: { message: `Password for ${user.display_name} has been reset to: ${targetPassword}` },
        message: `Password for ${user.display_name} has been reset to: ${targetPassword}`,
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
