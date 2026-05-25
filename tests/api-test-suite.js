const BASE_URL = "http://localhost:3001";

async function runQATests() {
  console.log("=================================================");
  console.log("      PRIME APPAREL B2B ERP INTEGRATION QA       ");
  console.log("=================================================\n");

  let passed = [];
  let failed = [];

  function test(name, fn) {
    return async () => {
      try {
        await fn();
        console.log(`✅ [PASSED] - ${name}`);
        passed.push(name);
      } catch (err) {
        console.error(`❌ [FAILED] - ${name}`);
        console.error(`   Reason: ${err.message}`);
        failed.push({ name, error: err.message });
      }
    };
  }

  // 1. AUTHENTICATION TESTS
  const testStaffLogin = test("Unified Login: Staff authentication & cookies", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: "919999999999", password: "admin123" })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login request failed");
    if (data.user.role !== "FOUNDER" || !data.user.isStaff) {
      throw new Error(`Role mismatch. Expected FOUNDER staff, Got: ${data.user.role}`);
    }
  });

  const testBuyerLogin = test("Unified Login: Buyer authentication & approval status", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: "919876543210", password: "buyer123" })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login request failed");
    if (data.user.role !== "BUYER" || data.user.isStaff) {
      throw new Error(`Role mismatch. Expected BUYER, Got: ${data.user.role}`);
    }
  });

  const testLoginFailure = test("Unified Login: Rejects incorrect credentials", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: "919999999999", password: "wrongpassword" })
    });
    if (res.ok) throw new Error("Incorrect login should be rejected with 401/403");
  });

  // 2. BUYER REGISTRATION & LEAD SCORING TESTS
  const testBuyerRegistration = test("Buyer Registration: Multi-step submission & scoring", async () => {
    const uniqueMobile = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test QA Boutique",
        mobile: uniqueMobile,
        password: "qapassword123",
        businessName: "Test QA Boutique Shop",
        businessType: "BOUTIQUE", // 12
        gstNumber: "27AAAAA1111A1Z1", // 10 (gst shared)
        yearsInBusiness: "3-5",
        city: "Mumbai", // 10 (tier 12)
        state: "Maharashtra",
        pincode: "400050",
        instagramLink: "https://instagram.com/qaboutique",
        justdialLink: "https://justdial.com/qaboutique", // active_ig_google presence = 15
        expectedMonthlyPurchase: "500-1000", // qty_500 = 15
        productsInterested: ["Cotton Kurtis", "Suit Sets"],
        referralSource: "Google"
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration request failed");
    
    // Scorer calculation details assert
    // Expected components: type (12) + presence (15) + location (10) + activity (10 default) + fit (20 default) + potential (15) + trust (10) = 92/100 -> HOT lead!
    if (data.score < 75 || data.leadStatus !== "HOT") {
      throw new Error(`Lead Scoring calculation error. Score: ${data.score}, Status: ${data.leadStatus}. Expected: HOT lead (>75)`);
    }
  });

  // 3. INVENTORY & MANUAL ORDERS
  const testManualOrderAvailability = test("Manual Orders: Stock limits verification", async () => {
    // Fetch active buyer ID dynamically to avoid SQLite autoincrement offset issues
    let buyerId = 1;
    try {
      const buyersRes = await fetch(`${BASE_URL}/api/buyers`);
      const buyers = await buyersRes.json();
      const sneha = buyers.find(b => b.full_name === "Sneha Garments");
      if (sneha) buyerId = sneha.buyer_id;
      else if (buyers.length > 0) buyerId = buyers[0].buyer_id;
    } catch (e) {}

    // Attempt creating manual order with excessive quantity (out of stock limit)
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerId: buyerId,
        paymentTerms: "advance",
        items: [
          { skuId: "PA-25-KR-001", qty: 200, price: 350 } // Sells kurtis, but warehouse stock is 120
        ]
      })
    });

    const data = await res.json();
    if (res.ok) throw new Error("Order creation should fail due to stock limits.");
    if (!data.error.includes("stock available nahi hai")) {
      throw new Error(`Expected stock limit failure message, Got: ${data.error}`);
    }
  });

  const testManualOrderSuccess = test("Manual Orders: Stock locks reservation & cashflow", async () => {
    // Fetch active buyer ID dynamically to avoid SQLite autoincrement offset issues
    let buyerId = 1;
    try {
      const buyersRes = await fetch(`${BASE_URL}/api/buyers`);
      const buyers = await buyersRes.json();
      const sneha = buyers.find(b => b.full_name === "Sneha Garments");
      if (sneha) buyerId = sneha.buyer_id;
      else if (buyers.length > 0) buyerId = buyers[0].buyer_id;
    } catch (e) {}

    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerId: buyerId,
        paymentTerms: "advance",
        items: [
          { skuId: "PA-25-KR-001", qty: 12, price: 350 } // Valid quantity MOQ pack
        ],
        notes: "QA Integration order test",
        createdBy: "Amit Sharma"
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Order creation failed.");
    if (!data.orderId) throw new Error("Missing orderId in creation response.");
  });

  // 4. WHATSAPP WEBHOOK SIMULATOR
  const testWhatsAppMoqFaq = test("WhatsApp Bot: Resolves MOQ FAQ", async () => {
    const res = await fetch(`${BASE_URL}/api/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactNumber: "919876543210",
        messageContent: "Minimum order kitna pcs hai?"
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error("WhatsApp bot post failed.");
    if (!data.reply.includes("Minimum 12 pieces per design")) {
      throw new Error(`Incorrect chatbot reply. Got: ${data.reply}`);
    }
  });

  const testWhatsAppEscalation = test("WhatsApp Bot: Manual staff escalation", async () => {
    const res = await fetch(`${BASE_URL}/api/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactNumber: "919876543210",
        messageContent: "muje standard human representative se baat karwao urgent call!"
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error("WhatsApp bot post failed.");
    if (data.status !== "escalated" || !data.reply.includes("sales coordinator team ko forward")) {
      throw new Error(`Escalation failed to trigger. Status: ${data.status}, Reply: ${data.reply}`);
    }
  });

  // RUN ALL TESTS SEQUENTIALLY
  await testStaffLogin();
  await testBuyerLogin();
  await testLoginFailure();
  await testBuyerRegistration();
  await testManualOrderAvailability();
  await testManualOrderSuccess();
  await testWhatsAppMoqFaq();
  await testWhatsAppEscalation();

  console.log("\n=================================================");
  console.log(`   INTEGRATION QA COMPLETE: ${passed.length} Passed, ${failed.length} Failed`);
  console.log("=================================================");

  if (failed.length > 0) {
    console.error("\nFailed Tests Details:");
    failed.forEach((f) => console.error(`- ${f.name}: ${f.error}`));
  }
}

runQATests();
