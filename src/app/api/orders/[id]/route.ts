import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { releaseInventory } from "@/lib/inventory";

// GET: Fetch order details with buyer relationship
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    const order = await db.salesOrder.findUnique({
      where: { order_id: orderId },
      include: { buyer: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order details not found." }, { status: 404 });
    }

    const serialized = {
      ...order,
      items: JSON.parse(order.items || "[]")
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Fetch Order ID Error: ", error);
    return NextResponse.json({ error: "Failed to fetch sales order details." }, { status: 500 });
  }
}

// PUT: Manage general order state transitions (Packed, Delivered, Cancelled)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    const body = await request.json();
    const { orderStatus, notes } = body;

    if (!orderStatus) {
      return NextResponse.json({ error: "Order status select karna zaroori hai." }, { status: 400 });
    }

    const order = await db.salesOrder.findUnique({
      where: { order_id: orderId },
      include: { buyer: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order details not found." }, { status: 404 });
    }

    const currentStatus = order.order_status;
    if (currentStatus === orderStatus) {
      return NextResponse.json({ success: true, order });
    }

    const items = JSON.parse(order.items || "[]");

    // 1. STATE TRANSITIONS LOGIC
    if (orderStatus === "cancelled") {
      // Revert Inventory Stock
      if (currentStatus === "dispatched" || currentStatus === "delivered") {
        // Revert physical stock deduction
        for (const item of items) {
          const product = await db.product.findUnique({ where: { sku_id: item.skuId } });
          if (product) {
            const newQtyAvailable = product.qty_available + item.qty;
            const newQtySoldTotal = Math.max(0, product.qty_sold_total - item.qty);
            const status = newQtyAvailable < 10 ? (newQtyAvailable === 0 ? "out_of_stock" : "low_stock") : "available";
            
            await db.product.update({
              where: { sku_id: item.skuId },
              data: {
                qty_available: newQtyAvailable,
                qty_sold_total: newQtySoldTotal,
                status
              }
            });
          }
        }
      } else {
        // Simply release reserved inventory (was reserved on confirmed/packed status)
        await releaseInventory(items);
      }

      // Revert Buyer Stats
      await db.buyer.update({
        where: { buyer_id: order.buyer_id },
        data: {
          total_orders_count: { decrement: 1 },
          total_orders_value: { decrement: order.invoice_amount }
        }
      });

      // Log Outgoing WhatsApp cancel alert
      const waMsg = `⚠️ Order Cancelled! Namaste ${order.buyer.full_name},\n\nAapka order [ID: ${orderId}] cancel kar diya gaya hai. Balance adjustments verify kar lein.\n\nThank you, Prime Apparel.`;
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
    } else if (orderStatus === "delivered") {
      // Just flag delivery confirmed
      await db.salesOrder.update({
        where: { order_id: orderId },
        data: {
          delivery_confirmed: "yes",
          delivery_date: new Date()
        }
      });

      // Log Outgoing WhatsApp delivery alert
      const waMsg = `📦 Delivery Confirmed! Namaste ${order.buyer.full_name},\n\nHame confirmation mili hai ki aapka parcel [ID: ${orderId}] successfully deliver ho gaya hai. Aapki ratings aur valuable reviews share karein! 😊`;
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
    }

    const updated = await db.salesOrder.update({
      where: { order_id: orderId },
      data: {
        order_status: orderStatus,
        notes: notes || order.notes
      }
    });

    // Log Notification for staff
    await db.notification.create({
      data: {
        type: orderStatus === "cancelled" ? "overdue_payment" : "order_received",
        message: `⚙️ Order status updated: ${orderId} is now ${orderStatus.toUpperCase()}.`,
        linked_to_id: orderId,
        status: "unread",
        for_role: "SALES"
      }
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error("PUT Order Status Error: ", error);
    return NextResponse.json({ error: error.message || "Failed to update order status." }, { status: 500 });
  }
}
