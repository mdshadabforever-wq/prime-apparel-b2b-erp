/**
 * PRIME APPAREL B2B SYSTEM - OPTIMIZED BROWSER TESTING SUITE
 * 
 * Requirements:
 * 1. npm install puppeteer
 * 2. Next.js server running locally (on http://localhost:3001)
 * 3. Run: node automated-browser-test.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runBrowserQA() {
  console.log('====================================================');
  console.log('   PRIME APPAREL OPTIMIZED BROWSER TEST (PUPPETEER)  ');
  console.log('====================================================\n');

  console.log(`Targeting local server at: ${BASE_URL}\n`);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 20, // Super fast visual typing and clicking
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
  });

  const page = await browser.newPage();

  try {
    // ----------------------------------------------------
    // TEST 1: HOMEPAGE VERIFICATION
    // ----------------------------------------------------
    console.log('⏳ Navigating to Homepage...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    console.log('✅ Homepage loaded.');
    await delay(200); // Small pause for animations
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_homepage.png') });
    console.log('📸 Saved screenshot: 01_homepage.png');

    // ----------------------------------------------------
    // TEST 2: BUYER REGISTRATION FLOW
    // ----------------------------------------------------
    console.log('\n⏳ Navigating to B2B Register Wizard...');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name="fullName"]', { timeout: 3000 });
    
    console.log('✍️ Filling Step 1: Personal Details...');
    await page.type('input[name="fullName"]', 'QA automated Boutique Shop');
    const uniqueMobile = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    await page.type('input[name="mobile"]', uniqueMobile);
    await page.type('input[name="email"]', 'qa_boutique@gmail.com');
    await page.type('input[name="password"]', 'qapassword123');
    await page.type('input[name="confirmPassword"]', 'qapassword123');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_register_step1.png') });
    
    // Click Next & Wait dynamically for Step 2
    console.log('➡️ Advancing to Step 2...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(b => b.textContent.includes('Next Step'));
      if (nextBtn) nextBtn.click();
      else throw new Error('Next Step button not found in Step 1');
    });
    await page.waitForSelector('input[name="businessName"]', { timeout: 3000 });

    // Step 2: Business details
    console.log('✍️ Filling Step 2: Shop details...');
    await page.type('input[name="businessName"]', 'QA Widescreen Prints Ltd');
    await page.select('select[name="businessType"]', 'BOUTIQUE');
    await page.select('select[name="yearsInBusiness"]', '3-5');
    await page.type('input[name="gstNumber"]', '27BBBBB9999A1Z2');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_register_step2.png') });
    
    // Click Next & Wait dynamically for Step 3
    console.log('➡️ Advancing to Step 3...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(b => b.textContent.includes('Next Step'));
      if (nextBtn) nextBtn.click();
      else throw new Error('Next Step button not found in Step 2');
    });
    await page.waitForSelector('input[name="city"]', { timeout: 3000 });

    // Step 3: Location
    console.log('✍️ Filling Step 3: City and address...');
    await page.type('input[name="city"]', 'Mumbai');
    await page.select('select[name="state"]', 'Maharashtra');
    await page.type('input[name="pincode"]', '400050');
    await page.type('textarea[name="address"]', 'Bandra link road cargo center, shop 12');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_register_step3.png') });
    
    // Click Next & Wait dynamically for Step 4
    console.log('➡️ Advancing to Step 4...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(b => b.textContent.includes('Next Step'));
      if (nextBtn) nextBtn.click();
      else throw new Error('Next Step button not found in Step 3');
    });
    await page.waitForSelector('input[name="instagramLink"]', { timeout: 3000 });

    // Step 4: Social link
    console.log('✍️ Filling Step 4: Socials presence...');
    await page.type('input[name="instagramLink"]', 'https://instagram.com/qaprintsboutique');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_register_step4.png') });
    
    // Click Next & Wait dynamically for Step 5
    console.log('➡️ Advancing to Step 5...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(b => b.textContent.includes('Next Step'));
      if (nextBtn) nextBtn.click();
      else throw new Error('Next Step button not found in Step 4');
    });
    await page.waitForSelector('select[name="expectedMonthlyPurchase"]', { timeout: 3000 });

    // Step 5: Preferences
    console.log('✍️ Filling Step 5: Preferences...');
    await page.select('select[name="expectedMonthlyPurchase"]', '500-1000');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_register_step5.png') });
    
    // Submit & Wait dynamically for Success Scorecard
    console.log('🚀 Submitting form and calculating Lead Score...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Submit Registration'));
      if (submitBtn) submitBtn.click();
      else throw new Error('Submit Registration button not found in Step 5');
    });
    
    // Wait until B2B Lead scorecard is written to database and loaded visually
    await page.waitForFunction(() => document.body.innerText.includes('Registration Received'), { timeout: 5000 });
    await delay(300); // Minor settle pause
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_register_success.png') });
    console.log('📸 Saved registration success scorecard: 07_register_success.png');

    // ----------------------------------------------------
    // TEST 3: GUEST CATALOG WITH BLURRED PRICES
    // ----------------------------------------------------
    console.log('\n⏳ Checking Guest Catalog (Blurred Prices)...');
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.blur-\\[4px\\]', { timeout: 3000 }); // Waits for guest pricing locks to show
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_catalog_guest_blurred.png') });
    console.log('📸 Saved guest catalog: 08_catalog_guest_blurred.png');

    // ----------------------------------------------------
    // TEST 4: UNIFIED AUTH & BUYER CATALOG FLOW
    // ----------------------------------------------------
    console.log('\n⏳ Logging in as approved B2B Buyer...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="text"]', { timeout: 3000 });
    
    await page.type('input[type="text"]', '919876543210');
    await page.type('input[type="password"]', 'buyer123');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_login_filled.png') });
    
    console.log('🚀 Logging in...');
    await page.click('button[type="submit"]');
    // Wait dynamically for catalog grid layout instead of networkidle2
    await page.waitForFunction(() => document.body.innerText.includes('Enquiry') || document.body.innerText.includes('Wholesale Price'), { timeout: 6000 });
    console.log('✅ Logged in as Buyer. Unlocked Catalog displayed.');
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_catalog_unlocked.png') });
    console.log('📸 Saved unlocked catalog: 10_catalog_unlocked.png');

    // ----------------------------------------------------
    // TEST 5: ADMIN ERP PANEL & DASHBOARD VERIFICATION
    // ----------------------------------------------------
    console.log('\n⏳ Logging in as administrative Staff...');
    const activeCookies = await page.cookies();
    await page.deleteCookie(...activeCookies); // Clear buyer session
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="text"]', { timeout: 3000 });
    
    await page.type('input[type="text"]', '919999999999');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait dynamically for admin workspace side bar to load
    await page.waitForSelector('aside', { timeout: 5000 });
    console.log('✅ Staff logged in. Admin Workspace loaded.');
    await delay(300); // Pause to let overview graphs compile
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_admin_overview.png') });
    console.log('📸 Saved Overview dashboard: 11_admin_overview.png');

    // Navigate to Sales orders
    console.log('⏳ Navigating to Sales Orders Tab...');
    await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table', { timeout: 3000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_admin_orders.png') });
    console.log('📸 Saved Sales Orders: 12_admin_orders.png');

    // Navigate to B2B Buyers
    console.log('⏳ Navigating to Buyers Directory Tab...');
    await page.goto(`${BASE_URL}/admin/buyers`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table', { timeout: 3000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_admin_buyers.png') });
    console.log('📸 Saved Buyers Directory: 13_admin_buyers.png');

    // Navigate to Stock list
    console.log('⏳ Navigating to SKU Inventory Tab...');
    await page.goto(`${BASE_URL}/admin/stock`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table', { timeout: 3000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_admin_stock.png') });
    console.log('📸 Saved SKU Inventory: 14_admin_stock.png');

    // Navigate to Leads Board
    console.log('⏳ Navigating to CRM Leads Board Tab...');
    await page.goto(`${BASE_URL}/admin/leads`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table', { timeout: 3000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_admin_leads.png') });
    console.log('📸 Saved CRM Leads board: 15_admin_leads.png');

    // Navigate to Cashflow
    console.log('⏳ Navigating to Cash Flow Ledger Tab...');
    await page.goto(`${BASE_URL}/admin/cashflow`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table', { timeout: 3000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16_admin_cashflow.png') });
    console.log('📸 Saved Cash Flow Ledger: 16_admin_cashflow.png');

    // Navigate to WhatsApp Simulator
    console.log('⏳ Navigating to WhatsApp Sandbox Simulator Tab...');
    await page.goto(`${BASE_URL}/admin/whatsapp`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[placeholder*="manual reply"]', { timeout: 3000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '17_admin_whatsapp_sandbox.png') });
    console.log('📸 Saved WhatsApp Sandbox: 17_admin_whatsapp_sandbox.png');

    console.log('\n🎉 ALL OPTIMIZED BROWSER FLOW TESTS COMPLETED SUCCESSFUL!');
  } catch (err) {
    console.error(`\n❌ ERROR ENCOUNTERED DURING BROWSER VERIFICATION: ${err.message}`);
    // await browser.close(); // Keep browser open after tests complete per user request
    console.log('\n====================================================');
    console.log('        AUTOMATED BROWSER AUDIT SEQUENCE CLOSED      ');
    console.log('====================================================');
  }
}

function delay(time) {
  return new Promise(function(resolve) { 
    setTimeout(resolve, time)
  });
}

runBrowserQA();
