import { NextRequest, NextResponse } from "next/server";
import { findUserByIdAsync, updateUserAsync } from "@/lib/user-repository";

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
  } catch (err) {
    // Fallback directly to Neon DB
  }

  const user = await findUserByIdAsync(id);

  if (!user) {
    return NextResponse.json(
      { errors: [{ message: "Employee user not found" }] },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: user });
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
    } catch (err) {
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
