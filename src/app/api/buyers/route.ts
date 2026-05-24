import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all Buyers with order aggregations
export async function GET() {
  try {
    const buyers = await db.buyer.findMany({
      orderBy: { registered_on: "desc" }
    });

    return NextResponse.json(buyers);
  } catch (error) {
    console.error("Fetch Buyers Error: ", error);
    return NextResponse.json({ error: "Failed to fetch B2B buyers." }, { status: 500 });
  }
}
