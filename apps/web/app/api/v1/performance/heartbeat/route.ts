import { NextRequest, NextResponse } from "next/server";
import { recordHeartbeatAsync } from "@/lib/performance-repository";
import { findUserByIdAsync } from "@/lib/user-repository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, activeMinutes = 5, device = "Desktop" } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await findUserByIdAsync(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    await recordHeartbeatAsync(
      user.id,
      `${user.first_name} ${user.last_name || ""}`.trim(),
      user.email,
      Number(activeMinutes) || 5,
      ip,
      device
    );

    return NextResponse.json({
      success: true,
      message: "Work time heartbeat recorded",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record heartbeat" },
      { status: 500 }
    );
  }
}
