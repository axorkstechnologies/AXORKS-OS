import { NextRequest, NextResponse } from "next/server";

/**
 * Public registration is permanently disabled.
 * Employee accounts are provisioned exclusively by the Founder through the secure IAM Portal.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      errors: [
        {
          message:
            "Public registration is permanently disabled. Employee accounts are provisioned exclusively by the Founder.",
        },
      ],
    },
    { status: 403 }
  );
}
