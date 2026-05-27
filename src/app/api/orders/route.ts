import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkOrderFeasibility, OrderItemInput } from "@/lib/inventory";
import { getAuthTokenFromHeader, verifyToken } from "@/lib/auth";
export const dynamic = "force-dynamic";

// GET: List all Sales Orders with Buyer relation details and dynamic database filters
export async function GET(request: Request) {
  const tokenHeader = request.headers.get('cookie');
  const authToken = getAuthTokenFromHeader(tokenHeader);
  if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = verifyToken(authToken);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const dateFilter = searchParams.get("dateFilter") || "all";
    const startDateStr = searchParams.get("startDate") || "";
    const endDateStr = searchParams.get("endDate") || "";
    const statusFilter = searchParams.get("statusFilter") || "all";
    const paymentFilter = searchParams.get("paymentFilter") || "all";

    const where: any = {};

    // 1. Text Search Filter (Order ID, buyer business name, buyer full name)
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { order_id: { contains: q, mode: "insensitive" } },
        {
          buyer: {
            OR: [
              { business_name: { contains: q, mode: "insensitive" } },
              { full_name: { contains: q, mode: "insensitive" } }
            ]
          }
        }
      ];
    }

    // 2. Status Filters
    if (statusFilter !== "all") {
      where.order_status = statusFilter;
    }
    if (paymentFilter !== "all") {
      where.payment_status = paymentFilter;
    }

    // 3. Date Filters (Day-wise, Week-wise, Custom date ranges)
    const now = new Date();
    if (dateFilter === "today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      where.order_date = {
        gte: startOfToday,
        lte: endOfToday
      };
    } else if (dateFilter === "week") {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - 7);
      where.order_date = {
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
        where.order_date = dateCond;
      }
    }

    const orders = await db.salesOrder.findMany({
      where,
      include: { buyer: true },
      orderBy: { order_date: "desc" }
    });

    // Parse items JSON strings
    const serializedOrders = orders.map((o) => ({
      ...o,
      items: JSON.parse(o.items || "[]")
    }));

    return NextResponse.json(serializedOrders);
  } catch (error) {
    console.error("Fetch Orders Error: ", error);
    return NextResponse.json({ error: "Failed to fetch sales orders." }, { status: 500 });
  }
}

// POST: Create manual Sales Order (from admin workspace)
export async function POST(request: Request) {
  const tokenHeader = request.headers.get('cookie');
  const authToken = getAuthTokenFromHeader(tokenHeader);
  if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = verifyToken(authToken);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  try {
    const { buyerId, items, paymentTerms, notes, createdBy, depositAmount } = await request.json();

    if (!buyerId || !items || !Array.isArray(items) || items.length === 0 || !paymentTerms) {
      return NextResponse.json(
        { error: "Zaroori details (Buyer ID, items array, payment terms) miss hain." },
        { status: 400 }
      );
    }

    // 1. Feasibility check (stock counts, credit limit calculations) — runs BEFORE transaction
    const check = await checkOrderFeasibility(Number(buyerId), items, paymentTerms);
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 403 });
    }

    // Retrieve buyer for due date & B2B/B2C classification
    const buyer = await db.buyer.findUnique({
      where: { buyer_id: Number(buyerId) }
    });
    if (!buyer) {
      return NextResponse.json({ error: "Buyer account system mein nahi mila." }, { status: 404 });
    }

    // Calculate due date (date + credit period)
    const creditDays = buyer.credit_days || 0;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + creditDays);

    // Determine invoice type
    const isB2B = buyer.buyer_type === "GST" && !!buyer.gst_number;
    const invoiceType = isB2B ? "B2B" : "B2C";

    // 2. Generate unique order ID in format 20260524-XXX
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await db.salesOrder.count({
      where: { order_id: { startsWith: todayStr } }
    });
    const serial = String(count + 1).padStart(3, "0");
    const orderId = `${todayStr}-${serial}`;

    const initialPaid = paymentTerms === "advance"
      ? check.invoiceAmount
      : (depositAmount ? Math.min(Number(depositAmount), check.invoiceAmount) : 0);

    const paymentStatus = initialPaid === check.invoiceAmount
      ? "paid"
      : (initialPaid > 0 ? "partial" : "pending");

    // 3. ATOMIC TRANSACTION — Reserve inventory, create order, cashflow, notification, update buyer
    const newOrder = await db.$transaction(async (tx) => {
      // 3a. Reserve inventory stock counts
      for (const item of items) {
        await tx.product.update({
          where: { sku_id: item.skuId },
          data: { qty_reserved: { increment: item.qty } }
        });
      }

      // 3b. Create the Sales Order
      const order = await tx.salesOrder.create({
        data: {
          order_id: orderId,
          buyer_id: Number(buyerId),
          items: JSON.stringify(items),
          total_qty: items.reduce((s: number, i: OrderItemInput) => s + i.qty, 0),
          subtotal_amount: check.subtotal,
          discount_amount: check.volumeDiscount + check.prepaidDiscount,
          final_amount: check.taxableAmount,
          gst_amount: check.gstAmount,
          invoice_amount: check.invoiceAmount,
          payment_terms: paymentTerms,
          payment_status: paymentStatus,
          payment_received_amount: initialPaid,
          payment_received_date: initialPaid > 0 ? new Date() : null,
          order_status: "confirmed",
          created_by: createdBy || "Staff Operator",
          notes: notes || null,
          invoice_type: invoiceType,
          due_date: dueDate,
          terms_accepted: true
        }
      });

      // 3c. If paid (fully or partially), record direct CashFlow income transaction
      if (initialPaid > 0) {
        await tx.cashFlow.create({
          data: {
            type: "income",
            category: "order_payment",
            description: initialPaid === check.invoiceAmount
              ? `Full advance payment for sales order ${orderId}`
              : `Partial advance deposit of ₹${initialPaid} for sales order ${orderId}`,
            amount: initialPaid,
            sales_order_id: orderId,
            created_by: createdBy || "Staff Operator"
          }
        });
      }

      // 3d. Log dynamic dashboard notification
      await tx.notification.create({
        data: {
          type: "order_received",
          message: `🎉 New manual Order confirmed! Order ID: ${orderId}, Invoice: ₹${check.invoiceAmount}`,
          linked_to_id: orderId,
          status: "unread",
          for_role: "INVENTORY"
        }
      });

      // 3e. Increment Buyer order counters
      await tx.buyer.update({
        where: { buyer_id: Number(buyerId) },
        data: {
          total_orders_count: { increment: 1 },
          total_orders_value: { increment: check.invoiceAmount },
          last_order_date: new Date()
        }
      });

      return order;
    });

    return NextResponse.json({ success: true, orderId: newOrder.order_id });
  } catch (error) {
    console.error("Create Order Error: ", error);
    return NextResponse.json({ error: "Failed to create sales order." }, { status: 500 });
  }
}

