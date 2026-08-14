import { NextRequest, NextResponse } from "next/server";
import {
  findUserByIdentifierAsync,
  recordLoginSession,
  verifyPassword,
} from "@/lib/user-repository";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || body.email || body.username || "").trim().toLowerCase();
    const password = body.password || "";

    if (!identifier || !password) {
      return NextResponse.json(
        { errors: [{ message: "Please provide both username/email and password" }] },
        { status: 400 }
      );
    }

    // 1. Try FastAPI backend first
    try {
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data?.data?.access_token) return NextResponse.json(data);
      }
    } catch {
      // Backend not running, use direct Neon DB fallback
    }

    // 2. Query user from Neon DB directly
    const user = await findUserByIdentifierAsync(identifier);

    if (user) {
      // Verify password using bcrypt comparison
      if (!verifyPassword(password, user.password_hash)) {
        return NextResponse.json(
          { errors: [{ message: "Invalid username/email or password" }] },
          { status: 401 }
        );
      }

      // Check if account is active
      if (user.status !== "active") {
        return NextResponse.json(
          { errors: [{ message: `Account is ${user.status}. Contact your administrator.` }] },
          { status: 403 }
        );
      }

      // Record active login session
      const session = recordLoginSession(user, "127.0.0.1", "Web Browser");
      const mockToken = `jwt_session_${user.id}_${Date.now()}`;

      return NextResponse.json({
        data: {
          access_token: mockToken,
          token_type: "bearer",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            department: user.department,
            permissions: user.permissions,
            avatar_url: user.avatar_url || null,
          },
          session,
        },
      });
    }

    // 3. User not found
    return NextResponse.json(
      { errors: [{ message: "Invalid username/email or password" }] },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Login failed" }] },
      { status: 500 }
    );
  }
}
