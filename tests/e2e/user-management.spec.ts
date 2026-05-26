import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000'; // Next.js is running on 3000 dynamically
const ADMIN_MOBILE = '919999999999';
const ADMIN_PASSWORD = 'admin123';

const TEST_STAFF_NAME = 'QC Inspector Suresh';
const TEST_STAFF_MOBILE = '918555555555';
const TEST_STAFF_EMAIL = 'suresh.qc@primeapparel-test.in';
const TEST_STAFF_PASS = 'sureshPass123';

async function capture(page: any, name: string) {
  // Save screenshots in artifacts/qa for walkthrough visualization
  await page.screenshot({ path: `artifacts/qa/${name}.png`, fullPage: true });
}

test.describe('Prime Apparel Role-Based User Management E2E Flow', () => {

  test('Complete Admin Control and Employee Lifecycle Validation', async ({ page }) => {
    test.setTimeout(120000);
    // 1. Visit Login Page as Admin
    console.log('⏳ Visiting Login Page as Admin...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await capture(page, 'rbac_01_login_page');

    // 2. Log in with Founder/Admin credentials
    console.log('✍️ Logging in as administrative founder...');
    await page.fill('input[type="text"]', ADMIN_MOBILE);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // 3. Verify Dashboard workspace loads
    console.log('🟢 Waiting for Admin dashboard layout...');
    await page.waitForSelector('aside', { timeout: 15000 });
    await capture(page, 'rbac_02_dashboard_loaded');

    // 4. Navigate to Users & RBAC Directory
    console.log('⏳ Navigating to User Management directory...');
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('h1', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('ROLE-BASED USER MANAGEMENT');
    await capture(page, 'rbac_03_users_panel');

    // 5. Open Create Employee Modal
    console.log('➕ Opening Onboard Employee modal...');
    await page.click('button:has-text("Add Employee")');
    await page.waitForSelector('header:has-text("Onboard Department Employee")', { timeout: 5000 });
    await capture(page, 'rbac_04_create_modal');

    // 6. Fill out new Employee Form
    console.log('✍️ Filling employee creation form...');
    await page.fill('input[placeholder="e.g. Anil Kumar"]', TEST_STAFF_NAME);
    await page.fill('input[placeholder="e.g. 9876543210"]', TEST_STAFF_MOBILE);
    await page.fill('input[placeholder="e.g. anil@primeapparel.in"]', TEST_STAFF_EMAIL);
    await page.fill('input[placeholder="Set initial password"]', TEST_STAFF_PASS);
    
    // Choose INVENTORY role preset
    await page.selectOption('select', 'INVENTORY');
    await page.waitForTimeout(500); // Wait for preset permissions update
    await capture(page, 'rbac_05_create_filled');

    // Submit form
    console.log('🚀 Submitting new employee registration...');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('table')).toContainText(TEST_STAFF_NAME, { timeout: 15000 });
    await capture(page, 'rbac_06_user_created_in_table');

    // 7. Test Route-Protection Middleware: Clear session cookies to log out admin
    console.log('🧹 Clearing cookies to simulate new employee login...');
    await page.context().clearCookies();

    // Visit login again
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });

    // Log in as the new QC Employee
    console.log('✍️ Logging in as newly onboarded QC Inspector...');
    await page.fill('input[type="text"]', TEST_STAFF_MOBILE);
    await page.fill('input[type="password"]', TEST_STAFF_PASS);
    await page.click('button[type="submit"]');

    // Wait for the redirect: should go to an allowed department route (/admin/stock or similar)
    console.log('🔄 Checking automatic redirect to allowed department path...');
    await page.waitForURL(url => url.pathname.includes('/admin/stock') || url.pathname.includes('/admin/orders'), { timeout: 15000 });
    await expect(page.url()).toMatch(/\/admin\/(stock|orders)/);
    await capture(page, 'rbac_07_employee_redirected_to_allowed_path');

    // Try to access restricted User Management panel (/admin/users)
    console.log('🛡️ Attempting to bypass route protections to access /admin/users...');
    await page.goto(`${BASE_URL}/admin/users`);
    
    // Middleware should immediately block them and redirect back to their allowed route or catalog
    await page.waitForTimeout(2000);
    await expect(page.url()).not.toContain('/admin/users');
    await capture(page, 'rbac_08_employee_blocked_by_middleware');

    // 8. Test Account Blocking: Log back in as Admin
    console.log('🧹 Logging back in as Admin...');
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', ADMIN_MOBILE);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('aside', { timeout: 15000 });
    
    // Go to User Management
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table', { timeout: 10000 });

    // Toggle status to BLOCKED
    console.log('⛔ Blocking the employee account...');
    const statusBtn = page.locator(`tr:has-text("${TEST_STAFF_NAME}") button:has-text("ACTIVE")`);
    await expect(statusBtn).toBeVisible();
    await statusBtn.click();
    
    const blockedBtn = page.locator(`tr:has-text("${TEST_STAFF_NAME}") button:has-text("BLOCKED")`);
    await expect(blockedBtn).toBeVisible({ timeout: 15000 });
    await capture(page, 'rbac_09_employee_blocked');

    // Clear session cookies and try logging in as blocked employee
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', TEST_STAFF_MOBILE);
    await page.fill('input[type="password"]', TEST_STAFF_PASS);
    await page.click('button[type="submit"]');

    // Verify inactive account rejection error message
    console.log('❌ Verifying block credentials rejection...');
    await page.waitForSelector('text=inactive', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('inactive');
    await capture(page, 'rbac_10_blocked_login_rejected');

    // 9. Clean up database: Log back in as admin and delete test employee
    console.log('🧹 Logging in as Admin for final database cleanup...');
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', ADMIN_MOBILE);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('aside', { timeout: 15000 });

    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('table', { timeout: 10000 });

    // Click delete action
    console.log('🗑️ Deleting test employee record...');
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('permanently DELETE');
      await dialog.accept();
    });

    const deleteBtn = page.locator(`tr:has-text("${TEST_STAFF_NAME}") button[title="Delete Account"]`);
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Verify it is gone from listing
    await expect(page.locator('table')).not.toContainText(TEST_STAFF_NAME, { timeout: 15000 });
    await capture(page, 'rbac_11_database_cleaned_up');
    console.log('🎉 E2E User Management Test completed successfully!');
  });
});
