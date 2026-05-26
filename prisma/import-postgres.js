const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 PostgreSQL Data Migration Started...");

  // Load JSON dump
  const dumpPath = path.join(__dirname, "sqlite-data-export.json");
  if (!fs.existsSync(dumpPath)) {
    console.error("❌ Error: sqlite-data-export.json not found!");
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, "utf-8"));
  console.log("📖 Loaded SQLite data dump file successfully.");

  // 1. Clean existing records in legacy tables
  console.log("🧹 Cleaning existing data in PostgreSQL tables...");
  await prisma.cashFlow.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.whatsAppLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany(); // clean CRM customer mapping
  await prisma.buyer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.staff.deleteMany();
  console.log("🗑️ Cleanup completed.");

  // 2. Import Suppliers
  if (dump.supplier) {
    console.log(`➡️ Importing ${dump.supplier.length} Suppliers...`);
    for (const sup of dump.supplier) {
      await prisma.supplier.create({
        data: {
          supplier_id: sup.supplier_id,
          supplier_name: sup.supplier_name,
          city: sup.city,
          contact_person: sup.contact_person,
          mobile: sup.mobile,
          whatsapp_number: sup.whatsapp_number,
          email: sup.email,
          speciality: sup.speciality,
          rating: sup.rating,
          written_terms_done: sup.written_terms_done,
          delivery_days_average: sup.delivery_days_average,
          return_policy_notes: sup.return_policy_notes,
          payment_terms: sup.payment_terms,
          total_orders_count: sup.total_orders_count,
          total_orders_value: parseFloat(sup.total_orders_value),
          last_order_date: sup.last_order_date ? new Date(sup.last_order_date) : null,
          notes: sup.notes,
          status: sup.status
        }
      });
    }
  }

  // 3. Import Products
  if (dump.product) {
    console.log(`➡️ Importing ${dump.product.length} Products...`);
    for (const prod of dump.product) {
      await prisma.product.create({
        data: {
          sku_id: prod.sku_id,
          design_name: prod.design_name,
          category: prod.category,
          fabric: prod.fabric,
          color_options: prod.color_options,
          size_set: prod.size_set,
          length_cm: prod.length_cm,
          purchase_cost: parseFloat(prod.purchase_cost),
          freight_per_piece: parseFloat(prod.freight_per_piece),
          overhead_per_piece: parseFloat(prod.overhead_per_piece),
          landed_cost: parseFloat(prod.landed_cost),
          standard_price: parseFloat(prod.standard_price),
          scheme_price: parseFloat(prod.scheme_price),
          repeat_price: parseFloat(prod.repeat_price),
          margin_percent: parseFloat(prod.margin_percent),
          qty_available: prod.qty_available,
          qty_reserved: prod.qty_reserved,
          qty_sold_total: prod.qty_sold_total,
          grade: prod.grade,
          status: prod.status,
          supplier_id: prod.supplier_id,
          created_date: new Date(prod.created_date),
          photo_urls: prod.photo_urls,
          video_url: prod.video_url,
          notes: prod.notes
        }
      });
    }
  }

  // 4. Import Buyers
  if (dump.buyer) {
    console.log(`➡️ Importing ${dump.buyer.length} Buyers...`);
    for (const b of dump.buyer) {
      await prisma.buyer.create({
        data: {
          buyer_id: b.buyer_id,
          full_name: b.full_name,
          mobile: b.mobile,
          email: b.email,
          password_hash: b.password_hash,
          business_name: b.business_name,
          business_type: b.business_type,
          gst_number: b.gst_number,
          buyer_type: b.buyer_type,
          pan_or_aadhaar: b.pan_or_aadhaar,
          gst_legal_name: b.gst_legal_name,
          gst_address: b.gst_address,
          gst_filing_status: b.gst_filing_status,
          city: b.city,
          state: b.state,
          pincode: b.pincode,
          address: b.address,
          instagram_link: b.instagram_link,
          facebook_link: b.facebook_link,
          website_link: b.website_link,
          score: b.score,
          lead_status: b.lead_status,
          account_status: b.account_status,
          credit_limit: parseFloat(b.credit_limit),
          credit_days: b.credit_days,
          total_orders_count: b.total_orders_count,
          total_orders_value: parseFloat(b.total_orders_value),
          last_order_date: b.last_order_date ? new Date(b.last_order_date) : null,
          last_contact_date: b.last_contact_date ? new Date(b.last_contact_date) : new Date(),
          next_followup_date: b.next_followup_date ? new Date(b.next_followup_date) : null,
          notes: b.notes,
          registered_on: new Date(b.registered_on),
          approved_on: b.approved_on ? new Date(b.approved_on) : null,
          referred_by: b.referred_by
        }
      });
    }
  }

  // 5. Import Staff
  if (dump.staff) {
    console.log(`➡️ Importing ${dump.staff.length} Staff...`);
    for (const st of dump.staff) {
      await prisma.staff.create({
        data: {
          staff_id: st.staff_id,
          name: st.name,
          mobile: st.mobile,
          email: st.email,
          password_hash: st.password_hash,
          role: st.role,
          permissions: st.permissions,
          status: st.status
        }
      });
    }
  }

  // 6. Import Leads
  if (dump.lead) {
    console.log(`➡️ Importing ${dump.lead.length} Leads...`);
    for (const ld of dump.lead) {
      await prisma.lead.create({
        data: {
          lead_id: ld.lead_id,
          name: ld.name,
          mobile: ld.mobile,
          city: ld.city,
          source: ld.source,
          business_type: ld.business_type,
          score: ld.score,
          status: ld.status,
          notes: ld.notes,
          created_date: new Date(ld.created_date),
          last_contact_date: new Date(ld.last_contact_date),
          assigned_to: ld.assigned_to
        }
      });
    }
  }

  // 7. Import Purchase Orders
  if (dump.purchaseOrder) {
    console.log(`➡️ Importing ${dump.purchaseOrder.length} Purchase Orders...`);
    for (const po of dump.purchaseOrder) {
      await prisma.purchaseOrder.create({
        data: {
          purchase_order_id: po.purchase_order_id,
          supplier_id: po.supplier_id,
          order_date: new Date(po.order_date),
          expected_delivery_date: po.expected_delivery_date ? new Date(po.expected_delivery_date) : null,
          actual_delivery_date: po.actual_delivery_date ? new Date(po.actual_delivery_date) : null,
          items: po.items,
          total_quantity: po.total_quantity,
          total_purchase_value: parseFloat(po.total_purchase_value),
          freight_cost: parseFloat(po.freight_cost),
          total_landed_cost: parseFloat(po.total_landed_cost),
          payment_status: po.payment_status,
          payment_date: po.payment_date ? new Date(po.payment_date) : null,
          grn_done: po.grn_done,
          qc_done: po.qc_done,
          notes: po.notes
        }
      });
    }
  }

  // 8. Import Sales Orders
  if (dump.salesOrder) {
    console.log(`➡️ Importing ${dump.salesOrder.length} Sales Orders...`);
    for (const so of dump.salesOrder) {
      await prisma.salesOrder.create({
        data: {
          order_id: so.order_id,
          buyer_id: so.buyer_id,
          order_date: new Date(so.order_date),
          items: so.items,
          total_qty: so.total_qty,
          subtotal_amount: parseFloat(so.subtotal_amount),
          discount_amount: parseFloat(so.discount_amount),
          final_amount: parseFloat(so.final_amount),
          gst_amount: parseFloat(so.gst_amount),
          invoice_amount: parseFloat(so.invoice_amount),
          payment_terms: so.payment_terms,
          payment_status: so.payment_status,
          payment_received_amount: parseFloat(so.payment_received_amount),
          payment_received_date: so.payment_received_date ? new Date(so.payment_received_date) : null,
          order_status: so.order_status,
          dispatch_date: so.dispatch_date ? new Date(so.dispatch_date) : null,
          transport_name: so.transport_name,
          lr_number: so.lr_number,
          expected_delivery_date: so.expected_delivery_date ? new Date(so.expected_delivery_date) : null,
          delivery_confirmed: so.delivery_confirmed,
          delivery_date: so.delivery_date ? new Date(so.delivery_date) : null,
          feedback_rating: so.feedback_rating,
          feedback_notes: so.feedback_notes,
          created_by: so.created_by,
          notes: so.notes,
          invoice_type: so.invoice_type,
          due_date: so.due_date ? new Date(so.due_date) : null,
          awb_number: so.awb_number,
          shipment_id: so.shipment_id,
          pod_url: so.pod_url,
          pod_signature: so.pod_signature,
          parent_order_id: so.parent_order_id,
          terms_accepted: so.terms_accepted
        }
      });
    }
  }

  // 9. Import Cash Flow Logs
  if (dump.cashFlow) {
    console.log(`➡️ Importing ${dump.cashFlow.length} Cash Flow Logs...`);
    for (const cf of dump.cashFlow) {
      await prisma.cashFlow.create({
        data: {
          entry_id: cf.entry_id,
          date: new Date(cf.date),
          type: cf.type,
          category: cf.category,
          description: cf.description,
          amount: parseFloat(cf.amount),
          sales_order_id: cf.sales_order_id,
          purchase_order_id: cf.purchase_order_id,
          created_by: cf.created_by
        }
      });
    }
  }

  // 10. Import WhatsApp Logs
  if (dump.whatsAppLog) {
    console.log(`➡️ Importing ${dump.whatsAppLog.length} WhatsApp Logs...`);
    for (const wa of dump.whatsAppLog) {
      await prisma.whatsAppLog.create({
        data: {
          message_id: wa.message_id,
          contact_number: wa.contact_number,
          direction: wa.direction,
          message_type: wa.message_type,
          message_content: wa.message_content,
          template_name: wa.template_name,
          status: wa.status,
          timestamp: new Date(wa.timestamp),
          handled_by: wa.handled_by,
          buyer_id: wa.buyer_id,
          lead_id: wa.lead_id
        }
      });
    }
  }

  // 11. Import Notifications
  if (dump.notification) {
    console.log(`➡️ Importing ${dump.notification.length} Notifications...`);
    for (const n of dump.notification) {
      await prisma.notification.create({
        data: {
          notification_id: n.notification_id,
          type: n.type,
          message: n.message,
          linked_to_id: n.linked_to_id,
          status: n.status,
          created_at: new Date(n.created_at),
          for_role: n.for_role
        }
      });
    }
  }

  // 12. Import Audit Logs
  if (dump.auditLog) {
    console.log(`➡️ Importing ${dump.auditLog.length} Audit Logs...`);
    for (const al of dump.auditLog) {
      await prisma.auditLog.create({
        data: {
          log_id: al.log_id,
          timestamp: new Date(al.timestamp),
          user_name: al.user_name,
          action: al.action,
          description: al.description,
          linked_id: al.linked_id
        }
      });
    }
  }

  // 13. Pre-initialize B2B Customer Profiles (CRM Memory Engine)
  console.log("🧠 Pre-initializing Customer Memory Profiles...");
  const buyers = await prisma.buyer.findMany({
    include: {
      sales_orders: true
    }
  });

  for (const b of buyers) {
    let totalRevenue = 0;
    let pendingPayments = 0;
    let totalOrders = b.sales_orders.length;

    for (const o of b.sales_orders) {
      totalRevenue += o.invoice_amount;
      if (o.payment_status === "pending" || o.payment_status === "partial" || o.payment_status === "overdue") {
        pendingPayments += (o.invoice_amount - o.payment_received_amount);
      }
    }

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Create CRM Customer profile
    await prisma.customer.create({
      data: {
        buyer_id: b.buyer_id,
        company_name: b.business_name,
        trade_name: b.full_name,
        gstin: b.gst_number,
        mobile: b.mobile,
        email: b.email,
        city: b.city,
        state: b.state,
        address: b.address || `${b.city}, ${b.state}`,
        assigned_salesperson: "Amit Sharma",
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        average_order_value: avgOrderValue,
        pending_payments: pendingPayments,
        last_order_date: b.last_order_date,
        risk_level: b.account_status === "LOCKED_CREDIT" || b.account_status === "BLOCKED" ? "HIGH" : "MEDIUM",
        lead_stage: b.lead_status
      }
    });

    // Create a Customer Timeline log for initialization
    const cProfile = await prisma.customer.findUnique({ where: { buyer_id: b.buyer_id } });
    if (cProfile) {
      await prisma.customerTimeline.create({
        data: {
          customer_id: cProfile.id,
          event_type: "SYSTEM_ALERT",
          title: "B2B Customer Memory Active",
          description: "Database successfully migrated from SQLite to Neon PostgreSQL and synchronized.",
          operator_name: "Postgres Importer Service"
        }
      });
    }
  }

  // 14. Reset PostgreSQL primary key autoincrement sequences
  console.log("🔄 Resetting PostgreSQL primary key autoincrement sequences...");
  const tableKeys = [
    { table: "Supplier", col: "supplier_id" },
    { table: "Buyer", col: "buyer_id" },
    { table: "Lead", col: "lead_id" },
    { table: "PurchaseOrder", col: "purchase_order_id" },
    { table: "CashFlow", col: "entry_id" },
    { table: "WhatsAppLog", col: "message_id" },
    { table: "Notification", col: "notification_id" },
    { table: "AuditLog", col: "log_id" },
    { table: "Staff", col: "staff_id" },
    { table: "User", col: "id" },
    { table: "Department", col: "id" },
    { table: "Role", col: "id" },
    { table: "Permission", col: "id" },
    { table: "Customer", col: "id" },
    { table: "CustomerTimeline", col: "timeline_id" }
  ];

  for (const item of tableKeys) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${item.table}"', '${item.col}'), COALESCE(MAX("${item.col}"), 1)) FROM "${item.table}";`
      );
      console.log(`  ✅ Reset sequence for "${item.table}" ("${item.col}")`);
    } catch (err) {
      console.log(`  ⚠️ Could not reset sequence for "${item.table}": ${err.message}`);
    }
  }

  console.log("🎉 Database Migration Completed Successfully in PostgreSQL!");
}

main()
  .catch((e) => {
    console.error("❌ Migration Failed: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
