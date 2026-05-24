import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { csvContent } = body;

    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json({ error: "Missing or invalid CSV content." }, { status: 400 });
    }

    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length <= 1) {
      return NextResponse.json({ error: "CSV does not contain any data rows." }, { status: 400 });
    }

    // Parse headers
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    // Validate mandatory headers
    const required = ["sku id", "design name", "category", "fabric", "wholesale price"];
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length > 0) {
      return NextResponse.json({
        error: `CSV headers missing mandatory fields: ${missing.join(", ").toUpperCase()}`
      }, { status: 400 });
    }

    const skuIdIdx = headers.indexOf("sku id");
    const designNameIdx = headers.indexOf("design name");
    const categoryIdx = headers.indexOf("category");
    const fabricIdx = headers.indexOf("fabric");
    const colorIdx = headers.indexOf("colors");
    const sizesIdx = headers.indexOf("sizes");
    const purchaseCostIdx = headers.indexOf("purchase cost");
    const standardPriceIdx = headers.indexOf("wholesale price");
    const qtyIdx = headers.indexOf("stock qty");

    let createdCount = 0;
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      // Split row values, handling simple quotes
      const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, "").trim());
      if (row.length < required.length) continue;

      const skuId = row[skuIdIdx]?.toUpperCase();
      const designName = row[designNameIdx];
      const category = row[categoryIdx]?.toLowerCase();
      const fabric = row[fabricIdx]?.toLowerCase();
      const stdPrice = Number(row[standardPriceIdx]);

      if (!skuId || !designName || !category || !fabric || isNaN(stdPrice)) {
        skippedCount++;
        continue;
      }

      // Check duplicates
      const existing = await db.product.findUnique({ where: { sku_id: skuId } });
      if (existing) {
        skippedCount++;
        continue;
      }

      const pc = purchaseCostIdx !== -1 ? (Number(row[purchaseCostIdx]) || 0) : 0;
      const qty = qtyIdx !== -1 ? (Number(row[qtyIdx]) || 0) : 0;
      const colors = colorIdx !== -1 ? row[colorIdx] : "Standard Colors";
      const sizes = sizesIdx !== -1 ? row[sizesIdx] : "S, M, L, XL, XXL";

      const landed = pc; // assuming 0 freight/overheads for imported rows initially
      const margin = stdPrice > 0 ? Number(((stdPrice - landed) / stdPrice * 100).toFixed(2)) : 0;

      await db.product.create({
        data: {
          sku_id: skuId,
          design_name: designName,
          category: category,
          fabric: fabric,
          color_options: colors,
          size_set: sizes,
          purchase_cost: pc,
          freight_per_piece: 0,
          overhead_per_piece: 0,
          landed_cost: landed,
          standard_price: stdPrice,
          scheme_price: Number((stdPrice * 0.97).toFixed(2)),
          repeat_price: Number((stdPrice * 0.95).toFixed(2)),
          margin_percent: margin,
          qty_available: qty,
          status: qty > 0 ? "available" : "out_of_stock",
          photo_urls: JSON.stringify([]),
          grade: "A"
        }
      });
      createdCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Bulk CSV import complete! Sourcing database expanded.`,
      importedCount: createdCount,
      skippedCount: skippedCount
    });
  } catch (error: any) {
    console.error("Import API error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse and import data bulk." }, { status: 500 });
  }
}
