import { NextRequest, NextResponse } from "next/server";
import { findUserByIdAsync } from "@/lib/user-repository";
import { verifySessionToken } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    let token = "";
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      token = req.cookies.get("axorks_token")?.value || "";
    }

    if (!token) {
      return NextResponse.json(
        { errors: [{ message: "Authentication token required" }] },
        { status: 401 }
      );
    }

    // 1. Strictly verify HMAC-SHA256 signature (rejects forged/tampered/old tokens)
    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json(
        { errors: [{ message: "Invalid or expired session token" }] },
        { status: 401 }
      );
    }

    // 2. Query Neon PostgreSQL in real-time
    const user = await findUserByIdAsync(payload.userId);
    if (!user) {
      return NextResponse.json(
        { errors: [{ message: "User account not found" }] },
        { status: 404 }
      );
    }

    // 3. Strict Check: Account Suspension
    // Suspended accounts are immediately blocked on next API polling
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
    console.error("Session verification error:", error);
    return NextResponse.json(
      { errors: [{ message: "Failed to verify session" }] },
      { status: 500 }
    );
  }
}
