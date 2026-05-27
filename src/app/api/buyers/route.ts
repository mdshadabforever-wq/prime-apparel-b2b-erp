import { NextResponse } from "next/server";
import { requireStaffRole } from "@/lib/api-auth";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

// GET: Fetch B2B Buyers with dynamic database-level query optimization (filters, search, limits)
export async function GET(request: Request) {
  try {
    let caller;
    try { caller = await requireStaffRole(request, "SALES", "MARKETING", "BUYER_HUNTING"); } catch (r) { return r as NextResponse; }
    
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const city = searchParams.get("city") || "";
    const limit = Number(searchParams.get("limit")) || 50; // Dynamic boundary limit (default 50 to prevent over-fetching)
    const page = Number(searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Account Status filter
    if (status !== "all") {
      where.account_status = status;
    }

    // 2. City filter
    if (city.trim()) {
      where.city = { contains: city.trim(), mode: "insensitive" };
    }

    // 3. Deep Relational Search Filter (Case-insensitive across fields, related orders, crm messages)
    if (q) {
      where.OR = [
        { business_name: { contains: q, mode: "insensitive" } },
        { full_name: { contains: q, mode: "insensitive" } },
        { mobile: { contains: q, mode: "insensitive" } },
        { gst_number: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { state: { contains: q, mode: "insensitive" } },
        {
          sales_orders: {
            some: {
              OR: [
                { order_id: { contains: q, mode: "insensitive" } },
                { awb_number: { contains: q, mode: "insensitive" } },
                { lr_number: { contains: q, mode: "insensitive" } }
              ]
            }
          }
        },
        {
          customer: {
            conversations: {
              some: {
                messages: {
                  some: {
                    content: { contains: q, mode: "insensitive" }
                  }
                }
              }
            }
          }
        }
      ];
    }

    // Fetch matching buyers with pagination and dynamic limits
    const buyers = await db.buyer.findMany({
      where,
      orderBy: { registered_on: "desc" },
      take: limit,
      skip: skip
    });

    return NextResponse.json(buyers);
  } catch (error) {
    console.error("Fetch Buyers Error: ", error);
    return NextResponse.json({ error: "Failed to fetch B2B buyers." }, { status: 500 });
  }
}
