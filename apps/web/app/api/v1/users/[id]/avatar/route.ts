import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { findUserByIdAsync, updateUserAsync, isFounderOrAdmin } from "@/lib/user-repository";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

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
        { errors: [{ message: "No file uploaded" }] },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { errors: [{ message: "Invalid file type. Only JPEG, PNG, and WebP are allowed." }] },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { errors: [{ message: "File too large. Maximum size is 5MB." }] },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `${targetUser.id}_${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Delete old avatar file if it exists
    if (targetUser.avatar_url && targetUser.avatar_url.includes("/uploads/avatars/")) {
      try {
        const oldFilename = targetUser.avatar_url.split("/").pop();
        if (oldFilename) {
          await unlink(path.join(UPLOAD_DIR, oldFilename));
        }
      } catch {
        // Old file missing, ignore
      }
    }

    // Write new file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Persist new avatar URL to Neon DB
    const avatarUrl = `/uploads/avatars/${filename}`;
    await updateUserAsync(targetUser.id, { avatar_url: avatarUrl });

    return NextResponse.json({
      data: {
        avatar_url: avatarUrl,
        message: "Profile picture updated successfully",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to upload profile picture" }] },
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

    if (targetUser.avatar_url && targetUser.avatar_url.includes("/uploads/avatars/")) {
      try {
        const oldFilename = targetUser.avatar_url.split("/").pop();
        if (oldFilename) {
          await unlink(path.join(UPLOAD_DIR, oldFilename));
        }
      } catch {
        // Ignore missing file
      }
    }

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
