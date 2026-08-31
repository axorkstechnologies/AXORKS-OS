import { NextRequest, NextResponse } from "next/server";
import {
  findUserByIdentifierAsync,
  recordLoginSession,
  verifyPassword,
} from "@/lib/user-repository";
import { createSessionToken } from "@/lib/server-auth";
import {
  checkIpLoginAllowed,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
} from "@/lib/ip-security";

export async function POST(req: NextRequest) {
  try {
    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const clientIp = rawIp.split(",")[0].trim();

    // 1. IP Brute-Force Pre-Check
    const ipCheck = await checkIpLoginAllowed(clientIp);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        {
          errors: [{ message: ipCheck.reason || "Access blocked due to excessive failed attempts" }],
          is_blocked: true,
          is_permanent: ipCheck.isPermanent,
          remaining_minutes: ipCheck.remainingMinutes,
        },
        { status: ipCheck.isPermanent ? 403 : 429 }
      );
    }

    const body = await req.json();
    const identifier = (body.identifier || body.email || body.username || "").trim().toLowerCase();
    const password = body.password || "";

    if (!identifier || !password) {
      return NextResponse.json(
        { errors: [{ message: "Please provide both username/email and password" }] },
        { status: 400 }
      );
    }

    // 2. Query user from Neon DB
    const user = await findUserByIdentifierAsync(identifier);

    if (!user) {
      const lockResult = await recordFailedLoginAttempt(clientIp, identifier);
      let errorMsg = "Invalid username/email or password";
      if (lockResult.isPermanent) {
        errorMsg = "Invalid credentials. IP address permanently blocked due to repeated failures.";
      } else if (lockResult.lockedUntil) {
        const mins = lockResult.attempts >= 6 ? 45 : 10;
        errorMsg = `Invalid credentials. IP address locked for ${mins} minutes due to failed attempts.`;
      } else {
        const remaining = 3 - (lockResult.attempts % 3 || 3);
        if (remaining > 0) {
          errorMsg = `Invalid username/email or password (${remaining} attempt${remaining > 1 ? "s" : ""} left before temporary lockout).`;
        }
      }

      return NextResponse.json(
        { errors: [{ message: errorMsg }] },
        { status: lockResult.isPermanent ? 403 : lockResult.lockedUntil ? 429 : 401 }
      );
    }

    // 3. Strictly Verify Password Hash
    const isValidPassword = verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      const lockResult = await recordFailedLoginAttempt(clientIp, identifier);
      let errorMsg = "Invalid username/email or password";
      if (lockResult.isPermanent) {
        errorMsg = "Invalid credentials. IP address permanently blocked due to repeated failures.";
      } else if (lockResult.lockedUntil) {
        const mins = lockResult.attempts >= 6 ? 45 : 10;
        errorMsg = `Invalid credentials. IP address locked for ${mins} minutes due to failed attempts.`;
      } else {
        const remaining = 3 - (lockResult.attempts % 3 || 3);
        if (remaining > 0) {
          errorMsg = `Invalid username/email or password (${remaining} attempt${remaining > 1 ? "s" : ""} left before temporary lockout).`;
        }
      }

      return NextResponse.json(
        { errors: [{ message: errorMsg }] },
        { status: lockResult.isPermanent ? 403 : lockResult.lockedUntil ? 429 : 401 }
      );
    }

    // 4. Strict Check: Account Suspension / Inactive status
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

    // 5. Successful Login -> Reset failed attempt counter for this IP
    await recordSuccessfulLogin(clientIp);

    // 6. Generate Cryptographically Signed HMAC-SHA256 Token
    const sessionToken = createSessionToken(user);

    // 7. Record Login Presence
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
