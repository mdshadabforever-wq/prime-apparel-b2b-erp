import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthTokenFromHeader, verifyToken } from "@/lib/auth";

// GET: Fetch all Leads from SQLite database
export async function GET(request: Request) {
  const tokenHeader = request.headers.get('cookie');
  const authToken = getAuthTokenFromHeader(tokenHeader);
  if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = verifyToken(authToken);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  try {
    const leads = await db.lead.findMany({
      orderBy: { score: "desc" }
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Fetch Leads Error: ", error);
    return NextResponse.json({ error: "Failed to fetch leads profiles." }, { status: 500 });
  }
}
