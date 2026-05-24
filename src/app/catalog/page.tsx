import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import CatalogClient from "@/components/Catalog/CatalogClient";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  // 1. Fetch products from SQLite database
  const products = await db.product.findMany({
    orderBy: { created_date: "desc" }
  });

  // Convert schema objects to clean JSON values
  const serializedProducts = products.map((p) => ({
    sku_id: p.sku_id,
    design_name: p.design_name,
    category: p.category,
    fabric: p.fabric,
    color_options: p.color_options.split(","),
    size_set: p.size_set.split(","),
    length_cm: p.length_cm,
    purchase_cost: p.purchase_cost,
    landed_cost: p.landed_cost,
    standard_price: p.standard_price,
    scheme_price: p.scheme_price,
    repeat_price: p.repeat_price,
    qty_available: p.qty_available,
    qty_reserved: p.qty_reserved,
    grade: p.grade,
    status: p.status,
    photo_urls: JSON.parse(p.photo_urls || "[]"),
    video_url: p.video_url || null,
    notes: p.notes || ""
  }));

  // 2. Hydrate auth session
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  let loggedInUser = null;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      loggedInUser = {
        name: decoded.name,
        role: decoded.role,
        isStaff: decoded.role !== "BUYER"
      };
    }
  }

  return (
    <div className="flex-grow flex flex-col w-full bg-slate-950">
      <CatalogClient
        initialProducts={serializedProducts}
        loggedInUser={loggedInUser}
      />
    </div>
  );
}
