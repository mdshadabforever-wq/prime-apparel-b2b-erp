import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    const { amountReceived, paymentStatus, staffName } = await request.json();

    if (!amountReceived || Number(amountReceived) <= 0 || !paymentStatus) {
      return NextResponse.json(
        { error: "Payment amount aur Status select karna zaroori hai." },
        { status: 400 }
      );
    }

    const order = await db.salesOrder.findUnique({
      where: { order_id: orderId },
      include: { buyer: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order details nahi mili." }, { status: 404 });
    }

    const newReceived = order.payment_received_amount + Number(amountReceived);
    
    // Update order payment status
    const updatedOrder = await db.salesOrder.update({
      where: { order_id: orderId },
      data: {
        payment_status: paymentStatus, // paid, partial, pending
        payment_received_amount: newReceived,
        payment_received_date: new Date()
      }
    });

    // Record CashFlow income log
    await db.cashFlow.create({
      data: {
        type: "income",
        category: "order_payment",
        description: `Payment received for order ${orderId} by staff: ${staffName || "System Operator"}`,
        amount: Number(amountReceived),
        sales_order_id: orderId,
        created_by: staffName || "System Operator"
      }
    });

    // Generate simulated WhatsApp outgoing log
    const waMsg = `✅ Payment Received! Namaste ${order.buyer.full_name},\n\nHame aapke order [ID: ${orderId}] ke liye payment confirm ho gayi hai!\n\n💰 Amount Received: ₹${amountReceived}\n📊 Unpaid Invoice Balance: ₹${order.invoice_amount - newReceived}\n\nThank you for business with Prime Apparel Exports!`;

    await db.whatsAppLog.create({
      data: {
        contact_number: order.buyer.mobile,
        direction: "outgoing",
        message_type: "text",
        message_content: waMsg,
        handled_by: "ai",
        buyer_id: order.buyer_id
      }
    });

    // Create staff notification alert
    await db.notification.create({
      data: {
        type: "payment_received",
        message: `🟢 Payment Received: ₹${amountReceived} for order ${orderId} from ${order.buyer.business_name}.`,
        linked_to_id: orderId,
        status: "unread",
        for_role: "ACCOUNTS"
      }
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Receive Payment Error: ", error);
    return NextResponse.json({ error: "Failed to record payment transaction." }, { status: 500 });
  }
}
