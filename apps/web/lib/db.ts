import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
    return process.env.DATABASE_URL.trim();
  }

  const possiblePaths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "..", "..", ".env.local"),
    "d:/AxorksOS/.env.local",
    "d:/AxorksOS/apps/web/.env.local",
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, "utf-8");
        const match = content.match(/DATABASE_URL=(.*)/);
        if (match && match[1]) {
          const val = match[1].trim().replace(/^["']|["']$/g, "");
          if (val) {
            process.env.DATABASE_URL = val;
            return val;
          }
        }
      }
    } catch {}
  }

  return "";
}

export const DATABASE_URL = getDatabaseUrl();
export const sql = neon(DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/db");

export interface DbUser {
  id: string;
  organization_id?: string;
  email: string;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  employee_id: string;
  phone?: string | null;
  cnic?: string | null;
  department: string;
  designation: string;
  joining_date?: string;
  employment_type?: string;
  role: string;
  permissions?: string[];
  status: "active" | "inactive" | "suspended" | "locked" | "pending_invitation";
  avatar_url?: string | null;
  last_login_at?: string | null;
  last_login_ip?: string | null;
  last_login_browser?: string | null;
  last_login_device?: string | null;
  created_at?: string;
  updated_at?: string;
}
