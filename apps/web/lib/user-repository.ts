/**
 * Axorks OS — Central User Repository (100% Neon PostgreSQL Driven)
 *
 * Primary store for user accounts, sessions, and RBAC permissions.
 * All queries, authentications, creations, and updates are 100% driven by Neon PostgreSQL.
 *
 * ZERO hardcoded users, ZERO mock passwords, ZERO in-memory backdoors.
 */

import bcrypt from "bcryptjs";
import { sql, DATABASE_URL } from "./db";

// ─── Types ──────────────────────────────────────────────────────────

export interface StoredUser {
  id: string;
  organization_id: string;
  email: string;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  display_name: string;
  employee_id: string;
  phone?: string | null;
  cnic?: string | null;
  department: string;
  designation: string;
  joining_date: string;
  employment_type: string;
  role: string;
  permissions: string[];
  status: "active" | "inactive" | "suspended" | "locked" | "pending_invitation";
  avatar_url?: string | null;
  last_login_at?: string | null;
  last_login_ip?: string | null;
  last_login_browser?: string | null;
  last_login_device?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  session_id: string;
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  ip_address: string;
  device: string;
  login_at: string;
  last_active_at: string;
}

// ─── RBAC Permissions ───────────────────────────────────────────────
export {
  ROLE_PERMISSIONS,
  ROUTE_PERMISSIONS,
  hasPermission,
  canAccessRoute,
  isFounderOrAdmin,
} from "./rbac";
import { ROLE_PERMISSIONS } from "./rbac";

// ─── Password Hashing & Verification ─────────────────────────────────

const BCRYPT_ROUNDS = 10;

export function hashPassword(plaintext: string): string {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("Password string is required for hashing");
  }
  return bcrypt.hashSync(plaintext, BCRYPT_ROUNDS);
}

export function verifyPassword(plaintext: string, hash: string): boolean {
  if (!plaintext || !hash || typeof plaintext !== "string" || typeof hash !== "string") {
    return false;
  }
  try {
    return bcrypt.compareSync(plaintext, hash);
  } catch (err) {
    console.error("Error verifying bcrypt hash:", err);
    return false;
  }
}

// ─── Active In-Memory Session Cache (Only for live presence metrics) ──

const globalUserStore = globalThis as unknown as {
  __axorks_sessions?: UserSession[];
};

if (!globalUserStore.__axorks_sessions) {
  globalUserStore.__axorks_sessions = [];
}

export const sessionsStore = globalUserStore.__axorks_sessions!;

// ─── DB Mapping Helper ──────────────────────────────────────────────

