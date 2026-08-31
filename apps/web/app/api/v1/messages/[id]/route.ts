import { NextRequest, NextResponse } from "next/server";
import {
  approveMessageAsync,
  rejectMessageAsync,
  markMessageAsReadAsync,
  isFounderUser,
} from "@/lib/messages-repository";
import { authenticateRequest } from "@/lib/server-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Valid session required" },
        { status: 401 }
      );
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
