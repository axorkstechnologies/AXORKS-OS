import { NextRequest, NextResponse } from "next/server";
import { getLeadsAsync, createLeadAsync } from "@/lib/business-repository";
import { authenticateRequest } from "@/lib/server-auth";
import { isFounderOrAdmin } from "@/lib/user-repository";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const isFounder = Boolean(
      user &&
        (isFounderOrAdmin(user.role) ||
          user.role === "Founder" ||
          user.email === "mujahidaryan222149@gmail.com" ||
          user.email === "muhammad.mujahid@axorks.com")
    );

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const verifiedOnly = searchParams.get("verified_only") === "true";
    const verificationStatus = searchParams.get("verification_status") || undefined;

    // Fetch leads respecting lead exclusivity:
    // Non-founders only see uncontacted leads + leads they have personally contacted/been assigned
    const leads = await getLeadsAsync({
      userId: user?.id,
      isFounder,
      search,
      status,
      verifiedOnly,
      verificationStatus,
    });

    return NextResponse.json({
      success: true,
      data: leads,
      items: leads,
      total: leads.length,
      page: 1,
      per_page: 100,
    });
  } catch (error: any) {
    console.error("Error retrieving leads:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();

    const newLead = await createLeadAsync(body);

    return NextResponse.json({
      success: true,
      data: newLead,
    });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { errors: [{ message: error.message || "Failed to create lead" }] },
      { status: 500 }
    );
  }
}
