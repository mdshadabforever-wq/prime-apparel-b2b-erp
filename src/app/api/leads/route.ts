import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthTokenFromHeader, verifyToken } from "@/lib/auth";
export const dynamic = "force-dynamic";

// GET: Fetch leads with database-level filters, searching, and limits optimization
export async function GET(request: Request) {
  const tokenHeader = request.headers.get('cookie');
  const authToken = getAuthTokenFromHeader(tokenHeader);
  if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = verifyToken(authToken);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const status = searchParams.get("status") || "all";
    const source = searchParams.get("source") || "all";
    const limit = Number(searchParams.get("limit")) || 50; // default 50 records to prevent over-fetching
    const page = Number(searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Text Search Filter (Name, Mobile, City, case-insensitive)
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { mobile: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } }
      ];
    }

    // 2. Status Filter
    if (status !== "all") {
      where.status = status;
    }

    // 3. Source Filter
    if (source !== "all") {
      where.source = source;
    }

    const leads = await db.lead.findMany({
      where,
      orderBy: { score: "desc" },
      take: limit,
      skip: skip
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Fetch Leads Error: ", error);
    return NextResponse.json({ error: "Failed to fetch leads profiles." }, { status: 500 });
  }
}
