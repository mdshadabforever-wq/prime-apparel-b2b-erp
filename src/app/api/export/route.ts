import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "products";

    let csvContent = "";
    let filename = `${type}-export.csv`;

    if (type === "products") {
      const products = await db.product.findMany({ orderBy: { sku_id: "asc" } });
      const headers = ["SKU ID", "Design Name", "Category", "Fabric", "Colors", "Sizes", "Purchase Cost", "Landed Cost", "Wholesale Price", "Stock Qty", "Grade", "Status"];
      csvContent += headers.join(",") + "\n";
      
      for (const p of products) {
        const row = [
          p.sku_id,
          `"${p.design_name.replace(/"/g, '""')}"`,
          p.category,
          p.fabric,
          `"${(p.color_options || "").replace(/"/g, '""')}"`,
          `"${(p.size_set || "").replace(/"/g, '""')}"`,
          p.purchase_cost,
          p.landed_cost,
          p.standard_price,
          p.qty_available,
          p.grade,
          p.status
        ];
        csvContent += row.join(",") + "\n";
      }
    } else if (type === "buyers") {
      const buyers = await db.buyer.findMany({ orderBy: { registered_on: "desc" } });
      const headers = ["ID", "Proprietor Name", "Mobile", "Business Name", "Business Type", "GSTIN", "City", "State", "Score", "Lead Status", "Account Status", "Credit Limit", "Credit Days", "Total Orders Count", "Total Orders Value"];
      csvContent += headers.join(",") + "\n";

      for (const b of buyers) {
        const row = [
          b.buyer_id,
          `"${b.full_name.replace(/"/g, '""')}"`,
          b.mobile,
          `"${b.business_name.replace(/"/g, '""')}"`,
          b.business_type,
          b.gst_number || "None",
          b.city,
          b.state,
          b.score,
          b.lead_status,
          b.account_status,
          b.credit_limit,
          b.credit_days,
          b.total_orders_count,
          b.total_orders_value
        ];
        csvContent += row.join(",") + "\n";
      }
    } else if (type === "orders") {
      const orders = await db.salesOrder.findMany({
        include: { buyer: true },
        orderBy: { order_date: "desc" }
      });
      const headers = ["Order ID", "Order Date", "Buyer Name", "Buyer Mobile", "Buyer Shop", "Total Qty", "Subtotal", "Discount", "Taxes", "Invoice Value", "Payment Terms", "Payment Status", "Order Status", "Carrier", "LR Number"];
      csvContent += headers.join(",") + "\n";

      for (const o of orders) {
        const row = [
          o.order_id,
          new Date(o.order_date).toISOString(),
          `"${o.buyer.full_name.replace(/"/g, '""')}"`,
          o.buyer.mobile,
          `"${o.buyer.business_name.replace(/"/g, '""')}"`,
          o.total_qty,
          o.subtotal_amount,
          o.discount_amount,
          o.gst_amount,
          o.invoice_amount,
          o.payment_terms,
          o.payment_status,
          o.order_status,
          o.transport_name || "None",
          o.lr_number || "None"
        ];
        csvContent += row.join(",") + "\n";
      }
    } else {
      return NextResponse.json({ error: "Invalid export type parameter." }, { status: 400 });
    }

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error: any) {
    console.error("Export API error:", error);
    return NextResponse.json({ error: error.message || "Failed to process data export." }, { status: 500 });
  }
}
