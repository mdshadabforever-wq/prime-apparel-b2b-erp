import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthTokenFromHeader, verifyToken } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = getAuthTokenFromHeader(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access. No session token." }, { status: 401 });
    }
    const caller = verifyToken(token);
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "FOUNDER")) {
      return NextResponse.json({ error: "Access denied. Founder or Admin privileges required." }, { status: 403 });
    }

    const staffId = parseInt(params.id);
    if (isNaN(staffId)) {
      return NextResponse.json({ error: "Invalid Staff ID." }, { status: 400 });
    }

    // Fetch login activities
    const activities = await db.loginActivity.findMany({
      where: { staff_id: staffId },
      orderBy: { timestamp: "desc" },
      take: 50 // Limit to last 50 activities for performance
    });

    return NextResponse.json({ success: true, activities });
  } catch (error: any) {
    console.error("GET user activity failed: ", error);
    return NextResponse.json({ error: "Failed to load login activities." }, { status: 500 });
  }
}
