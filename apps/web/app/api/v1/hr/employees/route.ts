import { NextRequest, NextResponse } from "next/server";
import { getAllUsersAsync } from "@/lib/user-repository";

export async function GET(req: NextRequest) {
  try {
    const users = await getAllUsersAsync();
    const safeUsers = users.map(({ password_hash, ...u }) => u);
    return NextResponse.json({ data: safeUsers });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to load HR employees" }] },
      { status: 500 }
    );
  }
}
