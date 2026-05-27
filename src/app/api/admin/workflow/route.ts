import { NextResponse } from "next/server";
import { requireStaffRole } from "@/lib/api-auth";
import { transitionStatus } from "@/lib/workflow";

export async function POST(request: Request) {
  try {
    let caller;
    try { caller = await requireStaffRole(request); } catch (r) { return r as NextResponse; }
    const body = await request.json();
    const { entityType, entityId, newStatus, operatorName, comment } = body;

    if (!entityType || !entityId || !newStatus || !operatorName) {
      return NextResponse.json(
        { error: "Missing required fields: entityType, entityId, newStatus, operatorName" },
        { status: 400 }
      );
    }

    if (!["product", "lead", "order", "payment"].includes(entityType)) {
      return NextResponse.json(
        { error: "Invalid entityType. Must be product, lead, order, or payment." },
        { status: 400 }
      );
    }

    const result = await transitionStatus(
      entityType,
      entityId,
      newStatus,
      operatorName,
      comment || ""
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("API workflow error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to trigger workflow transition" },
      { status: 500 }
    );
  }
}
