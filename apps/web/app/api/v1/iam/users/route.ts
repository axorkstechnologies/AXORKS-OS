import { NextRequest, NextResponse } from "next/server";
import { getAllUsersAsync, registerNewUserAsync } from "@/lib/user-repository";
import { authenticateRequest } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() || "";
  const statusFilter = searchParams.get("status") || "";
  const roleFilter = searchParams.get("role") || "";

  const caller = await authenticateRequest(req);
  const isCallerFounder =
    caller?.role?.toLowerCase() === "founder" ||
    caller?.email === "mujahidaryan222149@gmail.com" ||
    caller?.email === "muhammad.mujahid@axorks.com";

  let usersList = await getAllUsersAsync();

  if (search) {
    usersList = usersList.filter(
      (u) =>
        u.first_name.toLowerCase().includes(search) ||
        u.last_name.toLowerCase().includes(search) ||
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.department && u.department.toLowerCase().includes(search))
    );
  }
  if (statusFilter) {
    usersList = usersList.filter((u) => u.status === statusFilter);
  }
  if (roleFilter) {
    usersList = usersList.filter((u) => u.role === roleFilter);
  }

  const safeUsers = usersList.map(({ password_hash, ...u }) => {
    if (!isCallerFounder) {
      delete (u as any).last_set_password;
    }
    return u;
  });

  return NextResponse.json({ success: true, data: safeUsers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newUser = await registerNewUserAsync({
      first_name: body.first_name || "New",
      last_name: body.last_name || "Employee",
      username: body.username || (body.first_name || "user").toLowerCase(),
      email: body.email,
      password: body.password || "AxorksPass123!",
      department: body.department || "Development",
      designation: body.designation || "Team Member",
      role: body.role || "Software Engineer",
      phone: body.phone,
    });

    return NextResponse.json({ success: true, data: newUser });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to create user" }] },
      { status: 500 }
    );
  }
}
