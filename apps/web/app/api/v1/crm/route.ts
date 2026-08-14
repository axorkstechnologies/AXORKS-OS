import { NextRequest, NextResponse } from "next/server";
import { getCRMContactsAsync, createCRMContactAsync } from "@/lib/business-repository";

export async function GET(req: NextRequest) {
  const contacts = await getCRMContactsAsync();
  return NextResponse.json({
    data: contacts,
    items: contacts,
    total: contacts.length,
    page: 1,
    per_page: 100,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newContact = await createCRMContactAsync(body);
    return NextResponse.json({ data: newContact });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to create CRM contact" }] },
      { status: 500 }
    );
  }
}
