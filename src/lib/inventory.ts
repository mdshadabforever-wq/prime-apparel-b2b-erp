import { db } from "./db";

export interface OrderItemInput {
  skuId: string;
  qty: number;
  price: number;
}

export async function checkOrderFeasibility(
  buyerId: number,
  items: OrderItemInput[],
  paymentTerms: string
): Promise<{ allowed: boolean; reason?: string; subtotal: number; finalAmount: number; gstAmount: number; invoiceAmount: number }> {
  let subtotal = 0;

  // 1. Stock availability validation
  for (const item of items) {
    const product = await db.product.findUnique({
      where: { sku_id: item.skuId }
    });

    if (!product) {
      return { allowed: false, reason: `SKU ${item.skuId} master list mein nahi mila.`, subtotal: 0, finalAmount: 0, gstAmount: 0, invoiceAmount: 0 };
    }

    const availableQty = product.qty_available - product.qty_reserved;
    if (availableQty < item.qty) {
      return {
        allowed: false,
        reason: `SKU '${product.design_name}' [${item.skuId}] ki stock available nahi hai. Maanga: ${item.qty}, Bacha: ${availableQty} pieces.`,
        subtotal: 0, finalAmount: 0, gstAmount: 0, invoiceAmount: 0
      };
    }

    subtotal += item.price * item.qty;
  }

  // 2. Pricing schemes and tax computation
  // Calculate discount based on total pieces
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  let discountPercent = 0;
  if (totalQty >= 50) discountPercent = 5;      // 50+ pcs: 5% discount
  else if (totalQty >= 25) discountPercent = 3; // 25-49 pcs: 3% discount

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const finalAmount = subtotal - discountAmount;
  const gstAmount = Math.round(finalAmount * 0.05); // 5% B2B ethnic apparel GST
  const invoiceAmount = finalAmount + gstAmount;

  // 3. Credit limit validation (if credit payment is chosen)
  if (paymentTerms !== "advance") {
    const buyer = await db.buyer.findUnique({
      where: { buyer_id: buyerId }
    });

    if (!buyer) {
      return { allowed: false, reason: "Buyer account system mein nahi mila.", subtotal: 0, finalAmount: 0, gstAmount: 0, invoiceAmount: 0 };
    }

    // Advance payment required for first 2 orders check
    if (buyer.total_orders_count < 2) {
      return {
        allowed: false,
        reason: `Pehle 2 orders strict advance basis pe standard rules hain. Aapke confirmed orders: ${buyer.total_orders_count}. Payment 'advance' select karein!`,
        subtotal: 0, finalAmount: 0, gstAmount: 0, invoiceAmount: 0
      };
    }

    // Check credit limits
    const outstandingDebt = buyer.total_orders_value - buyer.total_orders_value; // In a real ledger, this checks outstanding unpaid sales invoices
    if (invoiceAmount + outstandingDebt > buyer.credit_limit) {
      return {
        allowed: false,
        reason: `Credit Limit exceeded! Invoice value (₹${invoiceAmount}) aapki safe credit limit (₹${buyer.credit_limit}) ko cross kar rahi hai. Advance choose karein.`,
        subtotal: 0, finalAmount: 0, gstAmount: 0, invoiceAmount: 0
      };
    }
  }

  return {
    allowed: true,
    subtotal,
    finalAmount,
    gstAmount,
    invoiceAmount
  };
}

export async function reserveInventory(items: OrderItemInput[]): Promise<void> {
  for (const item of items) {
    await db.product.update({
      where: { sku_id: item.skuId },
      data: {
        qty_reserved: { increment: item.qty }
      }
    });
  }
}

export async function releaseInventory(items: OrderItemInput[]): Promise<void> {
  for (const item of items) {
    await db.product.update({
      where: { sku_id: item.skuId },
      data: {
        qty_reserved: { decrement: item.qty }
      }
    });
  }
}

export async function processDispatchStock(items: OrderItemInput[]): Promise<void> {
  for (const item of items) {
    const product = await db.product.findUnique({
      where: { sku_id: item.skuId }
    });

    if (!product) continue;

    // Deduct available stock, decrement reserved quantity, increment total sold quantity
    const newQtyAvailable = Math.max(0, product.qty_available - item.qty);
    const newQtyReserved = Math.max(0, product.qty_reserved - item.qty);
    const newQtySoldTotal = product.qty_sold_total + item.qty;

    // Standard low stock alert threshold of 10 pieces
    const lowStockStatus = newQtyAvailable < 10 ? "low_stock" : "available";
    const status = newQtyAvailable === 0 ? "out_of_stock" : lowStockStatus;

    await db.product.update({
      where: { sku_id: item.skuId },
      data: {
        qty_available: newQtyAvailable,
        qty_reserved: newQtyReserved,
        qty_sold_total: newQtySoldTotal,
        status
      }
    });

    // If stock drops below 10, dispatch automated notification for staff
    if (newQtyAvailable < 10) {
      const existingNotification = await db.notification.findFirst({
        where: {
          type: "low_stock",
          linked_to_id: item.skuId,
          status: "unread"
        }
      });

      if (!existingNotification) {
        await db.notification.create({
          data: {
            type: "low_stock",
            message: `📦 Low Stock alert! SKU ${item.skuId} (${product.design_name}) has only ${newQtyAvailable} pieces left. Reorder from Surat!`,
            linked_to_id: item.skuId,
            status: "unread",
            for_role: "INVENTORY"
          }
        });
      }
    }
  }
}