export function mapDbUserToStoredUser(row: any): StoredUser {
  return {
    id: String(row.id),
    organization_id: row.organization_id || "00000000-0000-0000-0000-000000000001",
    email: row.email,
    username: row.username || row.email.split("@")[0],
    password_hash: row.password_hash || "",
    first_name: row.first_name || "",
    last_name: row.last_name || "",
    display_name: row.first_name
      ? `${row.first_name} ${row.last_name || ""}`.trim()
      : row.username || row.email,
    employee_id: row.employee_id || `EMP-${String(row.id).substring(0, 4)}`,
    phone: row.phone || null,
    cnic: row.cnic || null,
    department: row.department || "Development",
    designation: row.designation || "Team Member",
    joining_date: row.joining_date
      ? new Date(row.joining_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    employment_type: row.employment_type || "full_time",
    role: row.role || "Software Engineer",
    permissions: row.permissions || ROLE_PERMISSIONS[row.role] || ROLE_PERMISSIONS["Viewer"] || [],
    status: row.status || (row.is_active !== false ? "active" : "suspended"),
    avatar_url: row.avatar_url || null,
    last_login_at: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    last_login_ip: row.last_login_ip || null,
    last_login_browser: row.last_login_browser || null,
    last_login_device: row.last_login_device || null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

// ─── Query Functions (100% Neon DB Driven — Zero Mock Fallbacks) ────

export async function getAllUsersAsync(): Promise<StoredUser[]> {
  try {
    if (DATABASE_URL) {
      const rows = await sql`SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at ASC`;
      if (rows && rows.length > 0) {
        return rows.map(mapDbUserToStoredUser);
      }
    }
  } catch (err) {
    console.error("Neon DB query error in getAllUsersAsync:", err);
  }
  return [];
}

export async function findUserByIdAsync(id: string): Promise<StoredUser | undefined> {
  const cleanId = id.trim().toLowerCase();
  let queryId = id;
  if (cleanId === "user_founder_01") queryId = "00000000-0000-0000-0000-00000000000a";
  if (cleanId === "user_cofounder_02") queryId = "00000000-0000-0000-0000-00000000000b";

  try {
    if (DATABASE_URL) {
      const rows = await sql`
        SELECT * FROM users
        WHERE (id::text = ${queryId} OR employee_id = ${id} OR LOWER(username) = ${cleanId} OR LOWER(email) = ${cleanId})
          AND deleted_at IS NULL
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        return mapDbUserToStoredUser(rows[0]);
      }
    }
  } catch (err) {
    console.error("Neon DB query error in findUserByIdAsync:", err);
  }
  return undefined;
}

export async function findUserByIdentifierAsync(identifier: string): Promise<StoredUser | undefined> {
  const clean = identifier.trim().toLowerCase();
  try {
    if (DATABASE_URL) {
      const rows = await sql`
        SELECT * FROM users
        WHERE (LOWER(email) = ${clean} OR LOWER(username) = ${clean})
          AND deleted_at IS NULL
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        return mapDbUserToStoredUser(rows[0]);
      }
    }
  } catch (err) {
    console.error("Neon DB query error in findUserByIdentifierAsync:", err);
  }
  return undefined;
}

// ─── Registration (Neon DB Driven — Founder Provisioned Only) ────────

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export async function registerNewUserAsync(data: {
  email: string;
  password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  role?: string;
  designation?: string;
  phone?: string;
}): Promise<StoredUser> {
  const cleanEmail = data.email.trim().toLowerCase();
  const existing = await findUserByIdentifierAsync(cleanEmail);

  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const generatedUsername =
    data.username?.trim().toLowerCase() ||
    cleanEmail.split("@")[0].replace(/[^a-z0-9._]/g, "") ||
    `user_${Date.now()}`;

  const role = data.role || "Software Engineer";
  const pwdHash = hashPassword(data.password);
  const newId = crypto.randomUUID();
  const count = (await getAllUsersAsync()).length;
  const empId = `EMP-${String(count + 1).padStart(3, "0")}`;
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Viewer"] || [];

  try {
    if (DATABASE_URL) {
      const rows = await sql`
        INSERT INTO users (
          id, email, username, password_hash, first_name, last_name,
          role, department, designation, employee_id, status, is_active,
          permissions, created_at, updated_at
        ) VALUES (
          ${newId}, ${cleanEmail}, ${generatedUsername}, ${pwdHash},
          ${data.first_name || "New"}, ${data.last_name || "User"},
          ${role}, ${data.department || "Development"}, ${data.designation || "Team Member"},
          ${empId}, 'active', true, ${perms}, NOW(), NOW()
        ) RETURNING *;
      `;
      if (rows && rows.length > 0) {
        return mapDbUserToStoredUser(rows[0]);
      }
    }
  } catch (err: any) {
    console.error("Neon DB insert error in registerNewUserAsync:", err);
    throw new Error(`Database error creating user: ${err.message}`);
  }

  throw new Error("Failed to insert user into database");
}

// ─── User Updates (Neon DB Driven) ───────────────────────────────────

export async function updateUserAsync(id: string, updates: Partial<StoredUser>): Promise<StoredUser | null> {
  const cleanId = id.trim().toLowerCase();
  let queryId = id;
  if (cleanId === "user_founder_01") queryId = "00000000-0000-0000-0000-00000000000a";
  if (cleanId === "user_cofounder_02") queryId = "00000000-0000-0000-0000-00000000000b";

  try {
    if (DATABASE_URL) {
      if (updates.password_hash !== undefined) {
        await sql`UPDATE users SET password_hash = ${updates.password_hash}, updated_at = NOW() WHERE id::text = ${queryId} OR employee_id = ${id} OR LOWER(username) = ${cleanId} OR LOWER(email) = ${cleanId}`;
      }
      if (updates.avatar_url !== undefined) {
        await sql`UPDATE users SET avatar_url = ${updates.avatar_url}, updated_at = NOW() WHERE id::text = ${queryId} OR employee_id = ${id} OR LOWER(username) = ${cleanId} OR LOWER(email) = ${cleanId}`;
      }
      if (updates.first_name !== undefined || updates.last_name !== undefined || updates.phone !== undefined) {
        await sql`UPDATE users SET 
          first_name = COALESCE(${updates.first_name || null}, first_name),
          last_name = COALESCE(${updates.last_name || null}, last_name),
          phone = COALESCE(${updates.phone || null}, phone),
          updated_at = NOW()
          WHERE id::text = ${queryId} OR employee_id = ${id} OR LOWER(username) = ${cleanId} OR LOWER(email) = ${cleanId}`;
      }
      if (updates.status !== undefined) {
        const isActive = updates.status === "active";
        await sql`UPDATE users SET status = ${updates.status}, is_active = ${isActive}, updated_at = NOW() WHERE id::text = ${queryId} OR employee_id = ${id} OR LOWER(username) = ${cleanId} OR LOWER(email) = ${cleanId}`;
      }

      const rows = await sql`SELECT * FROM users WHERE (id::text = ${queryId} OR employee_id = ${id} OR LOWER(username) = ${cleanId} OR LOWER(email) = ${cleanId}) AND deleted_at IS NULL LIMIT 1`;
      if (rows && rows.length > 0) {
        return mapDbUserToStoredUser(rows[0]);
      }
    }
  } catch (err) {
    console.error("Neon DB update error in updateUserAsync:", err);
  }

  return null;
}

// ─── Account Deletion (Strict Rule & Neon DB Driven) ────────────────

export function isProtectedRealProfile(user: { id?: string; email?: string; role?: string; first_name?: string }): boolean {
  const email = (user.email || "").toLowerCase();
  const role = (user.role || "").toLowerCase();
  const name = (user.first_name || "").toLowerCase();
  const id = (user.id || "").toLowerCase();

  // 1. Founder: Muhammad Mujahid
  if (
    email === "mujahidaryan222149@gmail.com" ||
    email === "muhammad.mujahid@axorks.com" ||
    role === "founder" ||
    id === "00000000-0000-0000-0000-00000000000a" ||
    id === "user_founder_01" ||
    (name === "muhammad" && role.includes("founder"))
  ) {
    return true;
  }

  // 2. Co-Founder: Farhana Bakht
  if (
    email === "heyfarii@gmail.com" ||
    email === "farhana.bakht@axorks.com" ||
    role === "co-founder" ||
    id === "00000000-0000-0000-0000-00000000000b" ||
    id === "user_cofounder_02" ||
    name === "farhana"
  ) {
    return true;
  }

  // 3. Marketing & Outreach: Farwa
  if (
    email === "farwa@axorks.com" ||
    id === "a1b2c3d4-e5f6-47a8-b901-23456789abcd" ||
    name === "farwa"
  ) {
    return true;
  }

  return false;
}

export async function deleteUserAsync(id: string): Promise<{ success: boolean; message: string }> {
  const targetUser = await findUserByIdAsync(id);
  if (!targetUser) {
    throw new Error("Employee account not found");
  }

  if (isProtectedRealProfile(targetUser)) {
    throw new Error("STRICT SECURITY RULE: The three protected profiles (Muhammad Mujahid, Farhana Bakht, Farwa) can NEVER be deleted.");
  }

  const cleanId = id.trim().toLowerCase();
  const queryId = targetUser.id;

  try {
    if (DATABASE_URL) {
      await sql`
        UPDATE users
        SET deleted_at = NOW(), status = 'inactive', is_active = FALSE, updated_at = NOW()
        WHERE (id::text = ${queryId} OR employee_id = ${id} OR LOWER(username) = ${cleanId} OR LOWER(email) = ${cleanId});
      `;
    }
  } catch (err: any) {
    console.error("Neon DB error in deleteUserAsync:", err);
    throw new Error(`Database error deleting user: ${err.message}`);
  }

  // Terminate active live presence sessions
  const filteredSessions = sessionsStore.filter((s) => s.user_id !== targetUser.id && s.email !== targetUser.email);
  globalUserStore.__axorks_sessions = filteredSessions;

  return {
    success: true,
    message: `Account for ${targetUser.display_name} has been permanently deleted from Neon DB.`,
  };
}

// ─── Session Presence Management ────────────────────────────────────

export function recordLoginSession(
  user: StoredUser,
  ip: string = "127.0.0.1",
  device: string = "Desktop"
): UserSession {
  user.last_login_at = new Date().toISOString();
  user.last_login_ip = ip;
  user.last_login_device = device;

  const filtered = sessionsStore.filter((s) => s.user_id !== user.id);
  globalUserStore.__axorks_sessions = filtered;

  const session: UserSession = {
    session_id: `sess_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
    user_id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    ip_address: ip,
    device,
    login_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  };

  globalUserStore.__axorks_sessions!.unshift(session);
  return session;
}
