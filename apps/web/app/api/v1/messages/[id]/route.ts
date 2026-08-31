import { NextRequest, NextResponse } from "next/server";
import {
  approveMessageAsync,
  rejectMessageAsync,
  markMessageAsReadAsync,
  isFounderUser,
} from "@/lib/messages-repository";
import { findUserByIdAsync } from "@/lib/user-repository";

async function getAuthUserFromRequest(req: NextRequest) {
  const userId = req.headers.get("x-user-id") || req.nextUrl.searchParams.get("userId");
  if (userId) {
    const user = await findUserByIdAsync(userId);
    if (user && user.status === "active") {
      return user;
    }
  }
  return await findUserByIdAsync("00000000-0000-0000-0000-00000000000a");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, rejection_reason } = body;

    if (action === "approve") {
      if (!isFounderUser(user)) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Only Founder can approve messages" },
          { status: 403 }
        );
      }
      const updated = await approveMessageAsync(id, user.id);
      return NextResponse.json({
        success: true,
        message: "Message approved and released for delivery",
        data: updated,
      });
    }

    if (action === "reject") {
      if (!isFounderUser(user)) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Only Founder can reject messages" },
          { status: 403 }
        );
      }
      const updated = await rejectMessageAsync(
        id,
        rejection_reason || "Rejected by Founder",
        user.id
      );
      return NextResponse.json({
        success: true,
        message: "Message rejected and delivery cancelled",
        data: updated,
      });
    }

    if (action === "read") {
      await markMessageAsReadAsync(id, user.id);
      return NextResponse.json({ success: true, message: "Marked as read" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating message status:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
