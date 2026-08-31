import { neon } from "@neondatabase/serverless";

export const DATABASE_URL = process.env.DATABASE_URL || "";
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
