import { NextResponse } from "next/server";
import { requireStaffRole } from "@/lib/api-auth";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

// GET: Fetch Cash Flow Ledger logs with dynamic queries, search, and dynamic database limits
export async function GET(request: Request) {
  try {
    let caller;
    try { caller = await requireStaffRole(request, "ACCOUNTS"); } catch (r) { return r as NextResponse; }
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const type = searchParams.get("type") || "all";
    const category = searchParams.get("category") || "all";
    const dateFilter = searchParams.get("dateFilter") || "all";
    const startDateStr = searchParams.get("startDate") || "";
    const endDateStr = searchParams.get("endDate") || "";
    const limit = Number(searchParams.get("limit")) || 50; // default 50 records to prevent full DB overhead
    const page = Number(searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Text Search Filter (Description, created_by, case-insensitive)
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { description: { contains: q, mode: "insensitive" } },
        { created_by: { contains: q, mode: "insensitive" } }
      ];
    }

    // 2. Transaction Type Filter
    if (type !== "all") {
      where.type = type;
    }

    // 3. Category Filter
    if (category !== "all") {
      where.category = category;
    }

    // 4. Date Filter
    const now = new Date();
    if (dateFilter === "today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      where.date = {
        gte: startOfToday,
        lte: endOfToday
      };
    } else if (dateFilter === "week") {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - 7);
      where.date = {
        gte: startOfWeek,
        lte: now
      };
    } else if (dateFilter === "custom") {
      const dateCond: any = {};
      if (startDateStr) {
        const start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);
        dateCond.gte = start;
      }
      if (endDateStr) {
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
        dateCond.lte = end;
      }
      if (Object.keys(dateCond).length > 0) {
        where.date = dateCond;
      }
    }

    const logs = await db.cashFlow.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: skip
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Fetch CashFlow Error: ", error);
    return NextResponse.json({ error: "Failed to fetch cash ledger." }, { status: 500 });
  }
}

// POST: Add manual Cash Flow ledger transaction
export async function POST(request: Request) {
  try {
    let caller;
    try { caller = await requireStaffRole(request, "ACCOUNTS"); } catch (r) { return r as NextResponse; }
    const { type, category, amount, description, createdBy } = await request.json();

    if (!type || !category || !amount || !description) {
      return NextResponse.json(
        { error: "Zaroori inputs (Type, Category, Amount, Description) missing hain." },
        { status: 400 }
      );
    }

    const log = await db.cashFlow.create({
      data: {
        type, // income or expense
        category, // order_payment, purchase_cost, freight, salary, rent, marketing, misc
        amount: Number(amount),
        description,
        created_by: createdBy || "Staff Accountant"
      }
    });

    return NextResponse.json({ success: true, entryId: log.entry_id });
  } catch (error) {
    console.error("Record CashFlow Error: ", error);
    return NextResponse.json({ error: "Failed to record transaction details." }, { status: 500 });
  }
}
