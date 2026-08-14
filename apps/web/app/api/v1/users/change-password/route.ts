import { NextRequest, NextResponse } from "next/server";
import { findUserById, updateUser, verifyPassword, hashPassword } from "@/lib/user-repository";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const tokenParts = token.split("_");
    const requestingUserId = tokenParts.length >= 4
      ? tokenParts.slice(2, -1).join("_")
      : null;

    if (!requestingUserId) {
      return NextResponse.json(
        { errors: [{ message: "Authentication required" }] },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return NextResponse.json(
        { errors: [{ message: "Current password and new password are required" }] },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { errors: [{ message: "New password must be at least 6 characters long" }] },
        { status: 400 }
      );
    }

    // Attempt backend update if available
    try {
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ current_password, new_password }),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }

    const user = findUserById(requestingUserId);
    if (!user) {
      return NextResponse.json(
        { errors: [{ message: "User account not found" }] },
        { status: 404 }
      );
    }

    // Verify current password
    if (!verifyPassword(current_password, user.password_hash)) {
      return NextResponse.json(
        { errors: [{ message: "Current password is incorrect" }] },
        { status: 400 }
      );
    }

    // Update password
    updateUser(user.id, { password_hash: hashPassword(new_password) });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      data: { message: "Password updated successfully" },
    });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to update password" }] },
      { status: 500 }
    );
  }
}
