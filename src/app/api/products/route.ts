import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all products from SQLite database
export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: { created_date: "desc" }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Fetch Products Error: ", error);
    return NextResponse.json({ error: "Failed to fetch product collections." }, { status: 500 });
  }
}

// POST: Create new Product SKU in inventory
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      skuId,
      designName,
      category,
      fabric,
      colorOptions,
      sizeSet,
      lengthCm,
      purchaseCost,
      freightPerPiece,
      overheadPerPiece,
      standardPrice,
      qtyAvailable,
      grade,
      photoUrls,
      videoUrl,
      supplierId,
      notes
    } = body;

    if (!skuId || !designName || !category || !fabric || !standardPrice) {
      return NextResponse.json(
        { error: "Zaroori parameters (SKU, Name, Category, Fabric, Price) mandatory hain." },
        { status: 400 }
      );
    }

    // Check duplicate SKU
    const existing = await db.product.findUnique({
      where: { sku_id: skuId.toUpperCase() }
    });
    if (existing) {
      return NextResponse.json(
        { error: `SKU code ${skuId.toUpperCase()} pehle se exists karta hai!` },
        { status: 400 }
      );
    }

    // Auto-calculate landed cost & margin percentages
    const pc = Number(purchaseCost) || 0;
    const freight = Number(freightPerPiece) || 0;
    const overhead = Number(overheadPerPiece) || 0;
    const landedCost = pc + freight + overhead;
    
    const stdPrice = Number(standardPrice);
    const marginPercent = stdPrice > 0 ? Number(((stdPrice - landedCost) / stdPrice * 100).toFixed(2)) : 0;

    const newProduct = await db.product.create({
      data: {
        sku_id: skuId.toUpperCase(),
        design_name: designName,
        category: category,
        fabric: fabric,
        color_options: colorOptions || "Standard",
        size_set: sizeSet || "S, M, L, XL",
        length_cm: lengthCm ? Number(lengthCm) : null,
        purchase_cost: pc,
        freight_per_piece: freight,
        overhead_per_piece: overhead,
        landed_cost: landedCost,
        standard_price: stdPrice,
        scheme_price: Number((stdPrice * 0.97).toFixed(2)), // 3% auto discount
        repeat_price: Number((stdPrice * 0.95).toFixed(2)), // 5% auto discount
        margin_percent: marginPercent,
        qty_available: Number(qtyAvailable) || 0,
        qty_reserved: 0,
        qty_sold_total: 0,
        grade: grade || "A",
        status: (Number(qtyAvailable) || 0) > 0 ? "available" : "out_of_stock",
        photo_urls: photoUrls ? JSON.stringify(photoUrls) : JSON.stringify([]),
        video_url: videoUrl || null,
        supplier_id: supplierId ? Number(supplierId) : null,
        notes: notes || null
      }
    });

    // Create staff notification alert
    await db.notification.create({
      data: {
        type: "low_stock",
        message: `🆕 New SKU Created in Catalog: ${newProduct.sku_id} - ${newProduct.design_name}. Stock: ${newProduct.qty_available} pcs.`,
        linked_to_id: newProduct.sku_id,
        status: "unread",
        for_role: "INVENTORY"
      }
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("Create Product SKU error:", error);
    return NextResponse.json({ error: error.message || "Failed to create new product." }, { status: 500 });
  }
}
