import { NextRequest, NextResponse } from "next/server";
import { submitSocialProofAsync, getSocialProofsAsync, reviewSocialProofAsync } from "@/lib/performance-repository";
import { findUserByIdAsync } from "@/lib/user-repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const platform = searchParams.get("platform") || undefined;

    const data = await getSocialProofsAsync({ userId, platform });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch social proofs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, platform, postTitle, postUrl, googleDriveUrl, submissionNotes } = body;

    if (!userId || !platform || !postTitle || !googleDriveUrl) {
      return NextResponse.json(
        { success: false, error: "User ID, platform, post title, and shared Google Drive proof URL are required." },
        { status: 400 }
      );
    }

    const user = await findUserByIdAsync(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Employee account not found in database." },
        { status: 404 }
      );
    }

    const proof = await submitSocialProofAsync({
      userId: user.id,
      userName: `${user.first_name} ${user.last_name || ""}`.trim(),
      userEmail: user.email,
      platform,
      postTitle: postTitle.trim(),
      postUrl: postUrl ? postUrl.trim() : null,
      googleDriveUrl: googleDriveUrl.trim(),
      submissionNotes: submissionNotes ? submissionNotes.trim() : null,
    });

    return NextResponse.json({
      success: true,
      data: proof,
      message: "Social media campaign proof submitted and verified successfully in Neon DB!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit social proof" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { proofId, status, reviewerName } = body;

    if (!proofId || !status) {
      return NextResponse.json(
        { success: false, error: "Proof ID and status are required." },
        { status: 400 }
      );
    }

    await reviewSocialProofAsync(proofId, status, reviewerName || "Founder");

    return NextResponse.json({
      success: true,
      message: `Proof updated to '${status}'.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to review social proof" },
      { status: 500 }
    );
  }
}
