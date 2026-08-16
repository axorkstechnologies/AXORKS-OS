import { NextRequest, NextResponse } from "next/server";
import { findUserByIdAsync } from "@/lib/user-repository";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        { errors: [{ message: "Authentication token required" }] },
        { status: 401 }
      );
    }

    const tokenParts = token.split("_");
    const userId = tokenParts.length >= 4 ? tokenParts.slice(2, -1).join("_") : null;

    if (!userId) {
      return NextResponse.json(
        { errors: [{ message: "Invalid session token" }] },
        { status: 401 }
      );
    }

    const user = await findUserByIdAsync(userId);

    if (!user) {
      return NextResponse.json(
        { errors: [{ message: "User account not found" }] },
        { status: 404 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          errors: [{ message: "Restricted by Founder" }],
          status: user.status,
          user_id: user.id,
        },
        { status: 403 }
      );
    }

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ data: safeUser });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to verify session" }] },
      { status: 500 }
    );
  }
}
