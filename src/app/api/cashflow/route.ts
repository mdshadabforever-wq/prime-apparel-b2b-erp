import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all Cash Flow Ledger logs
export async function GET() {
  try {
    const logs = await db.cashFlow.findMany({
      orderBy: { date: "desc" }
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
