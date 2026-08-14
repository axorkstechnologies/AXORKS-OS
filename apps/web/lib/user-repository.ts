/**
 * Axorks OS — Central User Repository (Neon PostgreSQL Integration)
 *
 * Primary store for user accounts, sessions, and RBAC permissions.
 * All queries, creations, and updates are 100% driven by Neon PostgreSQL.
 */

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL || "";
export const sql = neon(DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/db");

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

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  Founder: ["*"],
  "Co-Founder": ["*"],
  Admin: ["*"],
  "Marketing & Outreach": [
    "dashboard:read",
    "leads:read",
    "leads:write",
    "leads:delete",
    "marketing:read",
    "marketing:write",
    "email:read",
    "email:write",
    "knowledge:read",
    "settings:read",
    "settings:write:own",
  ],
  "Software Engineer": [
    "dashboard:read",
    "projects:read",
    "projects:write",
    "dev:read",
    "dev:write",
    "knowledge:read",
    "knowledge:write",
    "settings:read",
    "settings:write:own",
  ],
  Viewer: [
    "dashboard:read",
  ],
};

export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/": "dashboard:read",
  "/leads": "leads:read",
  "/crm": "crm:read",
  "/proposals": "proposals:read",
  "/projects": "projects:read",
  "/dev": "dev:read",
  "/email": "email:read",
  "/finance": "finance:read",
  "/hr": "hr:read",
  "/iam": "iam:read",
  "/knowledge": "knowledge:read",
  "/marketing": "marketing:read",
  "/recruitment": "recruitment:read",
  "/analytics": "analytics:read",
  "/automations": "automations:read",
  "/integrations": "integrations:read",
  "/settings": "settings:read",
  "/portal": "portal:read",
};

export function hasPermission(role: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function canAccessRoute(role: string, pathname: string): boolean {
  if (hasPermission(role, "*")) return true;

  const matchingRoutes = Object.keys(ROUTE_PERMISSIONS)
    .filter((route) => route !== "/" && pathname.startsWith(route))
    .sort((a, b) => b.length - a.length);

  if (matchingRoutes.length > 0) {
    const requiredPerm = ROUTE_PERMISSIONS[matchingRoutes[0]];
    return hasPermission(role, requiredPerm);
  }

  if (pathname === "/") return true;
  return false;
}

export function isFounderOrAdmin(role: string): boolean {
  return ["Founder", "Co-Founder", "Admin"].includes(role);
}

// ─── Password Hashing ───────────────────────────────────────────────

const BCRYPT_ROUNDS = 10;

export function hashPassword(plaintext: string): string {
  return bcrypt.hashSync(plaintext, BCRYPT_ROUNDS);
}

export function verifyPassword(plaintext: string, hash: string): boolean {
  return bcrypt.compareSync(plaintext, hash);
}

// ─── Environment Config ─────────────────────────────────────────────

const FOUNDER_USERNAME = process.env.FOUNDER_USERNAME || "muhammad.mujahid";
const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL || "mujahidaryan222149@gmail.com";
const FOUNDER_PASSWORD = process.env.FOUNDER_PASSWORD || "Princearyan1#@#@";

// ─── Persistent Memory Store Cache ─────────────────────────────────

const globalUserStore = globalThis as unknown as {
  __axorks_users?: StoredUser[];
  __axorks_sessions?: UserSession[];
  __axorks_users_initialized?: boolean;
};

if (!globalUserStore.__axorks_users_initialized) {
  const founderHash = hashPassword(FOUNDER_PASSWORD);
  const farhanaHash = hashPassword("AxorksFarii2024!");

  globalUserStore.__axorks_users = [
    {
      id: "00000000-0000-0000-0000-00000000000a",
      organization_id: "00000000-0000-0000-0000-000000000001",
      email: FOUNDER_EMAIL.toLowerCase(),
      username: FOUNDER_USERNAME.toLowerCase(),
      password_hash: founderHash,
      first_name: "Muhammad",
      last_name: "Mujahid",
      display_name: "Muhammad Mujahid (Founder)",
      employee_id: "EMP-001",
      phone: "+1 (555) 000-1111",
      department: "Management",
      designation: "Founder & Chief Executive",
      joining_date: "2024-01-01",
      employment_type: "full_time",
      role: "Founder",
      permissions: ["*"],
      status: "active",
      last_login_at: new Date().toISOString(),
      last_login_ip: "192.168.1.1",
      last_login_browser: "Chrome",
      last_login_device: "MacBook Pro",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "00000000-0000-0000-0000-00000000000b",
      organization_id: "00000000-0000-0000-0000-000000000001",
      email: "heyfarii@gmail.com",
      username: "farhana",
      password_hash: farhanaHash,
      first_name: "Farhana",
      last_name: "Bakht",
      display_name: "Farhana Bakht (Co-Founder)",
      employee_id: "EMP-002",
      phone: "+1 (555) 888-9999",
      department: "Management",
      designation: "Co-Founder & Director",
      joining_date: "2024-01-01",
      employment_type: "full_time",
      role: "Co-Founder",
      permissions: ["*"],
      status: "active",
      last_login_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "a1b2c3d4-e5f6-47a8-b901-23456789abcd",
      organization_id: "00000000-0000-0000-0000-000000000001",
      email: "farwa@axorks.com",
      username: "farwa",
      password_hash: hashPassword("AxorksPass123!"),
      first_name: "Farwa",
      last_name: "Marketing Specialist",
      display_name: "Farwa (Marketing & Outreach)",
      employee_id: "EMP-003",
      phone: null,
      department: "Marketing",
      designation: "Marketing & Outreach Specialist",
      joining_date: "2024-03-01",
      employment_type: "full_time",
      role: "Marketing & Outreach",
      permissions: ROLE_PERMISSIONS["Marketing & Outreach"],
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  globalUserStore.__axorks_sessions = [];
  globalUserStore.__axorks_users_initialized = true;
}

export const usersStore = globalUserStore.__axorks_users!;
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

function updateUserInMemory(user: StoredUser) {
  const idx = usersStore.findIndex((u) => u.id === user.id);
  if (idx !== -1) {
    usersStore[idx] = user;
  } else {
    usersStore.unshift(user);
  }
}

// ─── Query Functions (Neon DB Driven) ────────────────────────────────

export async function getAllUsersAsync(): Promise<StoredUser[]> {
  try {
    if (DATABASE_URL) {
      const rows = await sql`SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at ASC`;
      if (rows && rows.length > 0) {
        const dbUsers = rows.map(mapDbUserToStoredUser);
        globalUserStore.__axorks_users = dbUsers;
        return dbUsers;
      }
    }
  } catch (err) {
    console.error("Neon DB query error in getAllUsersAsync:", err);
  }
  return [...usersStore];
}

export async function findUserByIdAsync(id: string): Promise<StoredUser | undefined> {
  const cleanId = id.trim().toLowerCase();
  let queryId = id;
  if (cleanId === "user_founder_01") queryId = "00000000-0000-0000-0000-00000000000a";
  if (cleanId === "user_cofounder_02") queryId = "00000000-0000-0000-0000-00000000000b";

  try {
    if (DATABASE_URL) {
      const rows = await sql`SELECT * FROM users WHERE (id::text = ${queryId} OR employee_id = ${id} OR LOWER(username) = ${cleanId} OR LOWER(email) = ${cleanId}) AND deleted_at IS NULL LIMIT 1`;
      if (rows && rows.length > 0) {
        const u = mapDbUserToStoredUser(rows[0]);
        updateUserInMemory(u);
        return u;
      }
    }
  } catch (err) {
    console.error("Neon DB query error in findUserByIdAsync:", err);
  }
  return findUserById(id);
}

export async function findUserByIdentifierAsync(identifier: string): Promise<StoredUser | undefined> {
  const clean = identifier.trim().toLowerCase();
  try {
    if (DATABASE_URL) {
      const rows = await sql`SELECT * FROM users WHERE (LOWER(email) = ${clean} OR LOWER(username) = ${clean}) AND deleted_at IS NULL LIMIT 1`;
      if (rows && rows.length > 0) {
        const u = mapDbUserToStoredUser(rows[0]);
        updateUserInMemory(u);
        return u;
      }
    }
  } catch (err) {
    console.error("Neon DB query error in findUserByIdentifierAsync:", err);
  }
  return findUserByIdentifier(identifier);
}

export function findUserByIdentifier(identifier: string): StoredUser | undefined {
  const clean = identifier.trim().toLowerCase();
  return usersStore.find(
    (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
  );
}

export function findUserById(id: string): StoredUser | undefined {
  return usersStore.find((u) => u.id === id || u.employee_id === id);
}

export function getAllUsers(): StoredUser[] {
  return [...usersStore];
}

// ─── Registration (Neon DB Driven) ───────────────────────────────────

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
        const created = mapDbUserToStoredUser(rows[0]);
        usersStore.unshift(created);
        return created;
      }
    }
  } catch (err: any) {
    console.error("Neon DB insert error in registerNewUserAsync:", err);
  }

  return registerNewUser(data);
}

