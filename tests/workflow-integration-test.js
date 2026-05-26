/**
 * PRIME APPAREL B2B ERP - WORKFLOW ENGINE INTEGRATION TEST
 * 
 * Verifies stage-based transitions, audit logging, and role-based notification dispatches.
 * 
 * Execution: npx tsx tests/workflow-integration-test.js
 */

const { transitionStatus } = require("../src/lib/workflow");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function runWorkflowTest() {
  console.log("=========================================");
  console.log("   PRIME APPAREL WORKFLOW ENGINE TEST   ");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] - ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] - ${message}`);
      failed++;
    }
  }

  try {
    // Sanitize past test notifications/audits
    await prisma.notification.deleteMany({
      where: { linked_to_id: { in: ["TEST-PROD-99", "TEST-ORDER-99", "TEST-LEAD-99"] } }
    });
    await prisma.auditLog.deleteMany({
      where: { linked_id: { in: ["TEST-PROD-99", "TEST-ORDER-99", "TEST-LEAD-99"] } }
    });

    // Seed temporary test products/orders to test transitions
    const testSku = "TEST-PROD-99";
    const testOrderId = "TEST-ORDER-99";
    const testLeadMobile = "TEST-LEAD-99";

    // Clean if exist
    await prisma.product.deleteMany({ where: { sku_id: testSku } });
    await prisma.salesOrder.deleteMany({ where: { order_id: testOrderId } });
    await prisma.lead.deleteMany({ where: { mobile: testLeadMobile } });

    // Seed mock product
    await prisma.product.create({
      data: {
        sku_id: testSku,
        design_name: "Mock Test Kurti",
        category: "kurti",
        fabric: "cotton",
        color_options: "Red",
        size_set: "M,L",
        purchase_cost: 150,
        landed_cost: 170,
        standard_price: 250,
        scheme_price: 240,
        repeat_price: 230,
        margin_percent: 32,
        qty_available: 50,
        qty_reserved: 0,
        photo_urls: "[]",
        status: "RESEARCH"
      }
    });

    // Seed mock order
    // Find active buyer
    const activeBuyer = await prisma.buyer.findFirst();
    if (!activeBuyer) throw new Error("Please seed database first");

    await prisma.salesOrder.create({
      data: {
        order_id: testOrderId,
        buyer_id: activeBuyer.buyer_id,
        items: "[]",
        total_qty: 10,
        subtotal_amount: 2500,
        final_amount: 2500,
        gst_amount: 125,
        invoice_amount: 2625,
        payment_terms: "advance",
        created_by: "QA Test Engine",
        order_status: "confirmed",
        payment_status: "pending"
      }
    });

    // Seed mock lead
    await prisma.lead.create({
      data: {
        name: "QA Test Lead",
        mobile: testLeadMobile,
        city: "Mumbai",
        source: "website",
        business_type: "BOUTIQUE",
        score: 50,
        status: "new"
      }
    });

    // ----------------------------------------------------
    // TEST 1: Product transition from RESEARCH -> PURCHASE
    // ----------------------------------------------------
    console.log("⏳ Running TEST 1: Product transition...");
    const pRes = await transitionStatus("product", testSku, "PURCHASE", "Procurement Specialist", "Approved by founder");
    assert(pRes.success === true, "Product status transition returns success");
    assert(pRes.oldStatus === "RESEARCH" && pRes.newStatus === "PURCHASE", "Product transitions oldStatus -> newStatus correctly");

    // Assert inter-department notification
    const prodNotif = await prisma.notification.findFirst({
      where: { linked_to_id: testSku, for_role: "INVENTORY" }
    });
    assert(!!prodNotif, "Product PURCHASE transition auto-dispatches notification to INVENTORY department");
    assert(prodNotif.message.includes("prepare warehouse"), "Handoff notification message targets the correct operational checklist");

    // ----------------------------------------------------
    // TEST 2: Order transition from confirmed -> qc_ok
    // ----------------------------------------------------
    console.log("\n⏳ Running TEST 2: Order transition...");
    const oRes = await transitionStatus("order", testOrderId, "qc_ok", "QA Inspector", "Passed quality check");
    assert(oRes.success === true, "Order status transition returns success");
    assert(oRes.oldStatus === "confirmed" && oRes.newStatus === "qc_ok", "Order transitions oldStatus -> newStatus correctly");

    // Assert inter-department notification
    const orderNotif = await prisma.notification.findFirst({
      where: { linked_to_id: testOrderId, for_role: "LOGISTICS" }
    });
    assert(!!orderNotif, "Order qc_ok transition auto-dispatches notification to LOGISTICS department");
    assert(orderNotif.message.includes("Logistics, proceed with packing"), "Handoff notification message targets logistics checklist");

    // ----------------------------------------------------
    // TEST 3: Lead transition to field_visit
    // ----------------------------------------------------
    console.log("\n⏳ Running TEST 3: Lead transition...");
    const lRes = await transitionStatus("lead", testLeadMobile, "field_visit", "Sales Manager", "Boutique owner requested brochure");
    assert(lRes.success === true, "Lead status transition returns success");

    // Assert inter-department notification
    const leadNotif = await prisma.notification.findFirst({
      where: { linked_to_id: testLeadMobile, for_role: "FIELD_BOY" }
    });
    assert(!!leadNotif, "Lead field_visit transition auto-dispatches notification to FIELD_BOY department");

    // ----------------------------------------------------
    // TEST 4: Audit Logs Verification
    // ----------------------------------------------------
    console.log("\n⏳ Running TEST 4: Audit trail audit...");
    const audits = await prisma.auditLog.findMany({
      where: { linked_id: { in: [testSku, testOrderId, testLeadMobile] } }
    });
    assert(audits.length === 3, "Workflow actions persistently register precise audit entries in AuditLogs");
    assert(audits.every(a => a.action.startsWith("WORKFLOW_")), "Audit log actions flag accurate key tags");

    // Cleanup mock data
    await prisma.notification.deleteMany({
      where: { linked_to_id: { in: [testSku, testOrderId, testLeadMobile] } }
    });
    await prisma.auditLog.deleteMany({
      where: { linked_id: { in: [testSku, testOrderId, testLeadMobile] } }
    });
    await prisma.product.deleteMany({ where: { sku_id: testSku } });
    await prisma.salesOrder.deleteMany({ where: { order_id: testOrderId } });
    await prisma.lead.deleteMany({ where: { mobile: testLeadMobile } });

  } catch (error) {
    console.error("Test execution error:", error);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n=========================================");
  console.log(`   TESTS COMPLETED: ${passed} Passed, ${failed} Failed`);
  console.log("=========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runWorkflowTest();
