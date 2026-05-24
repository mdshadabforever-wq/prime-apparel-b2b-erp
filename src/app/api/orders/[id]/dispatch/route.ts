import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processDispatchStock } from "@/lib/inventory";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    const { transportName, lrNumber, expectedDeliveryDate } = await request.json();

    if (!transportName || !lrNumber) {
      return NextResponse.json(
        { error: "Transport Name aur LR booking number zaroori hain." },
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

    if (order.order_status === "dispatched" || order.order_status === "delivered") {
      return NextResponse.json({ error: "Order pehle se dispatched hai." }, { status: 400 });
    }

    // 1. Process physical stock deduction and update status
    const items = JSON.parse(order.items || "[]");
    await processDispatchStock(items);

    // 2. Update order tracking status
    const updatedOrder = await db.salesOrder.update({
      where: { order_id: orderId },
      data: {
        order_status: "dispatched",
        dispatch_date: new Date(),
        transport_name: transportName,
        lr_number: lrNumber,
        expected_delivery_date: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null
      }
    });

    // 3. Auto-simulate Outgoing WhatsApp dispatch confirmation log (FLOW 10)
    const itemListStr = items.map((i: any) => `${i.skuId} (${i.qty} pcs)`).join(", ");
    const waMessage = `Khushkhabri! 🎉 ${order.buyer.full_name} ji,\n\nAapka order [ID: ${orderId}] dispatch ho gaya hai!\n\n📦 Items: ${itemListStr}\n🚚 Transport: ${transportName}\n🔢 LR Consignment Number: ${lrNumber}\n📅 Expected Delivery: ${expectedDeliveryDate ? new Date(expectedDeliveryDate).toDateString() : "Check details"}\n\nKoi help? Direct yahan query batayein! 😊\n— Team Prime Apparel`;

    await db.whatsAppLog.create({
      data: {
        contact_number: order.buyer.mobile,
        direction: "outgoing",
        message_type: "text",
        message_content: waMessage,
        handled_by: "ai",
        buyer_id: order.buyer_id
      }
    });

    // 4. Create invoice notification alert for Accounts role
    await db.notification.create({
      data: {
        type: "dispatch_due",
        message: `🚚 Order dispatched: ${orderId}. LR Number: ${lrNumber} generated.`,
        linked_to_id: orderId,
        status: "unread",
        for_role: "ACCOUNTS"
      }
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Dispatch Order Error: ", error);
    return NextResponse.json({ error: "Failed to dispatch sales order." }, { status: 500 });
  }
}
