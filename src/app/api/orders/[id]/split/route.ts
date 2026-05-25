import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { releaseInventory, reserveInventory } from "@/lib/inventory";

// POST: Split order into N child invoices pro-ratably
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const parentOrderId = params.id;
    const body = await request.json();
    const { parts, staffName } = body;

    const numParts = Number(parts);
    if (isNaN(numParts) || numParts <= 1 || numParts > 10) {
      return NextResponse.json(
        { error: "Split count 2 se 10 ke beech hona zaroori hai." },
        { status: 400 }
      );
    }

    // 1. Fetch parent order
    const parentOrder = await db.salesOrder.findUnique({
      where: { order_id: parentOrderId },
      include: { buyer: true }
    });

    if (!parentOrder) {
      return NextResponse.json({ error: "Parent order not found." }, { status: 404 });
    }

    if (parentOrder.order_status !== "confirmed" && parentOrder.order_status !== "packed") {
      return NextResponse.json(
        { error: "Keval confirmed ya packed status wale orders hi split ho sakte hain." },
        { status: 400 }
      );
    }

    const parentItems = JSON.parse(parentOrder.items || "[]");
    if (parentItems.length === 0) {
      return NextResponse.json({ error: "Order is empty, cannot split." }, { status: 400 });
    }

    // 2. Release inventory reservations held by the parent order
    await releaseInventory(parentItems.map((item: any) => ({
      skuId: item.skuId,
      qty: Number(item.qty),
      price: Number(item.price)
    })));

    // 3. Pro-ratably distribute items among child orders
    const childrenData: Array<{
      items: any[];
      total_qty: number;
    }> = Array.from({ length: numParts }, () => ({
      items: [],
      total_qty: 0
    }));

    for (const item of parentItems) {
      const qty = Number(item.qty);
      const baseQtyPerChild = Math.floor(qty / numParts);
      const remainder = qty % numParts;

      for (let i = 0; i < numParts; i++) {
        let childQty = baseQtyPerChild;
        if (i === 0) {
          childQty += remainder; // First child gets the remainder to keep sum of pieces perfect
        }

        if (childQty > 0) {
          childrenData[i].items.push({
            skuId: item.skuId,
            qty: childQty,
            price: item.price,
            designName: item.designName || "Premium Garment"
          });
          childrenData[i].total_qty += childQty;
        }
      }
    }

    // 4. Create child orders and reserve their inventory
    const createdChildrenIds: string[] = [];
    let sumChildrenInvoiceAmount = 0;

    for (let i = 0; i < numParts; i++) {
      const child = childrenData[i];
      if (child.items.length === 0) continue;

      // Calculate totals penny-perfectly for this child order
      const subtotal = child.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const totalQty = child.items.reduce((sum, item) => sum + item.qty, 0);

      let discountPercent = 0;
      if (totalQty >= 50) discountPercent = 5;
      else if (totalQty >= 25) discountPercent = 3;

      const discountAmount = Math.round((subtotal * discountPercent) / 100);
      const finalAmount = subtotal - discountAmount;
      const gstAmount = Math.round(finalAmount * 0.05);
      const invoiceAmount = finalAmount + gstAmount;

      sumChildrenInvoiceAmount += invoiceAmount;

      // Unique Child Order ID
      const childOrderId = `${parentOrderId}-S${i + 1}`;

      // Reserve inventory for this child
      await reserveInventory(child.items);

      // Save child order in database
      await db.salesOrder.create({
        data: {
          order_id: childOrderId,
          buyer_id: parentOrder.buyer_id,
          items: JSON.stringify(child.items),
          total_qty: totalQty,
          subtotal_amount: subtotal,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          gst_amount: gstAmount,
          invoice_amount: invoiceAmount,
          payment_terms: parentOrder.payment_terms,
          payment_status: "pending",
          payment_received_amount: 0,
          payment_received_date: null,
          order_status: "confirmed",
          created_by: staffName || "Staff Splitting Operator",
          notes: `Split child from parent order #${parentOrderId}`,
          invoice_type: parentOrder.invoice_type,
          due_date: parentOrder.due_date,
          terms_accepted: parentOrder.terms_accepted,
          parent_order_id: parentOrderId
        }
      });

      createdChildrenIds.push(childOrderId);
    }

    // 5. Update Parent Order Status and accounting logs
    await db.salesOrder.update({
      where: { order_id: parentOrderId },
      data: {
        order_status: "split_parent",
        notes: `Order split into children: ${createdChildrenIds.join(", ")}`
      }
    });

    // Update Buyer's total orders value: subtract parent, add children totals
    await db.buyer.update({
      where: { buyer_id: parentOrder.buyer_id },
      data: {
        total_orders_count: { increment: createdChildrenIds.length - 1 }, // adjust count
        total_orders_value: {
          increment: sumChildrenInvoiceAmount - parentOrder.invoice_amount
        }
      }
    });

    // 6. Record Audit Logs
    const operator = staffName || "Staff Splitting Operator";
    await db.auditLog.create({
      data: {
        user_name: operator,
        action: "INVOICE_SPLIT",
        description: `Split parent order ${parentOrderId} (₹${parentOrder.invoice_amount}) into ${createdChildrenIds.length} child orders: ${createdChildrenIds.join(", ")} (Total child value: ₹${sumChildrenInvoiceAmount}).`,
        linked_id: parentOrderId
      }
    });

    // Notify internal team
    await db.notification.create({
      data: {
        type: "order_received",
        message: `✂️ Order split completed! Parent #${parentOrderId} split into ${createdChildrenIds.length} child invoices.`,
        linked_to_id: parentOrderId,
        status: "unread",
        for_role: "ACCOUNTS"
      }
    });

    return NextResponse.json({
      success: true,
      message: `Parent order ${parentOrderId} split successfully.`,
      children: createdChildrenIds
    });
  } catch (error: any) {
    console.error("Order splitting endpoint error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to split sales order." },
      { status: 500 }
    );
  }
}
