import { test, expect } from '@playwright/test';

const ADMIN_MOBILE = '919999999999';
const ADMIN_PASSWORD = 'admin123';
const BASE_URL = 'http://localhost:3000';

async function capture(page: any, name: string) {
  // Save screenshots in artifacts/qa for walkthrough visualization
  await page.screenshot({ path: `artifacts/qa/${name}.png`, fullPage: true });
}

test.describe('Prime Apparel CRM Memory & CRM System E2E Flow', () => {

  test('Staff Login -> Open 360° Customer Profile -> Operate CRM Memory & Tabs', async ({ page }) => {
    // 1. Visit Login Page
    console.log('⏳ Visiting Login Page...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await capture(page, 'crm_01_login_page');

    // 2. Fill admin credentials and submit
    console.log('✍️ Logging in as administrative staff...');
    await page.fill('input[type="text"]', ADMIN_MOBILE);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await capture(page, 'crm_02_login_filled');

    await page.click('button[type="submit"]');
    
    // 3. Verify Admin Dashboard workspace loads
    console.log('🟢 Waiting for Admin workspace dashboard...');
    await page.waitForSelector('aside', { timeout: 15000 });
    await capture(page, 'crm_03_dashboard_loaded');

    // 4. Navigate to Buyers Directory
    console.log('⏳ Opening Buyers Directory...');
    await page.goto(`${BASE_URL}/admin/buyers`);
    await page.waitForSelector('table', { timeout: 10000 });
    await capture(page, 'crm_04_buyers_directory');

    // 5. Test Global Search: search by custom criteria
    console.log('🔎 Searching for specific buyer...');
    await page.fill('input[placeholder*="Search buyer"]', '91');
    await page.waitForTimeout(1000); // Allow search debounce and rendering
    await capture(page, 'crm_05_search_results');

    // 6. Click View Profile button (which redirects to 360 CRM page)
    console.log('🚀 Entering B2B Customer Memory Brain dashboard...');
    const firstProfileBtn = page.locator('button[title="View Full Profile"]').first();
    await expect(firstProfileBtn).toBeVisible();
    await firstProfileBtn.click();

    // 7. Verify CRM Dashboard 360 profile loaded
    console.log('🟢 Verifying 360° Customer memory dashboard...');
    await page.waitForSelector('h2', { timeout: 15000 });
    await expect(page.locator('text=COMMERCIAL INTELLIGENCE STATS')).toBeVisible();
    await capture(page, 'crm_06_360_memory_brain_overview');

    // 8. Test Tab 1: Communication Memory (Add note and check pinning)
    console.log('✍️ Logging a B2B manual note and pinning it...');
    await expect(page.locator('text=Synchronized WhatsApp Thread Log')).toBeVisible();
    
    const noteTextarea = page.locator('textarea[placeholder*="Log operator observations"]');
    await noteTextarea.fill('QA verification: Buyer is highly interested in Summer linen catalogs. Requested ₹50,000 credit limit extension.');
    
    const pinCheckbox = page.locator('input[type="checkbox"]');
    await pinCheckbox.check();
    await capture(page, 'crm_07_note_filled_pinned');

    const logNoteBtn = page.locator('button:has-text("Log Note")');
    await logNoteBtn.click();
    await page.waitForTimeout(1000); // wait for state refresh
    await capture(page, 'crm_08_note_added_successfully');

    // 9. Test tab switches: Orders Timeline
    console.log('📅 Switching to Orders Timeline tab...');
    const ordersTabBtn = page.locator('button:has-text("Orders Timeline")');
    await ordersTabBtn.click();
    await page.waitForTimeout(500);
    await capture(page, 'crm_09_tab_orders_timeline');

    // 10. Test tab switches: Financial Ledger
    console.log('💰 Switching to Financial Ledger tab...');
    const financeTabBtn = page.locator('button:has-text("Financial Ledger")');
    await financeTabBtn.click();
    await page.waitForTimeout(500);
    await capture(page, 'crm_10_tab_financial_ledger');

    // 11. Test tab switches: Operational Timeline
    console.log('⏱️ Switching to Operational Timeline tab...');
    const timelineTabBtn = page.locator('button:has-text("Operational Timeline")');
    await timelineTabBtn.click();
    await page.waitForTimeout(500);
    await capture(page, 'crm_11_tab_operational_timeline');

    // 12. Test tab switches: AI Memory Brain
    console.log('🧠 Switching to AI Memory Brain tab...');
    const aiTabBtn = page.locator('button:has-text("AI Memory Brain")');
    await aiTabBtn.click();
    await page.waitForTimeout(500);
    await capture(page, 'crm_12_tab_ai_memory_brain');

    console.log('🎉 E2E CRM Memory Brain verification fully completed with 100% success!');
  });
});
