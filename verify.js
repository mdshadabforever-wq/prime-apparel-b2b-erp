const { calculateLeadScore } = require("./src/lib/scoring");
const { queryFAQBrain } = require("./src/lib/whatsapp");
const bcrypt = require("bcryptjs");

async function runTests() {
  console.log("=========================================");
  console.log("   PRIME APPAREL OPERATING SYSTEM TESTS   ");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] - ${message}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] - ${message}`);
      failed++;
    }
  }

  // TEST 1: Password Hash Comparer
  try {
    const rawPass = "buyer123";
    const hashed = await bcrypt.hash(rawPass, 10);
    const isValid = await bcrypt.compare(rawPass, hashed);
    assert(isValid === true, "Password hashing and comparison logic matches standard crypt rules");
  } catch (e) {
    assert(false, `Password Test failed: ${e.message}`);
  }

  // TEST 2: Dynamic Lead Scoring Scenarios
  try {
    // Scenario 1: Highly qualified GST-registered retail shop (HOT)
    const hotResult = calculateLeadScore({
      businessType: "OFFLINE_RETAIL", // 15
      onlinePresenceTier: "active_ig_google", // 15
      locationTier: "tier12_market", // 10
      activityLevel: "daily", // 15
      productFit: "ethnic_primary", // 20
      expectedQtyRange: "qty_500", // 15
      gstStatus: "gst_shared",
      gstNumber: "27AAAAA1111A1Z1" // 10
    });
    
    assert(hotResult.score === 100, `Highly qualified lead scores a clean 100/100 (Got: ${hotResult.score})`);
    assert(hotResult.leadStatus === "HOT", `Score 100 maps correctly to 'HOT' lead tier (Got: ${hotResult.leadStatus})`);

    // Scenario 2: Small reseller starting out without GST or IG (COLD)
    const coldResult = calculateLeadScore({
      businessType: "OTHER", // 5
      onlinePresenceTier: "none", // 3
      locationTier: "unclear", // 2
      activityLevel: "dormant", // 2
      productFit: "different_category", // 2
      expectedQtyRange: "qty_less_50", // 2
      gstStatus: "evasive" // 1
    });

    assert(coldResult.score === 17, `Unqualified small reseller scores 17/100 (Got: ${coldResult.score})`);
    assert(coldResult.leadStatus === "COLD", `Score 17 maps correctly to 'COLD' drip-only status (Got: ${coldResult.leadStatus})`);
  } catch (e) {
    assert(false, `Lead Scoring Test failed: ${e.message}`);
  }

  // TEST 3: Chatbot FAQ Search Confidence
  try {
    const q1 = "Minimum order kitna hai?";
    const res1 = queryFAQBrain(q1);
    assert(res1.confidence > 70, `Asking exact FAQ: '${q1}' yields high matching confidence (${res1.confidence}%)`);
    assert(res1.answer.includes("12 pieces per design"), `MOQ answer mentions the strict '12 pieces' limit`);

    const q2 = "Kaunse cloth/fabrics milenge?";
    const res2 = queryFAQBrain(q2);
    assert(res2.confidence > 50, `Asking organic question: '${q2}' resolves keywords to 'fabrics' FAQ`);
    assert(res2.answer.includes("Cambric Cotton") || res2.answer.includes("Cotton"), `Fabrics details lists correct fabric blends`);
  } catch (e) {
    assert(false, `Chatbot AI Test failed: ${e.message}`);
  }

  console.log("\n=========================================");
  console.log(`   TESTS COMPLETED: ${passed} Passed, ${failed} Failed`);
  console.log("=========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
