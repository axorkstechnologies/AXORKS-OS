import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server-auth";
import { isFounderOrAdmin } from "@/lib/user-repository";
import { getBlockedIpsAsync, unblockIpAsync } from "@/lib/ip-security";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!isFounderOrAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Founder can inspect blocked IP security records" },
        { status: 403 }
      );
    }

    const blockedIps = await getBlockedIpsAsync();

    return NextResponse.json({
      success: true,
      count: blockedIps.length,
      data: blockedIps,
    });
  } catch (error: any) {
    console.error("Error retrieving blocked IPs:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!isFounderOrAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Founder can manage IP blocks" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { ip, action } = body;

    if (!ip) {
      return NextResponse.json({ success: false, error: "ip address is required" }, { status: 400 });
    }

    if (action === "unblock") {
      const founderName = `${user.first_name} ${user.last_name || ""}`.trim() || user.role;
      const success = await unblockIpAsync(ip, founderName);

      return NextResponse.json({
        success,
        message: `IP ${ip} has been unblocked by Founder ${founderName}`,
      });
    }

    if (action === "block") {
      await sql`
        INSERT INTO login_security_ips (
          ip_address, failed_attempts, is_permanent, lock_reason, updated_at
        ) VALUES (
          ${ip}, 9, TRUE, 'Manually blocked by Founder', NOW()
        )
        ON CONFLICT (ip_address) DO UPDATE SET
          is_permanent = TRUE,
          lock_reason = 'Manually blocked by Founder',
          updated_at = NOW();
      `;

      return NextResponse.json({
        success: true,
        message: `IP ${ip} has been permanently blocked by Founder`,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action. Use 'unblock' or 'block'" }, { status: 400 });
  } catch (error: any) {
    console.error("Error managing blocked IP:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
