import { NextRequest, NextResponse } from "next/server";
import { getInvoicesAsync, createInvoiceAsync } from "@/lib/business-repository";

export async function GET(req: NextRequest) {
  const invoices = await getInvoicesAsync();
  return NextResponse.json({
    data: invoices,
    items: invoices,
    total: invoices.length,
    page: 1,
    per_page: 100,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newInvoice = await createInvoiceAsync(body);
    return NextResponse.json({ data: newInvoice });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to create invoice" }] },
      { status: 500 }
    );
  }
}
