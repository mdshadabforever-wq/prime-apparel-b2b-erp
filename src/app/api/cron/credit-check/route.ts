import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/cron/credit-check: Run periodic verification of outstanding invoices and update credit locks
export async function GET() {
  try {
    const now = new Date();

    // 1. Query all unpaid active sales orders with due dates in the past
    const overdueOrders = await db.salesOrder.findMany({
      where: {
        payment_status: { notIn: ["paid", "overdue"] },
        order_status: { not: "cancelled" },
        due_date: { lt: now }
      },
      include: { buyer: true }
    });

    if (overdueOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new overdue invoices found. Credit balances are fully compliant.",
        lockedBuyers: []
      });
    }

    const lockedBuyerIds = new Set<number>();
    const updatedOrderIds: string[] = [];

    // 2. Lock credit and update status
    for (const order of overdueOrders) {
      // Mark order as overdue
      await db.salesOrder.update({
        where: { order_id: order.order_id },
        data: { payment_status: "overdue" }
      });
      updatedOrderIds.push(order.order_id);

      const buyer = order.buyer;
      if (buyer && buyer.account_status !== "LOCKED_CREDIT" && buyer.account_status !== "BLOCKED") {
        // Lock buyer account credit status
        await db.buyer.update({
          where: { buyer_id: buyer.buyer_id },
          data: { account_status: "LOCKED_CREDIT" }
        });
        lockedBuyerIds.add(buyer.buyer_id);

        // Record Audit Log for the lock
        await db.auditLog.create({
          data: {
            user_name: "Automated Credit Control System",
            action: "CREDIT_LOCK",
            description: `Locked B2B buyer account credit for ${buyer.business_name} (ID: ${buyer.buyer_id}) due to overdue outstanding invoice ${order.order_id} (Due date: ${order.due_date?.toLocaleDateString()}).`,
            linked_id: String(buyer.buyer_id)
          }
        });

        // Trigger staff warning notification
        await db.notification.create({
          data: {
            type: "overdue_payment",
            message: `⚠️ B2B Buyer '${buyer.business_name}' locked! Unpaid invoice #${order.order_id} matured and crossed due date.`,
            linked_to_id: String(buyer.buyer_id),
            status: "unread",
            for_role: "ACCOUNTS"
          }
        });

        // Simulate WhatsApp warning message to buyer
        const waMsg = `⚠️ Payment Overdue Warning! Namaste ${buyer.full_name},\n\nAapka Prime Apparel order [ID: ${order.order_id}] ki payment due date (${order.due_date?.toLocaleDateString()}) cross ho gayi hai.\n\nSystem guidelines ke mutabik aapka credit profile lock kar diya gaya hai. Agla order place karne ke liye kripya outstanding amount ₹${order.invoice_amount - order.payment_received_amount} clear karein. Thank you!`;
        await db.whatsAppLog.create({
          data: {
            contact_number: buyer.mobile,
            direction: "outgoing",
            message_type: "text",
            message_content: waMsg,
            handled_by: "ai",
            buyer_id: buyer.buyer_id
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Credit control cron completed. Matured invoices flag overdue, locked matching buyers.`,
      updatedOrdersCount: updatedOrderIds.length,
      updatedOrders: updatedOrderIds,
      lockedBuyersCount: lockedBuyerIds.size,
      lockedBuyers: Array.from(lockedBuyerIds)
    });
  } catch (error: any) {
    console.error("Credit check cron error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process credit check cron." },
      { status: 500 }
    );
  }
}
