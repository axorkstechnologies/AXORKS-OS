import { NextRequest, NextResponse } from "next/server";
import {
  getScreenRecordingsAsync,
  createScreenRecordingAsync,
  deleteScreenRecordingAsync,
} from "@/lib/business-repository";
import { authenticateRequest } from "@/lib/server-auth";
import { isFounderOrAdmin } from "@/lib/user-repository";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized =
      isFounderOrAdmin(user.role) ||
      user.role === "Founder" ||
      user.role === "Co-Founder" ||
      user.email === "mujahidaryan222149@gmail.com" ||
      user.email === "heyfarii@gmail.com";

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Founder and Co-Founder can access screen recordings" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employee_id") || undefined;

    // Auto-purges expired (> 1 day old) and fetches active recordings
    const recordings = await getScreenRecordingsAsync({ employeeId });

    return NextResponse.json({
      success: true,
      total: recordings.length,
      data: recordings,
    });
  } catch (error: any) {
    console.error("Error retrieving recordings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve recordings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized =
      isFounderOrAdmin(user.role) ||
      user.role === "Founder" ||
      user.role === "Co-Founder" ||
      user.email === "mujahidaryan222149@gmail.com" ||
      user.email === "heyfarii@gmail.com";

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Founder and Co-Founder can save screen recordings" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const recordedByName = `${user.first_name} ${user.last_name || ""}`.trim() || user.role;

    const created = await createScreenRecordingAsync({
      title: body.title || "Employee Screen Capture Session",
      recording_type: body.recording_type || (body.media_type === "call_audio" ? "call" : "screen"),
      media_type: body.media_type || "screen_video",
      file_url: body.file_url || null,
      image_data: body.image_data || null,
      duration_seconds: body.duration_seconds || 0,
      file_size_bytes: body.file_size_bytes || 0,
      employee_id: body.employee_id || body.user_id || null,
      employee_name: body.employee_name || "All Staff",
      recorded_by_id: user.id,
      recorded_by_name: recordedByName,
    });

    return NextResponse.json({
      success: true,
      data: created,
    });
  } catch (error: any) {
    console.error("Error saving recording:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save recording" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized =
      isFounderOrAdmin(user.role) ||
      user.role === "Founder" ||
      user.role === "Co-Founder" ||
      user.email === "mujahidaryan222149@gmail.com" ||
      user.email === "heyfarii@gmail.com";

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const success = await deleteScreenRecordingAsync(id);
    return NextResponse.json({ success, message: "Recording deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting recording:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete recording" },
      { status: 500 }
    );
  }
}
