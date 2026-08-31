import { NextRequest, NextResponse } from "next/server";
import {
  findUserByIdentifierAsync,
  recordLoginSession,
  verifyPassword,
} from "@/lib/user-repository";
import { createSessionToken } from "@/lib/server-auth";

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

    // 1. Strictly Query user from Neon DB
    const user = await findUserByIdentifierAsync(identifier);

    if (!user) {
      return NextResponse.json(
        { errors: [{ message: "Invalid username/email or password" }] },
        { status: 401 }
      );
    }

    // 2. Strictly Verify Password Hash using bcrypt
    const isValidPassword = verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { errors: [{ message: "Invalid username/email or password" }] },
        { status: 401 }
      );
    }

    // 3. Strict Check: Account Suspension / Inactive status
    // Suspended accounts are completely rejected, even with correct password
    if (user.status !== "active") {
      return NextResponse.json(
        {
          errors: [{ message: "Restricted by Founder: Your account access is suspended." }],
          status: user.status,
          user_id: user.id,
        },
        { status: 403 }
      );
    }

    // 4. Generate Cryptographically Signed HMAC-SHA256 Token
    const sessionToken = createSessionToken(user);

    // 5. Record Login Presence
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Web Browser";
    const session = recordLoginSession(user, clientIp, userAgent);

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      department: user.department,
      permissions: user.permissions,
      avatar_url: user.avatar_url || null,
    };

    const response = NextResponse.json({
      data: {
        access_token: sessionToken,
        token_type: "bearer",
        user: safeUser,
        session,
      },
    });

    // Set secure HTTP-only cookie for middleware and edge route verification
    response.cookies.set("axorks_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 Days
    });

    return response;
  } catch (error: any) {
    console.error("Login authentication error:", error);
    return NextResponse.json(
      { errors: [{ message: "Authentication failed. Please try again." }] },
      { status: 500 }
    );
  }
}
