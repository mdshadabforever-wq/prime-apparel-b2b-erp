import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkOrderFeasibility, reserveInventory } from "@/lib/inventory";

// GET: List all Sales Orders with Buyer relation details
export async function GET() {
  try {
    const orders = await db.salesOrder.findMany({
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
  try {
    const { buyerId, items, paymentTerms, notes, createdBy } = await request.json();

    if (!buyerId || !items || !Array.isArray(items) || items.length === 0 || !paymentTerms) {
      return NextResponse.json(
        { error: "Zaroori details (Buyer ID, items array, payment terms) miss hain." },
        { status: 400 }
      );
    }

    // 1. Feasibility check (stock counts, credit limit calculations)
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

    // 3. Reserve inventory stock counts
    await reserveInventory(items);

    // 4. Create the Sales Order
    const newOrder = await db.salesOrder.create({
      data: {
        order_id: orderId,
        buyer_id: Number(buyerId),
        items: JSON.stringify(items),
        total_qty: items.reduce((s, i) => s + i.qty, 0),
        subtotal_amount: check.subtotal,
        discount_amount: check.subtotal - check.finalAmount,
        final_amount: check.finalAmount,
        gst_amount: check.gstAmount,
        invoice_amount: check.invoiceAmount,
        payment_terms: paymentTerms,
        payment_status: paymentTerms === "advance" ? "paid" : "pending", // if advance payment, assume paid on creation (or pending verification)
        payment_received_amount: paymentTerms === "advance" ? check.invoiceAmount : 0,
        payment_received_date: paymentTerms === "advance" ? new Date() : null,
        order_status: "confirmed",
        created_by: createdBy || "Staff Operator",
        notes: notes || null,
        invoice_type: invoiceType,
        due_date: dueDate,
        terms_accepted: true
      }
    });

    // 5. If pre-paid, record direct CashFlow income transaction
    if (paymentTerms === "advance") {
      await db.cashFlow.create({
        data: {
          type: "income",
          category: "order_payment",
          description: `Advance payment for sales order ${orderId}`,
          amount: check.invoiceAmount,
          sales_order_id: orderId,
          created_by: createdBy || "Staff Operator"
        }
      });
    }

    // 6. Log dynamic dashboard notification
    await db.notification.create({
      data: {
        type: "order_received",
        message: `🎉 New manual Order confirmed! Order ID: ${orderId}, Invoice: ₹${check.invoiceAmount}`,
        linked_to_id: orderId,
        status: "unread",
        for_role: "INVENTORY"
      }
    });

    // Increment Buyer order counters
    await db.buyer.update({
      where: { buyer_id: Number(buyerId) },
      data: {
        total_orders_count: { increment: 1 },
        total_orders_value: { increment: check.invoiceAmount },
        last_order_date: new Date()
      }
    });

    return NextResponse.json({ success: true, orderId: newOrder.order_id });
  } catch (error) {
    console.error("Create Order Error: ", error);
    return NextResponse.json({ error: "Failed to create sales order." }, { status: 500 });
  }
}
