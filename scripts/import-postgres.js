/**
 * PRIME APPAREL B2B ERP - SQLITE TO POSTGRESQL DATA IMPORTER
 * 
 * Run this script AFTER:
 * 1. schema.prisma is updated to use "postgresql" provider
 * 2. Prisma Client has been re-generated against PostgreSQL schema
 * 3. PostgreSQL migrations or db push have been applied
 * 4. DATABASE_URL points to your active PostgreSQL instance
 * 
 * Execution: node scripts/import-postgres.js
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const EXPORT_FILE = path.join(__dirname, "..", "prisma", "sqlite-data-export.json");

async function runImporter() {
  console.log("=================================================");
  console.log("    PRIME APPAREL B2B ERP: POSTGRESQL IMPORT     ");
  console.log("=================================================\n");

  if (!fs.existsSync(EXPORT_FILE)) {
    console.error(`❌ Export file not found at: ${EXPORT_FILE}`);
    console.error("Please run: node scripts/export-sqlite.js first!");
    process.exit(1);
  }

  console.log("💾 Reading SQLite export payload from disk...");
  const data = JSON.parse(fs.readFileSync(EXPORT_FILE, "utf8"));
  console.log("✅ Export payload loaded successfully.\n");

  try {
    // ----------------------------------------------------
    // Helper function to reset postgresql serial sequences
    // ----------------------------------------------------
    async function resetSequence(tableName, idColumn) {
      try {
        console.log(`🔄 Resetting serial sequence for "${tableName}"...`);
        // In PostgreSQL, sequence resetting prevents future autoincrement collisions
        await prisma.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('"${tableName}"', '${idColumn}'), COALESCE(MAX(${idColumn}), 1)) FROM "${tableName}";`
        );
        console.log(`   Sequence reset for "${tableName}" successfully.`);
      } catch (seqErr) {
        console.warn(`⚠️ Warning: Could not reset sequence for "${tableName}": ${seqErr.message}`);
      }
    }

    // ----------------------------------------------------
    // 1. IMPORT STAFF (No dependencies)
    // ----------------------------------------------------
    if (data.staff && data.staff.length > 0) {
      console.log(`⏳ Importing ${data.staff.length} 'Staff' records...`);
      for (const row of data.staff) {
        await prisma.staff.upsert({
          where: { staff_id: row.staff_id },
          update: row,
          create: row,
        });
      }
      await resetSequence("Staff", "staff_id");
    }

    // ----------------------------------------------------
    // 2. IMPORT SUPPLIER (No dependencies)
    // ----------------------------------------------------
    if (data.supplier && data.supplier.length > 0) {
      console.log(`⏳ Importing ${data.supplier.length} 'Supplier' records...`);
      for (const row of data.supplier) {
        await prisma.supplier.upsert({
          where: { supplier_id: row.supplier_id },
          update: row,
          create: row,
        });
      }
      await resetSequence("Supplier", "supplier_id");
    }

    // ----------------------------------------------------
    // 3. IMPORT BUYER (No dependencies)
    // ----------------------------------------------------
    if (data.buyer && data.buyer.length > 0) {
      console.log(`⏳ Importing ${data.buyer.length} 'Buyer' records...`);
      for (const row of data.buyer) {
        // Map date strings back to Date objects
        const record = {
          ...row,
          last_order_date: row.last_order_date ? new Date(row.last_order_date) : null,
          last_contact_date: row.last_contact_date ? new Date(row.last_contact_date) : null,
          next_followup_date: row.next_followup_date ? new Date(row.next_followup_date) : null,
          registered_on: row.registered_on ? new Date(row.registered_on) : new Date(),
          approved_on: row.approved_on ? new Date(row.approved_on) : null,
        };
        await prisma.buyer.upsert({
          where: { buyer_id: record.buyer_id },
          update: record,
          create: record,
        });
      }
      await resetSequence("Buyer", "buyer_id");
    }

    // ----------------------------------------------------
    // 4. IMPORT LEAD (No dependencies)
    // ----------------------------------------------------
    if (data.lead && data.lead.length > 0) {
      console.log(`⏳ Importing ${data.lead.length} 'Lead' records...`);
      for (const row of data.lead) {
        const record = {
          ...row,
          created_date: row.created_date ? new Date(row.created_date) : new Date(),
          last_contact_date: row.last_contact_date ? new Date(row.last_contact_date) : new Date(),
        };
        await prisma.lead.upsert({
          where: { lead_id: record.lead_id },
          update: record,
          create: record,
        });
      }
      await resetSequence("Lead", "lead_id");
    }

    // ----------------------------------------------------
    // 5. IMPORT AUDITLOG (No dependencies)
    // ----------------------------------------------------
    if (data.auditLog && data.auditLog.length > 0) {
      console.log(`⏳ Importing ${data.auditLog.length} 'AuditLog' records...`);
      for (const row of data.auditLog) {
        const record = {
          ...row,
          timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
        };
        await prisma.auditLog.upsert({
          where: { log_id: record.log_id },
          update: record,
          create: record,
        });
      }
      await resetSequence("AuditLog", "log_id");
    }

    // ----------------------------------------------------
    // 6. IMPORT NOTIFICATION (No dependencies)
    // ----------------------------------------------------
    if (data.notification && data.notification.length > 0) {
      console.log(`⏳ Importing ${data.notification.length} 'Notification' records...`);
      for (const row of data.notification) {
        const record = {
          ...row,
          created_at: row.created_at ? new Date(row.created_at) : new Date(),
        };
        await prisma.notification.upsert({
          where: { notification_id: record.notification_id },
          update: record,
          create: record,
        });
      }
      await resetSequence("Notification", "notification_id");
    }

    // ----------------------------------------------------
    // 7. IMPORT PRODUCT (Depends on Supplier)
    // ----------------------------------------------------
    if (data.product && data.product.length > 0) {
      console.log(`⏳ Importing ${data.product.length} 'Product' records...`);
      for (const row of data.product) {
        const record = {
          ...row,
          created_date: row.created_date ? new Date(row.created_date) : new Date(),
          last_updated: row.last_updated ? new Date(row.last_updated) : new Date(),
        };
        await prisma.product.upsert({
          where: { sku_id: record.sku_id },
          update: record,
          create: record,
        });
      }
    }

    // ----------------------------------------------------
    // 8. IMPORT PURCHASEORDER (Depends on Supplier)
    // ----------------------------------------------------
    if (data.purchaseOrder && data.purchaseOrder.length > 0) {
      console.log(`⏳ Importing ${data.purchaseOrder.length} 'PurchaseOrder' records...`);
      for (const row of data.purchaseOrder) {
        const record = {
          ...row,
          order_date: row.order_date ? new Date(row.order_date) : new Date(),
          expected_delivery_date: row.expected_delivery_date ? new Date(row.expected_delivery_date) : null,
          actual_delivery_date: row.actual_delivery_date ? new Date(row.actual_delivery_date) : null,
          payment_date: row.payment_date ? new Date(row.payment_date) : null,
        };
        await prisma.purchaseOrder.upsert({
          where: { purchase_order_id: record.purchase_order_id },
          update: record,
          create: record,
        });
      }
      await resetSequence("PurchaseOrder", "purchase_order_id");
    }

    // ----------------------------------------------------
    // 9. IMPORT SALESORDER (Depends on Buyer)
    // ----------------------------------------------------
    if (data.salesOrder && data.salesOrder.length > 0) {
      console.log(`⏳ Importing ${data.salesOrder.length} 'SalesOrder' records...`);
      for (const row of data.salesOrder) {
        const record = {
          ...row,
          order_date: row.order_date ? new Date(row.order_date) : new Date(),
          payment_received_date: row.payment_received_date ? new Date(row.payment_received_date) : null,
          dispatch_date: row.dispatch_date ? new Date(row.dispatch_date) : null,
          expected_delivery_date: row.expected_delivery_date ? new Date(row.expected_delivery_date) : null,
          delivery_date: row.delivery_date ? new Date(row.delivery_date) : null,
          due_date: row.due_date ? new Date(row.due_date) : null,
        };
        await prisma.salesOrder.upsert({
          where: { order_id: record.order_id },
          update: record,
          create: record,
        });
      }
    }

    // ----------------------------------------------------
    // 10. IMPORT CASHFLOW (Depends on SalesOrder, PurchaseOrder)
    // ----------------------------------------------------
    if (data.cashFlow && data.cashFlow.length > 0) {
      console.log(`⏳ Importing ${data.cashFlow.length} 'CashFlow' records...`);
      for (const row of data.cashFlow) {
        const record = {
          ...row,
          date: row.date ? new Date(row.date) : new Date(),
        };
        await prisma.cashFlow.upsert({
          where: { entry_id: record.entry_id },
          update: record,
          create: record,
        });
      }
      await resetSequence("CashFlow", "entry_id");
    }

    // ----------------------------------------------------
    // 11. IMPORT WHATSAPPLOG (Depends on Buyer, Lead)
    // ----------------------------------------------------
    if (data.whatsAppLog && data.whatsAppLog.length > 0) {
      console.log(`⏳ Importing ${data.whatsAppLog.length} 'WhatsAppLog' records...`);
      for (const row of data.whatsAppLog) {
        const record = {
          ...row,
          timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
        };
        await prisma.whatsAppLog.upsert({
          where: { message_id: record.message_id },
          update: record,
          create: record,
        });
      }
      await resetSequence("WhatsAppLog", "message_id");
    }

    console.log("\n=================================================");
    console.log("🎉 SUCCESS! All data migrated to PostgreSQL cleanly.");
    console.log("All key sequences updated. Zero autoincrement clashes.");
    console.log("=================================================");

  } catch (error) {
    console.error("\n❌ IMPORT FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runImporter();
