/**
 * Axorks OS — Employee Avatar Upload API
 *
 * Founder/Admin only — employees cannot upload or change their own profile picture.
 * Server-side role check enforced; never trust the frontend.
 *
 * Stores images locally in public/uploads/avatars/ (MVP).
 * Saves the URL in the user record.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { findUserById, updateUser, isFounderOrAdmin } from "@/lib/user-repository";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;

    // Extract the requesting user from the Authorization header (mock JWT)
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    // Parse user ID from mock JWT format: jwt_session_{userId}_{timestamp}
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

    // Server-side role check: ONLY Founder/Admin can upload avatars
    const requestingUser = findUserById(requestingUserId);
    if (!requestingUser || !isFounderOrAdmin(requestingUser.role)) {
      return NextResponse.json(
        { errors: [{ message: "Only Founder or Admin can change employee profile pictures" }] },
        { status: 403 }
      );
    }

    // Verify target user exists
    const targetUser = findUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { errors: [{ message: "User not found" }] },
        { status: 404 }
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

    // Generate a unique filename to prevent overwriting
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `${targetUserId}_${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Delete old avatar file if it exists
    if (targetUser.avatar_url) {
      try {
        const oldFilename = targetUser.avatar_url.split("/").pop();
        if (oldFilename) {
          await unlink(path.join(UPLOAD_DIR, oldFilename));
        }
      } catch {
        // Old file may not exist, ignore
      }
    }

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Update user record with new avatar URL
    const avatarUrl = `/uploads/avatars/${filename}`;
    updateUser(targetUserId, { avatar_url: avatarUrl });

    return NextResponse.json({
      data: {
        avatar_url: avatarUrl,
        message: "Profile picture updated successfully",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to upload avatar" }] },
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

    // Extract and validate requesting user (same as POST)
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
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

    const requestingUser = findUserById(requestingUserId);
    if (!requestingUser || !isFounderOrAdmin(requestingUser.role)) {
      return NextResponse.json(
        { errors: [{ message: "Only Founder or Admin can remove employee profile pictures" }] },
        { status: 403 }
      );
    }

    const targetUser = findUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { errors: [{ message: "User not found" }] },
        { status: 404 }
      );
    }

    // Delete the avatar file
    if (targetUser.avatar_url) {
      try {
        const oldFilename = targetUser.avatar_url.split("/").pop();
        if (oldFilename) {
          await unlink(path.join(UPLOAD_DIR, oldFilename));
        }
      } catch {
        // File may not exist
      }
    }

    // Remove avatar URL from user record
    updateUser(targetUserId, { avatar_url: null });

    return NextResponse.json({
      data: { message: "Profile picture removed successfully" },
    });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to remove avatar" }] },
      { status: 500 }
    );
  }
}
