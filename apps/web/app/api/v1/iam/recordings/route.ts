import { NextRequest, NextResponse } from "next/server";
import { getScreenRecordingsAsync, createScreenRecordingAsync } from "@/lib/business-repository";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const backendRes = await fetch(`${API_BASE_URL}/api/v1/iam/recordings`, {
      headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    // Fallback directly to Neon DB
  }

  const recordings = await getScreenRecordingsAsync();
  return NextResponse.json({ data: recordings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    try {
      const authHeader = req.headers.get("authorization");
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/iam/recordings`, {
        method: "POST",
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
      // Fallback directly to Neon DB
    }

    const created = await createScreenRecordingAsync({
      title: body.title || "Founder Screen Capture Session",
      recording_type: body.recording_type || "screen",
      file_url: body.file_url || null,
      duration_seconds: body.duration_seconds || 0,
      user_id: body.user_id,
    });

    return NextResponse.json({ data: created });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to save recording" }] },
      { status: 500 }
    );
  }
}
