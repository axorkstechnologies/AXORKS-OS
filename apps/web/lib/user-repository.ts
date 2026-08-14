/**
 * Axorks OS — Central User Repository
 *
 * Primary store for user accounts, sessions, and RBAC permissions.
 * Passwords are hashed with bcryptjs (cost 10).
 */

import bcrypt from "bcryptjs";

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

// ─── Persistent Memory Store Across Serverless Re-evaluations ─────

const globalUserStore = globalThis as unknown as {
  __axorks_users?: StoredUser[];
  __axorks_sessions?: UserSession[];
  __axorks_users_initialized?: boolean;
};

if (!globalUserStore.__axorks_users_initialized) {
  const founderHash = hashPassword(FOUNDER_PASSWORD);
  const farhanaHash = hashPassword("AxorksFarii2024!");
  const amnaHash = hashPassword("AxorksMarketing2024!");

  globalUserStore.__axorks_users = [
    {
      id: "user_founder_01",
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
      // Real Co-Founder Account
      id: "user_cofounder_02",
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
      // Real Marketing & Outreach employee
      id: "user_emp_03",
      organization_id: "00000000-0000-0000-0000-000000000001",
      email: "amna@axorks.com",
      username: "amna",
      password_hash: amnaHash,
      first_name: "Amna",
      last_name: "Khan",
      display_name: "Amna Khan",
      employee_id: "EMP-003",
      phone: "+92 (300) 123-4567",
      department: "Marketing",
      designation: "Marketing & Outreach Specialist",
      joining_date: new Date().toISOString().split("T")[0],
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

// ─── Query Functions ────────────────────────────────────────────────

export function findUserByIdentifier(identifier: string): StoredUser | undefined {
  const clean = identifier.trim().toLowerCase();
  return usersStore.find(
    (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
  );
}

export function findUserById(id: string): StoredUser | undefined {
  return usersStore.find((u) => u.id === id);
}

export function getAllUsers(): StoredUser[] {
  return [...usersStore];
}

// ─── Registration ───────────────────────────────────────────────────

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
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

  if (usersStore.find((u) => u.username === generatedUsername)) {
    throw new ConflictError("Username already taken");
  }

  const role = data.role || "Software Engineer";

  const newUser: StoredUser = {
    id: `user_${Date.now()}`,
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

// ─── User Updates & Suspend Status ─────────────────────────────

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
