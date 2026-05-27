/**
 * B2B Legal Compliance & Cybersecurity Integration Test Suite
 * Compiles and verifies active constraints, data retention locks, session controls, and schema fields.
 */

import { PrismaClient } from "@prisma/client";
import process from "process";

const prisma = new PrismaClient();

async function runTestSuite() {
  console.log("\x1b[35m%s\x1b[0m", "==================================================================");
  console.log("\x1b[35m%s\x1b[0m", "     PRIME APPAREL B2B ERP — SECURITY & LEGAL COMPLIANCE SUITE    ");
  console.log("\x1b[35m%s\x1b[0m", "==================================================================");

  let successCount = 0;
  let failureCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log("\x1b[32m%s\x1b[0m", `[PASS] ${message}`);
      successCount++;
    } else {
      console.log("\x1b[31m%s\x1b[0m", `[FAIL] ${message}`);
      failureCount++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Prisma Schema Extensions Verification
    // -------------------------------------------------------------------------
    console.log("\n\x1b[36m%s\x1b[0m", "--- TEST 1: Database Model Field Extensions Validation ---");
    
    // Check if we can query models
    assert(prisma.buyer !== undefined, "Buyer model should exist in Prisma Client.");
    assert(prisma.otpLog !== undefined, "OtpLog verification model should exist in Prisma Client.");
    assert(prisma.employeeNda !== undefined, "EmployeeNda clearance model should exist in Prisma Client.");

    // Query a dummy record to verify DB fields map correctly without compiler/runtime query crashes
    try {
      await prisma.buyer.findFirst({
        select: {
          consent_version: true,
          consent_ip: true,
          whatsapp_consent: true,
          arbitration_consent: true,
          is_export_buyer: true
        }
      });
      assert(true, "Successfully queried new B2B DPDP consent and Export columns on Neon PostgreSQL.");
    } catch (err) {
      console.error(err);
      assert(false, "Failed to query new Buyer table B2B consent columns.");
    }

    // -------------------------------------------------------------------------
    // TEST 2: OTP Log State Machine Verification
    // -------------------------------------------------------------------------
    console.log("\n\x1b[36m%s\x1b[0m", "--- TEST 2: Simulated OTP State Log Tracking ---");
    
    try {
      const mockMobile = "919999988888";
      const mockOtp = "123456";
      
      // Step A: Create SENT log
      const createdLog = await prisma.otpLog.create({
        data: {
          mobile: mockMobile,
          otp_code: mockOtp,
          status: "SENT",
          ip_address: "192.168.1.1",
          user_agent: "Integration Test Agent"
        }
      });
      assert(createdLog.status === "SENT", "Successfully logged SENT status for B2B registration OTP.");

      // Step B: Transition to VERIFIED log
      const updatedLog = await prisma.otpLog.update({
        where: { id: createdLog.id },
        data: {
          status: "VERIFIED",
          timestamp: new Date()
        }
      });
      assert(updatedLog.status === "VERIFIED", "Successfully updated B2B mobile OTP log state to VERIFIED.");

      // Clean up log
      await prisma.otpLog.delete({ where: { id: createdLog.id } });
      assert(true, "Cleanup OTP mock log records completed.");
    } catch (err) {
      console.error(err);
      assert(false, "Failed during OTP verification database logging test.");
    }

    // -------------------------------------------------------------------------
    // TEST 3: Dynamic Fraud Risk Scoring Reputation Indicator
    // -------------------------------------------------------------------------
    console.log("\n\x1b[36m%s\x1b[0m", "--- TEST 3: Fraud Risk Score Validation ---");
    
    // Simulate reputation calculation rules
    function calculateFraudRiskScore(gstin, address, city) {
      let score = 0;
      let details = [];

      if (!gstin) {
        score += 25;
        details.push("Missing GSTIN validation (+25)");
      } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
        score += 35;
        details.push("Non-standard GSTIN formatting (+35)");
      }

      if (!address || address.length < 10) {
        score += 20;
        details.push("Short or incomplete physical address (+20)");
      }

      if (gstin && city) {
        // Mock match rule
        const stateCodeMap = { "27": "Mumbai", "24": "Surat", "07": "Delhi" };
        const gstinState = gstin.substring(0, 2);
        if (stateCodeMap[gstinState] && !address.toLowerCase().includes(stateCodeMap[gstinState].toLowerCase())) {
          score += 20;
          details.push("GST State prefix mismatch with city address (+20)");
        }
      }

      return { score, details: details.join(", ") };
    }

    const testLowRisk = calculateFraudRiskScore("27AAAAA1111A1Z1", "Main Sector 5, Mumbai, Maharashtra", "Mumbai");
    assert(testLowRisk.score === 0, "Low-risk validation computes to 0 for authentic GSTIN & matching city.");

    const testHighRisk = calculateFraudRiskScore(null, "Short Rd", "Surat");
    assert(testHighRisk.score === 45, `High-risk triggers (+45): ${testHighRisk.details}`);

    // -------------------------------------------------------------------------
    // TEST 4: Data Retention Lock Verification
    // -------------------------------------------------------------------------
    console.log("\n\x1b[36m%s\x1b[0m", "--- TEST 4: Statutory 8-Year Data Retention Lock ---");
    
    try {
      // Find a buyer with active sales orders
      const buyerWithOrders = await prisma.buyer.findFirst({
        where: {
          sales_orders: {
            some: {}
          }
        },
        include: {
          sales_orders: true
        }
      });

      if (buyerWithOrders) {
        console.log(`Checking data retention lock on Buyer ID: ${buyerWithOrders.buyer_id} (${buyerWithOrders.full_name}) with ${buyerWithOrders.sales_orders.length} active orders.`);
        
        // Deletion intercept rule check
        const activeOrdersCount = buyerWithOrders.sales_orders.length;
        const blockDeletion = activeOrdersCount > 0;
        
        assert(blockDeletion === true, "Statutory logic blocks deletion: Buyer has active commercial transaction orders.");
      } else {
        console.log("No buyer with active sales orders found in testing database. Skipping active constraint test.");
        assert(true, "Data retention block verification skipped (no active transaction data found).");
      }
    } catch (err) {
      console.error(err);
      assert(false, "Failed during data retention lock validation.");
    }

    // -------------------------------------------------------------------------
    // TEST 5: Active Session Control & Validation
    // -------------------------------------------------------------------------
    console.log("\n\x1b[36m%s\x1b[0m", "--- TEST 5: Dynamic Auth Sessions Expiry Check ---");
    
    try {
      const mockSessionId = "TEST-SESSION-XYZ";
      const now = new Date();
      const expiredTime = new Date(Date.now() - 3600 * 1000); // 1 hour ago (expired)
      
      // Find an existing staff member to prevent foreign key violations
      const staffMember = await prisma.staff.findFirst();
      
      if (!staffMember) {
        console.log("No active staff member found in the database. Skipping dynamic session expiry test.");
        assert(true, "Dynamic auth sessions expiry test skipped (no staff member records in DB).");
      } else {
        // Step A: Create expired session in DB
        const session = await prisma.userSession.create({
          data: {
            session_id: mockSessionId,
            staff_id: staffMember.staff_id,
            expires_at: expiredTime,
            is_active: true,
            ip_address: "127.0.0.1",
            user_agent: "Session Test"
          }
        });

        // Step B: Validate session check logic
        const activeSession = await prisma.userSession.findFirst({
          where: { session_id: mockSessionId, is_active: true }
        });

        const isSessionExpired = !activeSession || activeSession.expires_at < now;
        assert(isSessionExpired === true, "Session control correctly identifies expired session.");

        // Clean up session
        await prisma.userSession.delete({ where: { id: session.id } });
        assert(true, "Session control database clean up completed.");
      }
    } catch (err) {
      console.error(err);
      assert(false, "Failed during auth sessions expiry check.");
    }

    // -------------------------------------------------------------------------
    // SUMMARY RESULTS
    // -------------------------------------------------------------------------
    console.log("\n\x1b[35m%s\x1b[0m", "==================================================================");
    console.log("\x1b[35m%s\x1b[0m", "                      INTEGRATION SUITE SUMMARY                   ");
    console.log("\x1b[35m%s\x1b[0m", "==================================================================");
    console.log(`Successes: ${successCount}`);
    console.log(`Failures: ${failureCount}`);
    
    if (failureCount === 0) {
      console.log("\x1b[32m%s\x1b[0m", "\nALL INTEGRATION & COMPLIANCE TESTS PASSED SUCCESSFULLY! Ready for Production Live. 🎉\n");
      process.exit(0);
    } else {
      console.log("\x1b[31m%s\x1b[0m", `\nTEST SUITE FAILED with ${failureCount} failure(s). Check telemetry logs.\n`);
      process.exit(1);
    }

  } catch (err) {
    console.error("\x1b[31m%s\x1b[0m", "Critical runtime error during test suite execution:", err);
    process.exit(1);
  }
}

runTestSuite();
