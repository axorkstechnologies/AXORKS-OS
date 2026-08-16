import { NextRequest, NextResponse } from "next/server";
import { findUserByIdAsync, updateUserAsync, isFounderOrAdmin } from "@/lib/user-repository";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB limit for fast serverless base64 processing

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;

    // Extract authorization header token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const tokenParts = token.split("_");
    const requestingUserId = tokenParts.length >= 4
      ? tokenParts.slice(2, -1).join("_")
      : null;

    if (!requestingUserId) {
      return NextResponse.json(
        { errors: [{ message: "Authentication required" }] },
        { status: 401 }
      );
    }

    // Query both requesting user and target user from Neon DB
    const requestingUser = await findUserByIdAsync(requestingUserId);
    const targetUser = await findUserByIdAsync(targetUserId);

    if (!requestingUser) {
      return NextResponse.json(
        { errors: [{ message: "Authenticated user account not found" }] },
        { status: 404 }
      );
    }

    if (!targetUser) {
      return NextResponse.json(
        { errors: [{ message: "Target employee profile not found" }] },
        { status: 404 }
      );
    }

    // Authorization Rule:
    // 1. Every user CAN update their own profile picture.
    // 2. Founder and Co-Founder can update any employee's profile picture.
    const isSelf =
      requestingUser.id === targetUser.id ||
      requestingUser.email.toLowerCase() === targetUser.email.toLowerCase() ||
      requestingUser.username.toLowerCase() === targetUser.username.toLowerCase();

    const isPrivileged = isFounderOrAdmin(requestingUser.role);

    if (!isSelf && !isPrivileged) {
      return NextResponse.json(
        { errors: [{ message: "You are not authorized to update this profile picture" }] },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json(
        { errors: [{ message: "No image file uploaded" }] },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { errors: [{ message: "Invalid file format. Only JPEG, PNG, and WebP images are allowed." }] },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { errors: [{ message: "Image too large. Maximum size is 3MB." }] },
        { status: 400 }
      );
    }

    // Convert file to Base64 Data URL in memory (Serverless Production Safe)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const avatarUrl = `data:${file.type};base64,${base64Data}`;

    // Persist Base64 Data URL directly into Neon PostgreSQL database
    const updatedUser = await updateUserAsync(targetUser.id, { avatar_url: avatarUrl });

    return NextResponse.json({
      data: {
        avatar_url: avatarUrl,
        user: updatedUser,
        message: "Profile picture updated successfully",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to process profile picture" }] },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const tokenParts = token.split("_");
    const requestingUserId = tokenParts.length >= 4
      ? tokenParts.slice(2, -1).join("_")
      : null;

    if (!requestingUserId) {
      return NextResponse.json(
        { errors: [{ message: "Authentication required" }] },
        { status: 401 }
      );
    }

    const requestingUser = await findUserByIdAsync(requestingUserId);
    const targetUser = await findUserByIdAsync(targetUserId);

    if (!requestingUser || !targetUser) {
      return NextResponse.json(
        { errors: [{ message: "User account not found" }] },
        { status: 404 }
      );
    }

    const isSelf =
      requestingUser.id === targetUser.id ||
      requestingUser.email.toLowerCase() === targetUser.email.toLowerCase();

    const isPrivileged = isFounderOrAdmin(requestingUser.role);

    if (!isSelf && !isPrivileged) {
      return NextResponse.json(
        { errors: [{ message: "You are not authorized to remove this profile picture" }] },
        { status: 403 }
      );
    }

    // Remove avatar URL from Neon PostgreSQL
    await updateUserAsync(targetUser.id, { avatar_url: null });

    return NextResponse.json({
      data: { message: "Profile picture removed successfully" },
    });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to remove profile picture" }] },
      { status: 500 }
    );
  }
}