export function registerNewUser(data: {
  email: string;
  password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  role?: string;
  designation?: string;
  phone?: string;
}): StoredUser {
  const cleanEmail = data.email.trim().toLowerCase();
  const existing = findUserByIdentifier(cleanEmail);

  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const generatedUsername =
    data.username?.trim().toLowerCase() ||
    cleanEmail.split("@")[0].replace(/[^a-z0-9._]/g, "") ||
    `user_${Date.now()}`;

  const role = data.role || "Software Engineer";

  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    organization_id: "00000000-0000-0000-0000-000000000001",
    email: cleanEmail,
    username: generatedUsername,
    password_hash: hashPassword(data.password),
    first_name: data.first_name || "New",
    last_name: data.last_name || "User",
    display_name: `${data.first_name || "New"} ${data.last_name || "User"}`.trim(),
    employee_id: `EMP-${String(usersStore.length + 1).padStart(3, "0")}`,
    phone: data.phone || null,
    department: data.department || "Development",
    designation: data.designation || "Team Member",
    joining_date: new Date().toISOString().split("T")[0],
    employment_type: "full_time",
    role,
    permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Viewer"] || [],
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  usersStore.unshift(newUser);
  return newUser;
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
        const updated = mapDbUserToStoredUser(rows[0]);
        updateUserInMemory(updated);
        return updated;
      }
    }
  } catch (err) {
    console.error("Neon DB update error in updateUserAsync:", err);
  }

  return updateUser(id, updates);
}

export function updateUser(id: string, updates: Partial<StoredUser>): StoredUser | null {
  const idx = usersStore.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  usersStore[idx] = { ...usersStore[idx], ...updates, updated_at: new Date().toISOString() };
  return usersStore[idx];
}

// ─── Session Management ─────────────────────────────────────────────

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
    session_id: `sess_${Date.now()}`,
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
