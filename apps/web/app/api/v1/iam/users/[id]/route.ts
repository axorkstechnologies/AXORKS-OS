import { NextRequest, NextResponse } from "next/server";
import { findUserByIdAsync, updateUserAsync, deleteUserAsync, isProtectedRealProfile } from "@/lib/user-repository";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const authHeader = req.headers.get("authorization");
    const backendRes = await fetch(`${API_BASE_URL}/api/v1/iam/users/${id}`, {
      headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data?.data) return NextResponse.json(data);
    }
  } catch {
    // Fallback directly to Neon DB
  }

  const user = await findUserByIdAsync(id);

  if (!user) {
    return NextResponse.json(
      { errors: [{ message: "Employee user not found" }] },
      { status: 404 }
    );
  }

  const { password_hash, ...safeUser } = user;
  return NextResponse.json({ data: safeUser });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();

    try {
      const authHeader = req.headers.get("authorization");
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/iam/users/${id}`, {
        method: "PATCH",
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
      // Fallback
    }

    const updated = await updateUserAsync(id, body);

    if (!updated) {
      return NextResponse.json(
        { errors: [{ message: "Employee user not found" }] },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to update user" }] },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await findUserByIdAsync(id);
    if (!user) {
      return NextResponse.json(
        { errors: [{ message: "Employee account not found" }] },
        { status: 404 }
      );
    }

    // STRICT NON-NEGOTIABLE RULE:
    // Protected profiles (Muhammad Mujahid, Farhana Bakht, Farwa) must NEVER be deleted.
    if (isProtectedRealProfile(user)) {
      return NextResponse.json(
        { errors: [{ message: "STRICT SECURITY RULE: The three protected company profiles (Muhammad Mujahid, Farhana Bakht, Farwa) can NEVER be deleted." }] },
        { status: 403 }
      );
    }

    // Forward to backend if available
    try {
      const authHeader = req.headers.get("authorization");
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/iam/users/${id}`, {
        method: "DELETE",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data) return NextResponse.json(data);
      }
    } catch {
      // Fallback to Neon DB
    }

    const result = await deleteUserAsync(id);
    return NextResponse.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to delete employee account" }] },
      { status: 500 }
    );
  }
}
