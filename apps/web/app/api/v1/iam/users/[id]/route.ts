import { NextRequest, NextResponse } from "next/server";
import { findUserById, updateUser } from "@/lib/user-repository";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const authHeader = req.headers.get("authorization");
    const backendRes = await fetch(`${API_BASE_URL}/api/v1/iam/users/${id}`, {
      headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Fallback
  }

  const user = findUserById(id);

  if (!user) {
    return NextResponse.json(
      { errors: [{ message: "Employee user not found" }] },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: {
      id: user.id,
      organization_id: user.organization_id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      display_name: user.display_name,
      employee_id: user.employee_id,
      phone: user.phone,
      cnic: user.cnic,
      department: user.department,
      designation: user.designation,
      joining_date: user.joining_date,
      employment_type: user.employment_type,
      role: user.role,
      permissions: user.permissions,
      status: user.status,
      avatar_url: user.avatar_url,
      last_login_at: user.last_login_at,
      last_login_ip: user.last_login_ip,
      last_login_browser: user.last_login_browser,
      last_login_device: user.last_login_device,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();

    try {
      const authHeader = req.headers.get("authorization");
      const backendRes = await fetch(`${API_BASE_URL}/api/v1/iam/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch (err) {
      // Fallback
    }

    const updated = updateUser(id, body);

    if (!updated) {
      return NextResponse.json(
        { errors: [{ message: "Employee user not found" }] },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id,
        ...body,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to update user" }] },
      { status: 500 }
    );
  }
}
