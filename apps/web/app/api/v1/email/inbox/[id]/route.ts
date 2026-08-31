import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceEmailByIdAsync, updateWorkspaceEmailAsync } from "@/lib/business-repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const email = await getWorkspaceEmailByIdAsync(id);

    if (!email) {
      return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: email });
  } catch (error: any) {
    console.error("Error fetching email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch email" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateWorkspaceEmailAsync(id, {
      is_read: body.is_read,
      is_starred: body.is_starred,
      converted_to_client: body.converted_to_client,
      status: body.status,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Failed to update email" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Email updated successfully" });
  } catch (error: any) {
    console.error("Error updating email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update email" },
      { status: 500 }
    );
  }
}
