import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthTokenFromHeader, verifyToken } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = getAuthTokenFromHeader(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access. No session token." }, { status: 401 });
    }
    const caller = verifyToken(token);
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "FOUNDER")) {
      return NextResponse.json({ error: "Access denied. Founder or Admin privileges required." }, { status: 403 });
    }

    // Fetch latest administrative audit logs
    const auditLogs = await db.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100 // Last 100 items for high performance and token density management
    });

    return NextResponse.json({ success: true, auditLogs });
  } catch (error: any) {
    console.error("GET audit logs failed: ", error);
    return NextResponse.json({ error: "Failed to load audit logs." }, { status: 500 });
  }
}
