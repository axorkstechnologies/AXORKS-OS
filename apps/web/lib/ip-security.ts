/**
 * Axorks OS — IP-Based Brute Force Protection & Security Sentinel
 *
 * Enforces IP lockouts:
 * - 3 failed attempts -> 10 minutes lockout
 * - 6 failed attempts -> 45 minutes lockout
 * - 9+ failed attempts -> Permanent block until Founder unblocks
 * - Real-time Founder notification on block/lock
 */

import { sql, DATABASE_URL } from "./db";

const FOUNDER_ID = "00000000-0000-0000-0000-00000000000a";

export interface IpSecurityStatus {
  allowed: boolean;
  remainingMinutes?: number;
  isPermanent?: boolean;
  reason?: string;
  attempts?: number;
}

export interface BlockedIpRecord {
  id: string;
  ip_address: string;
  failed_attempts: number;
  last_failed_at: string;
  locked_until: string | null;
  is_permanent: boolean;
  lock_reason: string | null;
  last_attempted_identifier: string | null;
  unblocked_by: string | null;
  unblocked_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Checks whether an incoming IP address is allowed to attempt login.
 */
export async function checkIpLoginAllowed(ip: string): Promise<IpSecurityStatus> {
  if (!DATABASE_URL || !ip) return { allowed: true };

  try {
    const rows = await sql`
      SELECT * FROM login_security_ips
      WHERE ip_address = ${ip}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return { allowed: true, attempts: 0 };
    }

    const rec = rows[0];

    // 1. Permanent Block Check
    if (rec.is_permanent) {
      return {
        allowed: false,
        isPermanent: true,
        attempts: rec.failed_attempts,
        reason: "Access Denied: This IP address is permanently blocked due to repeated failed login attempts. Contact the Founder to unblock.",
      };
    }

    // 2. Temporary Lock Check
    if (rec.locked_until) {
      const lockExpiry = new Date(rec.locked_until).getTime();
      const now = Date.now();

      if (lockExpiry > now) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));
        return {
          allowed: false,
          remainingMinutes,
          attempts: rec.failed_attempts,
          reason: `Too many failed login attempts. This IP address is locked for another ${remainingMinutes} minute(s).`,
        };
      }
    }

    return { allowed: true, attempts: rec.failed_attempts || 0 };
  } catch (error) {
    console.error("Error checking IP security status:", error);
    return { allowed: true };
  }
}

/**
 * Records a failed login attempt for an IP address and applies tiered lockouts.
 */
export async function recordFailedLoginAttempt(
  ip: string,
  identifier: string
): Promise<{ attempts: number; lockedUntil: Date | null; isPermanent: boolean; reason: string }> {
  if (!DATABASE_URL || !ip) {
    return { attempts: 1, lockedUntil: null, isPermanent: false, reason: "" };
  }

  try {
    // 1. Fetch current record or create initial
    const existing = await sql`
      SELECT * FROM login_security_ips
      WHERE ip_address = ${ip}
      LIMIT 1;
    `;

    let currentAttempts = 0;
    if (existing && existing.length > 0) {
      currentAttempts = existing[0].failed_attempts || 0;
    }

    const newAttempts = currentAttempts + 1;
    let lockedUntil: Date | null = null;
    let isPermanent = false;
    let lockReason = "";
    let lockType = "";

    // Tier 3: 9+ attempts -> Permanent Block
    if (newAttempts >= 9) {
      isPermanent = true;
      lockedUntil = null;
      lockReason = `Permanently blocked after ${newAttempts} repeated failed login attempts targeting "${identifier}"`;
      lockType = "Permanent Block";
    }
    // Tier 2: 6 attempts -> 45 minutes Lockout
    else if (newAttempts >= 6) {
      lockedUntil = new Date(Date.now() + 45 * 60 * 1000);
      lockReason = `Locked for 45 minutes after ${newAttempts} failed login attempts targeting "${identifier}"`;
      lockType = "45-Minute Lockout";
    }
    // Tier 1: 3 attempts -> 10 minutes Lockout
    else if (newAttempts >= 3) {
      lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
      lockReason = `Locked for 10 minutes after ${newAttempts} failed login attempts targeting "${identifier}"`;
      lockType = "10-Minute Lockout";
    }

    // Upsert security IP record
    await sql`
      INSERT INTO login_security_ips (
        ip_address, failed_attempts, last_failed_at, locked_until,
        is_permanent, lock_reason, last_attempted_identifier, updated_at
      ) VALUES (
        ${ip}, ${newAttempts}, NOW(), ${lockedUntil ? lockedUntil.toISOString() : null},
        ${isPermanent}, ${lockReason || null}, ${identifier}, NOW()
      )
      ON CONFLICT (ip_address) DO UPDATE SET
        failed_attempts = ${newAttempts},
        last_failed_at = NOW(),
        locked_until = ${lockedUntil ? lockedUntil.toISOString() : null},
        is_permanent = ${isPermanent},
        lock_reason = ${lockReason || null},
        last_attempted_identifier = ${identifier},
        updated_at = NOW();
    `;

    // If locked or permanently blocked, notify Founder
    if (lockType) {
      await notifyFounderOfSecurityEvent(ip, newAttempts, lockType, lockReason, identifier);
    }

    return {
      attempts: newAttempts,
      lockedUntil,
      isPermanent,
      reason: lockReason,
    };
  } catch (error) {
    console.error("Error recording failed login attempt:", error);
    return { attempts: 1, lockedUntil: null, isPermanent: false, reason: "" };
  }
}

/**
 * Resets failed attempts after a successful login from an IP address.
 */
export async function recordSuccessfulLogin(ip: string): Promise<void> {
  if (!DATABASE_URL || !ip) return;

  try {
    // Only reset if not permanently blocked
    await sql`
      UPDATE login_security_ips
      SET failed_attempts = 0,
          locked_until = NULL,
          lock_reason = NULL,
          updated_at = NOW()
      WHERE ip_address = ${ip} AND is_permanent = FALSE;
    `;
  } catch (error) {
    console.error("Error resetting IP security status on success:", error);
  }
}

/**
 * Sends a high-priority internal security notification to the Founder.
 */
export async function notifyFounderOfSecurityEvent(
  ip: string,
  attempts: number,
  lockType: string,
  reason: string,
  identifier: string
): Promise<void> {
  try {
    const subject = `🚨 Security Alert: IP ${ip} ${lockType}`;
    const body = `Security Sentinel Alert:
IP Address: ${ip}
Action Taken: ${lockType}
Failed Attempts: ${attempts}
Target Account / Identifier: ${identifier}
Timestamp: ${new Date().toUTCString()}
Details: ${reason}

You can review and unblock this IP from the IAM Security Console.`;

    await sql`
      INSERT INTO internal_messages (
        sender_id, sender_name, sender_role, recipient_id, recipient_name,
        recipient_role, subject, body, body_html, is_read, requires_approval,
        approval_status, created_at, updated_at
      ) VALUES (
        'system_security', 'Axorks Security Sentinel', 'System Security',
        ${FOUNDER_ID}, 'Muhammad Mujahid', 'Founder',
        ${subject}, ${body}, ${`<div style="font-family:sans-serif;color:#1e293b;"><h3 style="color:#e11d48;margin:0 0 8px;">🚨 Security Sentinel Alert</h3><p><strong>IP Address:</strong> <code>${ip}</code></p><p><strong>Status:</strong> <span style="color:#e11d48;font-weight:bold;">${lockType}</span></p><p><strong>Failed Attempts:</strong> ${attempts}</p><p><strong>Targeted Account:</strong> <code>${identifier}</code></p><p><strong>Time:</strong> ${new Date().toUTCString()}</p><p style="margin-top:12px;padding:8px;background:#f1f5f9;border-radius:6px;">${reason}</p></div>`},
        FALSE, FALSE, 'none', NOW(), NOW()
      );
    `;
  } catch (error) {
    console.error("Failed to notify Founder of security event:", error);
  }
}

/**
 * Retrieves all blocked or locked IP addresses for Founder review.
 */
export async function getBlockedIpsAsync(): Promise<BlockedIpRecord[]> {
  if (!DATABASE_URL) return [];

  try {
    const rows = await sql`
      SELECT * FROM login_security_ips
      WHERE is_permanent = TRUE OR (locked_until IS NOT NULL AND locked_until > NOW()) OR failed_attempts >= 3
      ORDER BY updated_at DESC;
    `;

    return rows.map((r: any) => ({
      id: String(r.id),
      ip_address: r.ip_address,
      failed_attempts: Number(r.failed_attempts || 0),
      last_failed_at: r.last_failed_at ? new Date(r.last_failed_at).toISOString() : "",
      locked_until: r.locked_until ? new Date(r.locked_until).toISOString() : null,
      is_permanent: Boolean(r.is_permanent),
      lock_reason: r.lock_reason || null,
      last_attempted_identifier: r.last_attempted_identifier || null,
      unblocked_by: r.unblocked_by || null,
      unblocked_at: r.unblocked_at ? new Date(r.unblocked_at).toISOString() : null,
      created_at: new Date(r.created_at).toISOString(),
      updated_at: new Date(r.updated_at).toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching blocked IPs:", error);
    return [];
  }
}

/**
 * Manually unblocks an IP address (Founder only).
 */
export async function unblockIpAsync(ip: string, unblockedBy: string): Promise<boolean> {
  if (!DATABASE_URL || !ip) return false;

  try {
    await sql`
      UPDATE login_security_ips
      SET is_permanent = FALSE,
          locked_until = NULL,
          failed_attempts = 0,
          lock_reason = 'Manually unblocked by Founder',
          unblocked_by = ${unblockedBy},
          unblocked_at = NOW(),
          updated_at = NOW()
      WHERE ip_address = ${ip};
    `;
    return true;
  } catch (error) {
    console.error("Error unblocking IP:", error);
    return false;
  }
}
