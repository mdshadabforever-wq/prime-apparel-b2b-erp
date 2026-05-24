import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const skuId = params.id;
    const body = await request.json();
    const {
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
      status,
      photoUrls,
      videoUrl,
      supplierId,
      notes
    } = body;

    const product = await db.product.findUnique({
      where: { sku_id: skuId }
    });

    if (!product) {
      return NextResponse.json({ error: "Product SKU not found." }, { status: 404 });
    }

    // Capture standard cost fields or default to database ones
    const pc = purchaseCost !== undefined ? Number(purchaseCost) : product.purchase_cost;
    const freight = freightPerPiece !== undefined ? Number(freightPerPiece) : product.freight_per_piece;
    const overhead = overheadPerPiece !== undefined ? Number(overheadPerPiece) : product.overhead_per_piece;
    const landedCost = pc + freight + overhead;

    const newPrice = standardPrice !== undefined ? Number(standardPrice) : product.standard_price;
    const marginPercent = newPrice > 0 ? Number(((newPrice - landedCost) / newPrice * 100).toFixed(2)) : 0;

    const updatedProduct = await db.product.update({
      where: { sku_id: skuId },
      data: {
        design_name: designName !== undefined ? designName : product.design_name,
        category: category !== undefined ? category : product.category,
        fabric: fabric !== undefined ? fabric : product.fabric,
        color_options: colorOptions !== undefined ? colorOptions : product.color_options,
        size_set: sizeSet !== undefined ? sizeSet : product.size_set,
        length_cm: lengthCm !== undefined ? (lengthCm ? Number(lengthCm) : null) : product.length_cm,
        purchase_cost: pc,
        freight_per_piece: freight,
        overhead_per_piece: overhead,
        landed_cost: landedCost,
        standard_price: newPrice,
        scheme_price: Number((newPrice * 0.97).toFixed(2)), // 3% auto discount
        repeat_price: Number((newPrice * 0.95).toFixed(2)), // 5% auto discount
        margin_percent: marginPercent,
        qty_available: qtyAvailable !== undefined ? Number(qtyAvailable) : product.qty_available,
        status: status !== undefined ? status : product.status,
        photo_urls: photoUrls !== undefined ? JSON.stringify(photoUrls) : product.photo_urls,
        video_url: videoUrl !== undefined ? videoUrl : product.video_url,
        supplier_id: supplierId !== undefined ? (supplierId ? Number(supplierId) : null) : product.supplier_id,
        notes: notes !== undefined ? notes : product.notes
      }
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Update Product Error: ", error);
    return NextResponse.json({ error: "Failed to update product details." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const skuId = params.id;
    
    // Check if the product exists
    const product = await db.product.findUnique({
      where: { sku_id: skuId }
    });

    if (!product) {
      return NextResponse.json({ error: "Product SKU not found." }, { status: 404 });
    }

    // Soft delete / discontinue instead of hard delete, or perform hard delete if requested
    // Real inventory systems prefer soft discontinuation, but let's allow actual deletion
    await db.product.delete({
      where: { sku_id: skuId }
    });

    return NextResponse.json({ success: true, message: "Product SKU deleted successfully." });
  } catch (error) {
    console.error("Delete Product Error: ", error);
    return NextResponse.json({ error: "Failed to delete product SKU from system. It may be linked to active sales orders." }, { status: 500 });
  }
}
