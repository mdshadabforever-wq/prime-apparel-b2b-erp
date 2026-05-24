import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all Leads from SQLite database
export async function GET() {
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
