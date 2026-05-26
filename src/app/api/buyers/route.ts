import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all Buyers with optional deep global search query parameter 'q'
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (q) {
      // Perform deep relational search across Buyers, Sales Orders, and CRM Chat Messages
      const buyers = await db.buyer.findMany({
        where: {
          OR: [
            { business_name: { contains: q } },
            { full_name: { contains: q } },
            { mobile: { contains: q } },
            { gst_number: { contains: q } },
            { city: { contains: q } },
            { state: { contains: q } },
            {
              sales_orders: {
                some: {
                  OR: [
                    { order_id: { contains: q } },
                    { awb_number: { contains: q } },
                    { lr_number: { contains: q } }
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
                        content: { contains: q }
                      }
                    }
                  }
                }
              }
            }
          ]
        },
        orderBy: { registered_on: "desc" }
      });

      return NextResponse.json(buyers);
    }

    // Default: Return all buyers ordered by registered date
    const buyers = await db.buyer.findMany({
      orderBy: { registered_on: "desc" }
    });

    return NextResponse.json(buyers);
  } catch (error) {
    console.error("Fetch Buyers Error: ", error);
    return NextResponse.json({ error: "Failed to fetch B2B buyers." }, { status: 500 });
  }
}
