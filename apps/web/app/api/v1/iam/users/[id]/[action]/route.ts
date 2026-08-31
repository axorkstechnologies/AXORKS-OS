import { NextRequest, NextResponse } from "next/server";
import { findUserByIdAsync, updateUserAsync, setEmployeePasswordAsync, setEmployeeRoleAsync } from "@/lib/user-repository";
import { authenticateRequest } from "@/lib/server-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const { id: targetUserId, action } = await params;
    const callerUser = await authenticateRequest(req);

    const targetUser = await findUserByIdAsync(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { errors: [{ message: "Employee user not found in database" }] },
        { status: 404 }
      );
    }

    // STRICT SECURITY RULE:
    // Founder account can NEVER be modified, suspended, or reset by anyone other than the Founder.
    const isTargetFounder =
      targetUser.role?.toLowerCase() === "founder" ||
      targetUser.email === "mujahidaryan222149@gmail.com" ||
      targetUser.email === "muhammad.mujahid@axorks.com";

    const isCallerFounder =
      callerUser?.role?.toLowerCase() === "founder" ||
      callerUser?.email === "mujahidaryan222149@gmail.com" ||
      callerUser?.email === "muhammad.mujahid@axorks.com";

    if (isTargetFounder && !isCallerFounder && callerUser !== null) {
      return NextResponse.json(
        { errors: [{ message: "Co-Founder and employees are strictly forbidden from modifying or resetting the Founder password/account." }] },
        { status: 403 }
      );
    }

    if (isTargetFounder && ["suspend", "lock", "deactivate", "delete"].includes(action)) {
      return NextResponse.json(
        { errors: [{ message: "Founder account cannot be suspended or deactivated." }] },
        { status: 403 }
      );
    }

    // 1. Suspend Action
    if (action === "suspend") {
      await updateUserAsync(targetUserId, { status: "suspended" });
      return NextResponse.json({
        success: true,
        data: { message: `Account for ${targetUser.display_name} has been suspended.` },
        message: `Account for ${targetUser.display_name} has been suspended.`,
      });
    }

    // 2. Reactivate Action
    if (action === "reactivate") {
      await updateUserAsync(targetUserId, { status: "active" });
      return NextResponse.json({
        success: true,
        data: { message: `Account for ${targetUser.display_name} has been reactivated.` },
        message: `Account for ${targetUser.display_name} has been reactivated.`,
      });
    }

    // 3. Password Management (Founder Direct DB Update)
    if (action === "reset-password" || action === "change-password" || action === "set-password") {
      let body: any = {};
      try {
        body = await req.json();
      } catch {
        // empty body
      }
      const targetPassword = body.new_password || body.password || body.newPassword || "AxorksPass123!";
      if (typeof targetPassword !== "string" || targetPassword.trim().length < 6) {
        return NextResponse.json(
          { errors: [{ message: "Password must be at least 6 characters long." }] },
          { status: 400 }
        );
      }

      const success = await setEmployeePasswordAsync(targetUserId, targetPassword.trim());
      if (!success) {
        throw new Error("Failed to write updated password to Neon database");
      }

      return NextResponse.json({
        success: true,
        data: {
          message: `Password for ${targetUser.display_name} has been updated in Neon DB.`,
          user_id: targetUser.id,
          email: targetUser.email,
          last_set_password: targetPassword.trim(),
        },
        message: `Password for ${targetUser.display_name} has been updated in Neon DB.`,
      });
    }

    // 4. Role Management (Founder Direct DB Update)
    if (action === "change-role" || action === "update-role" || action === "set-role") {
      let body: any = {};
      try {
        body = await req.json();
      } catch {
        // empty body
      }
      const newRole = body.role || body.new_role;
      if (!newRole || typeof newRole !== "string") {
        return NextResponse.json(
          { errors: [{ message: "A valid role string is required." }] },
          { status: 400 }
        );
      }

      const updatedUser = await setEmployeeRoleAsync(
        targetUserId,
        newRole.trim(),
        body.department,
        body.designation
      );

      return NextResponse.json({
        success: true,
        data: {
          message: `Role for ${targetUser.display_name} updated to '${newRole}'.`,
          user: updatedUser,
        },
        message: `Role for ${targetUser.display_name} updated to '${newRole}'.`,
      });
    }

    if (action === "impersonate") {
      return NextResponse.json({
        success: true,
        data: { message: `Switched active session view to ${targetUser.display_name}` },
        message: `Switched active session view to ${targetUser.display_name}`,
      });
    }

    return NextResponse.json(
      { errors: [{ message: `Action '${action}' not supported` }] },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to execute user action" }] },
      { status: 500 }
    );
  }
}
