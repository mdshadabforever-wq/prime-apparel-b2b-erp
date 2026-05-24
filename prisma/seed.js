const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // Clear existing data
  await prisma.cashFlow.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.whatsAppLog.deleteMany();
  await prisma.notification.deleteMany();

  console.log("Cleaned old records.");

  // 1. Seed Staff
  const adminPassword = await bcrypt.hash("admin123", 10);
  const salesPassword = await bcrypt.hash("sales123", 10);
  const accountsPassword = await bcrypt.hash("accounts123", 10);

  const founder = await prisma.staff.create({
    data: {
      name: "Rajesh Singhania",
      mobile: "919999999999",
      email: "rajesh@primeapparel.in",
      password_hash: adminPassword,
      role: "FOUNDER",
      permissions: "all",
      status: "active"
    }
  });

  const salesStaff = await prisma.staff.create({
    data: {
      name: "Amit Sharma",
      mobile: "918888888888",
      email: "amit@primeapparel.in",
      password_hash: salesPassword,
      role: "SALES",
      permissions: "buyers,leads,orders,whatsapp",
      status: "active"
    }
  });

  const accountsStaff = await prisma.staff.create({
    data: {
      name: "Pooja Patel",
      mobile: "917777777777",
      email: "pooja@primeapparel.in",
      password_hash: accountsPassword,
      role: "ACCOUNTS",
      permissions: "cashflow,orders,invoices",
      status: "active"
    }
  });

  console.log("Seed: Staff members created.");

  // 2. Seed Suppliers
  const suratFabrics = await prisma.supplier.create({
    data: {
      supplier_name: "Surat Fabrics & Textile Hub",
      city: "Surat",
      contact_person: "Dinesh Bhai",
      mobile: "919825012345",
      whatsapp_number: "919825012345",
      email: "dinesh@suratfabrics.com",
      speciality: "rayon_kurti,cotton_kurti",
      rating: 5,
      written_terms_done: "yes",
      delivery_days_average: 5,
      payment_terms: "15_days",
      total_orders_count: 5,
      total_orders_value: 250000,
      notes: "Extremely reliable supplier of daily wear kurtis. Sourcing direct from Ring Road market.",
      status: "active"
    }
  });

  const arihantSuits = await prisma.supplier.create({
    data: {
      supplier_name: "Arihant Suits & Festive Wear",
      city: "Surat",
      contact_person: "Sanjay Shah",
      mobile: "919879012345",
      whatsapp_number: "919879012345",
      email: "sanjay@arihantsuits.com",
      speciality: "festive_suit,cotton_suit",
      rating: 4,
      written_terms_done: "yes",
      delivery_days_average: 8,
      payment_terms: "advance_only",
      total_orders_count: 2,
      total_orders_value: 120000,
      notes: "Premium heavily embroidered festive sets. Hand-work specialists.",
      status: "active"
    }
  });

  console.log("Seed: Suppliers created.");

  // 3. Seed Products (SKU Master)
  // Photo URLs: mock premium looking product images
  const p1 = await prisma.product.create({
    data: {
      sku_id: "PA-25-KR-001",
      design_name: "Meera Jaipuri Rayon Kurti",
      category: "kurti",
      fabric: "rayon",
      color_options: "Red,Blue,Yellow",
      size_set: "S,M,L,XL",
      length_cm: 110,
      purchase_cost: 230,
      freight_per_piece: 10,
      overhead_per_piece: 10,
      landed_cost: 250,
      standard_price: 350,
      scheme_price: 339,
      repeat_price: 332,
      margin_percent: 28.57,
      qty_available: 120,
      qty_reserved: 0,
      qty_sold_total: 450,
      grade: "A",
      status: "available",
      supplier_id: suratFabrics.supplier_id,
      photo_urls: JSON.stringify([
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80"
      ]),
      video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
      notes: "Top seller for retail shops. High-quality 14kg rayon fabric."
    }
  });

  const p2 = await prisma.product.create({
    data: {
      sku_id: "PA-25-KR-002",
      design_name: "Summer Floral Cotton A-Line",
      category: "kurti",
      fabric: "cotton",
      color_options: "Peach,Mint Green",
      size_set: "S,M,L,XL",
      length_cm: 115,
      purchase_cost: 195,
      freight_per_piece: 8,
      overhead_per_piece: 7,
      landed_cost: 210,
      standard_price: 290,
      scheme_price: 280,
      repeat_price: 275,
      margin_percent: 27.58,
      qty_available: 85,
      qty_reserved: 10,
      qty_sold_total: 210,
      grade: "A",
      status: "available",
      supplier_id: suratFabrics.supplier_id,
      photo_urls: JSON.stringify([
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80"
      ]),
      notes: "Breathable 60-60 pure cambric cotton kurti."
    }
  });

  const p3 = await prisma.product.create({
    data: {
      sku_id: "PA-25-SS-001",
      design_name: "Maharani Georgette Anarkali Set",
      category: "festive",
      fabric: "georgette",
      color_options: "Royal Violet,Emerald Green",
      size_set: "S,M,L,XL",
      length_cm: 135,
      purchase_cost: 360,
      freight_per_piece: 15,
      overhead_per_piece: 15,
      landed_cost: 390,
      standard_price: 550,
      scheme_price: 535,
      repeat_price: 520,
      margin_percent: 29.09,
      qty_available: 45,
      qty_reserved: 0,
      qty_sold_total: 80,
      grade: "A",
      status: "available",
      supplier_id: arihantSuits.supplier_id,
      photo_urls: JSON.stringify([
        "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=400&q=80"
      ]),
      notes: "Includes fully-stitched Anarkali, pant, and dupatta. Heavily embroidered."
    }
  });

  const p4 = await prisma.product.create({
    data: {
      sku_id: "PA-25-SS-002",
      design_name: "Gharara Daily Wear Cotton Set",
      category: "daily",
      fabric: "cotton",
      color_options: "Indigo Blue",
      size_set: "M,L,XL",
      length_cm: 95,
      purchase_cost: 290,
      freight_per_piece: 10,
      overhead_per_piece: 10,
      landed_cost: 310,
      standard_price: 420,
      scheme_price: 405,
      repeat_price: 398,
      margin_percent: 26.19,
      qty_available: 8, // Triggers low stock notification (<10)
      qty_reserved: 0,
      qty_sold_total: 110,
      grade: "B",
      status: "low_stock",
      supplier_id: suratFabrics.supplier_id,
      photo_urls: JSON.stringify([
        "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=400&q=80"
      ]),
      notes: "Highly requested Indigo style. Fast moving item."
    }
  });

  console.log("Seed: Products created.");

  // 4. Seed Buyers & Leads
  const buyerPassword = await bcrypt.hash("buyer123", 10);
  const sampleBuyer = await prisma.buyer.create({
    data: {
      full_name: "Sneha Garments",
      mobile: "919876543210", // Primary identifier
      email: "sneha@garments.com",
      password_hash: buyerPassword,
      business_name: "Sneha Boutique & Retail",
      business_type: "BOUTIQUE",
      gst_number: "27AAAAA1111A1Z1",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      address: "102, Linking Road, Bandra West",
      instagram_link: "https://instagram.com/snehagarments",
      facebook_link: "",
      website_link: "",
      score: 82, // Calculated based on input
      lead_status: "HOT",
      account_status: "APPROVED",
      credit_limit: 50000,
      credit_days: 7,
      total_orders_count: 1,
      total_orders_value: 17500,
      last_order_date: new Date(),
      last_contact_date: new Date(),
      notes: "Premium regular buyer, punctual on credit payments. Prefers Jaipuri prints."
    }
  });

  // Seed standard leads
  await prisma.lead.create({
    data: {
      name: "Ramesh Sharma Kurtis",
      mobile: "919111222333",
      city: "Delhi",
      source: "instagram",
      business_type: "OFFLINE_RETAIL",
      score: 87, // Hot
      status: "contacted",
      notes: "Interested in bulk suit sets. Active shop at Lajpat Nagar market."
    }
  });

  await prisma.lead.create({
    data: {
      name: "Karan Boutique",
      mobile: "919222333444",
      city: "Surat",
      source: "whatsapp",
      business_type: "BOUTIQUE",
      score: 65, // Warm
      status: "new",
      notes: "Inquired through WhatsApp. Reseller starting new collection."
    }
  });

  console.log("Seed: Buyers & Leads created.");

  // 5. Seed Sales Orders & CashFlow
  const o1 = await prisma.salesOrder.create({
    data: {
      order_id: "20260524-001",
      buyer_id: sampleBuyer.buyer_id,
      items: JSON.stringify([
        { sku_id: "PA-25-KR-001", qty: 50, price: 350, subtotal: 17500 }
      ]),
      total_qty: 50,
      subtotal_amount: 17500,
      discount_amount: 0,
      final_amount: 17500,
      gst_amount: 875, // 5% GST
      invoice_amount: 18375,
      payment_terms: "7days",
      payment_status: "pending",
      payment_received_amount: 0,
      order_status: "dispatched",
      dispatch_date: new Date(),
      transport_name: "V-Trans Logistics",
      lr_number: "VT-10928374",
      expected_delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      created_by: "Amit Sharma",
      notes: "Shipped from Mumbai warehouse today. Checked sizes and color bleeding."
    }
  });

  // Create initial Income cashflow log
  await prisma.cashFlow.create({
    data: {
      type: "income",
      category: "order_payment",
      description: "Payment received for Order 20260524-001 - sneha garments",
      amount: 18375,
      sales_order_id: o1.order_id,
      created_by: "Pooja Patel"
    }
  });

  console.log("Seed: Sales orders & CashFlow logs created.");

  // 6. Seed WhatsApp Conversations
  await prisma.whatsAppLog.create({
    data: {
      contact_number: sampleBuyer.mobile,
      direction: "incoming",
      message_type: "text",
      message_content: "Minimum order kitna hai?",
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
      handled_by: "ai",
      buyer_id: sampleBuyer.buyer_id
    }
  });

  await prisma.whatsAppLog.create({
    data: {
      contact_number: sampleBuyer.mobile,
      direction: "outgoing",
      message_type: "text",
      message_content: "Namaste! 🙏 Prime Apparel Exports mein aapka swagat hai. Minimum order 12 pieces per design hai. Alag alag designs mein mix kar sakte hain, lekin ek design mein minimum 12 pieces chahiye.",
      timestamp: new Date(Date.now() - 9 * 60 * 1000), // 9 mins ago
      handled_by: "ai",
      buyer_id: sampleBuyer.buyer_id
    }
  });

  console.log("Seed: WhatsApp Logs created.");

  // 7. Seed Notifications
  await prisma.notification.create({
    data: {
      type: "low_stock",
      message: "Stock low: PA-25-SS-002 - only 8 pieces left",
      linked_to_id: "PA-25-SS-002",
      status: "unread",
      for_role: "INVENTORY"
    }
  });

  await prisma.notification.create({
    data: {
      type: "new_lead",
      message: "🔥 New HOT Lead! Name: Ramesh Sharma Kurtis, City: Delhi, Score: 87/100",
      linked_to_id: "1",
      status: "unread",
      for_role: "SALES"
    }
  });

  console.log("Seeding complete! Database is successfully primed.");
}

main()
  .catch((e) => {
    console.error("Seeding failed: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
