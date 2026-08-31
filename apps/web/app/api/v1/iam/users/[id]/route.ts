import { NextRequest, NextResponse } from "next/server";
import { findUserByIdAsync, updateUserAsync, deleteUserAsync, isProtectedRealProfile } from "@/lib/user-repository";
import { authenticateRequest } from "@/lib/server-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const caller = await authenticateRequest(req);

  const user = await findUserByIdAsync(id);
  if (!user) {
    return NextResponse.json(
      { errors: [{ message: "Employee user not found" }] },
      { status: 404 }
    );
  }

  const isCallerFounder =
    caller?.role?.toLowerCase() === "founder" ||
    caller?.email === "mujahidaryan222149@gmail.com" ||
    caller?.email === "muhammad.mujahid@axorks.com";

  const { password_hash, ...safeUser } = user;

  // STRICT ACCESS CONTROL:
  // Only the Founder has authorization to view the active employee password/credential
  if (!isCallerFounder) {
    delete (safeUser as any).last_set_password;
  }

  return NextResponse.json({ success: true, data: safeUser });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = await updateUserAsync(id, body);

    if (!updated) {
      return NextResponse.json(
        { errors: [{ message: "Employee user not found in database" }] },
        { status: 404 }
      );
    }

    const { password_hash, ...safeUser } = updated;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to update user" }] },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await findUserByIdAsync(id);
    if (!user) {
      return NextResponse.json(
        { errors: [{ message: "Employee account not found" }] },
        { status: 404 }
      );
    }

    // STRICT NON-NEGOTIABLE RULE:
    // Protected profiles (Muhammad Mujahid, Farhana Bakht, Farwa) must NEVER be deleted.
    if (isProtectedRealProfile(user)) {
      return NextResponse.json(
        { errors: [{ message: "STRICT SECURITY RULE: The protected company profiles (Muhammad Mujahid, Farhana Bakht, Farwa) can NEVER be deleted." }] },
        { status: 403 }
      );
    }

    const result = await deleteUserAsync(id);
    return NextResponse.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to delete employee account" }] },
      { status: 500 }
    );
  }
}
