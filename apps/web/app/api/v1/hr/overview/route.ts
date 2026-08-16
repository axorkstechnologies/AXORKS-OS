import { NextRequest, NextResponse } from "next/server";
import { getAllUsersAsync } from "@/lib/user-repository";

export async function GET(req: NextRequest) {
  try {
    const users = await getAllUsersAsync();

    const totalEmployees = users.length;
    const activeCount = users.filter((u) => u.status === "active").length;
    const departmentCounts: Record<string, number> = {};

    users.forEach((u) => {
      const dept = u.department || "General";
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    return NextResponse.json({
      data: {
        total_employees: totalEmployees,
        active_employees: activeCount,
        on_leave_today: 0,
        pending_leave_requests: 1,
        department_distribution: departmentCounts,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to load HR overview" }] },
      { status: 500 }
    );
  }
}
