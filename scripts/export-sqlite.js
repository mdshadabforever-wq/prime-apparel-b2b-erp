/**
 * PRIME APPAREL B2B ERP - SQLITE TO POSTGRESQL DATA EXPORTER
 * 
 * Run this script WHILE schema.prisma is still configured for "sqlite"
 * to capture all existing database records into a single JSON file.
 * 
 * Execution: node scripts/export-sqlite.js
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const EXPORT_FILE = path.join(__dirname, "..", "prisma", "sqlite-data-export.json");

async function runExporter() {
  console.log("=================================================");
  console.log("     PRIME APPAREL B2B ERP: SQLITE DATA EXPORT   ");
  console.log("=================================================\n");

  try {
    const dataDump = {};

    console.log("⏳ Exporting 'Staff' records...");
    dataDump.staff = await prisma.staff.findMany();
    console.log(`✅ Exported ${dataDump.staff.length} staff members.`);

    console.log("⏳ Exporting 'Supplier' records...");
    dataDump.supplier = await prisma.supplier.findMany();
    console.log(`✅ Exported ${dataDump.supplier.length} suppliers.`);

    console.log("⏳ Exporting 'Buyer' records...");
    dataDump.buyer = await prisma.buyer.findMany();
    console.log(`✅ Exported ${dataDump.buyer.length} buyers.`);

    console.log("⏳ Exporting 'Lead' records...");
    dataDump.lead = await prisma.lead.findMany();
    console.log(`✅ Exported ${dataDump.lead.length} leads.`);

    console.log("⏳ Exporting 'AuditLog' records...");
    dataDump.auditLog = await prisma.auditLog.findMany();
    console.log(`✅ Exported ${dataDump.auditLog.length} audit logs.`);

    console.log("⏳ Exporting 'Notification' records...");
    dataDump.notification = await prisma.notification.findMany();
    console.log(`✅ Exported ${dataDump.notification.length} notifications.`);

    console.log("⏳ Exporting 'Product' records...");
    dataDump.product = await prisma.product.findMany();
    console.log(`✅ Exported ${dataDump.product.length} products.`);

    console.log("⏳ Exporting 'PurchaseOrder' records...");
    dataDump.purchaseOrder = await prisma.purchaseOrder.findMany();
    console.log(`✅ Exported ${dataDump.purchaseOrder.length} purchase orders.`);

    console.log("⏳ Exporting 'SalesOrder' records...");
    dataDump.salesOrder = await prisma.salesOrder.findMany();
    console.log(`✅ Exported ${dataDump.salesOrder.length} sales orders.`);

    console.log("⏳ Exporting 'CashFlow' records...");
    dataDump.cashFlow = await prisma.cashFlow.findMany();
    console.log(`✅ Exported ${dataDump.cashFlow.length} cash flow records.`);

    console.log("⏳ Exporting 'WhatsAppLog' records...");
    dataDump.whatsAppLog = await prisma.whatsAppLog.findMany();
    console.log(`✅ Exported ${dataDump.whatsAppLog.length} WhatsApp log entries.`);

    console.log("\n💾 Saving JSON payload to disk...");
    fs.writeFileSync(EXPORT_FILE, JSON.stringify(dataDump, null, 2), "utf8");
    console.log(`🎉 SUCCESS! SQLite database exported safely to:\n👉 ${EXPORT_FILE}\n`);

  } catch (error) {
    console.error("❌ EXPORT FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runExporter();
