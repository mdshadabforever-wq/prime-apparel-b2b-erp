// tests/e2e/gst-verify-live.spec.ts
import { test, expect } from '@playwright/test';

/**
 * End‑to‑end GST verification flow using a real GSTIN.
 * Steps:
 *   1. Open ERP buyer onboarding page.
 *   2. Enable "Registered GST Customer" toggle.
 *   3. Enter GSTIN (27FLJPS0304G1Z5).
 *   4. Click "Verify GST" – backend returns a CAPTCHA image.
 *   5. Wait for manual CAPTCHA entry by the operator.
 *   6. Submit and verify autofill of buyer details.
 *   7. Capture screenshots at each major step.
 *   8. Repeat on a mobile viewport to validate responsiveness.
 */

const GSTIN = '27FLJPS0304G1Z5';
const BUYER_ONBOARD_URL = 'http://localhost:3000/admin/buyers'; // Adjust if needed

async function capture(page: any, name: string) {
  await page.screenshot({ path: `artifacts/qa/${name}.png`, fullPage: true });
}

test.describe('Real GST Verification Flow', () => {
  // Desktop flow first
  test('Desktop flow with manual CAPTCHA', async ({ page }) => {
    await page.goto(BUYER_ONBOARD_URL);
    await capture(page, '01_home_desktop');

    // GST toggle – assumes data-test-id="gst-toggle"
    const gstToggle = page.locator('[data-test-id="gst-toggle"]');
    await expect(gstToggle).toBeVisible();
    await gstToggle.click();
    await capture(page, '02_toggle_clicked');

    // GSTIN input – assumes input[name="gstin"]
    const gstInput = page.locator('input[name="gstin"]');
    await gstInput.fill(GSTIN);
    await capture(page, '03_gstin_entered');

    // Verify button – assumes data-test-id="verify-gst-button"
    const verifyButton = page.locator('[data-test-id="verify-gst-button"]');
    await verifyButton.click();
    const captchaModal = page.locator('[data-test-id="gst-captcha-modal"]');
    await expect(captchaModal).toBeVisible({ timeout: 15000 });
    await capture(page, '04_captcha_modal');

    // Pause for manual CAPTCHA entry (up to 5 minutes)
    const submitButton = captchaModal.locator('[data-test-id="captcha-submit-button"]');
    await expect(submitButton).toBeEnabled({ timeout: 300000 });
    await submitButton.click();
    await capture(page, '05_captcha_submitted');

    // Verify autofilled fields
    const legalName = page.locator('[data-test-id="buyer-legal-name"]');
    const tradeName = page.locator('[data-test-id="buyer-trade-name"]');
    const gstStatus = page.locator('[data-test-id="buyer-gst-status"]');
    const address = page.locator('[data-test-id="buyer-address"]');
    const stateCode = page.locator('[data-test-id="buyer-state-code"]');

    await expect(legalName).toHaveValue(/.+/);
    await expect(tradeName).toHaveValue(/.+/);
    await expect(gstStatus).toHaveText(/Active|Inactive/);
    await expect(address).toHaveValue(/.+/);
    await expect(stateCode).toHaveText(/^27$/);
    await capture(page, '06_fields_autofilled');
  });

  // Mobile responsiveness test – same flow on handset viewport
  test('Mobile flow with manual CAPTCHA', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BUYER_ONBOARD_URL);
    await capture(page, '01_home_mobile');

    const gstToggle = page.locator('[data-test-id="gst-toggle"]');
    await gstToggle.click();
    await capture(page, '02_toggle_mobile');

    const gstInput = page.locator('input[name="gstin"]');
    await gstInput.fill(GSTIN);
    await capture(page, '03_gstin_mobile');

    const verifyButton = page.locator('[data-test-id="verify-gst-button"]');
    await verifyButton.click();
    const captchaModal = page.locator('[data-test-id="gst-captcha-modal"]');
    await expect(captchaModal).toBeVisible({ timeout: 15000 });
    await capture(page, '04_captcha_mobile');

    const submitButton = captchaModal.locator('[data-test-id="captcha-submit-button"]');
    await expect(submitButton).toBeEnabled({ timeout: 300000 });
    await submitButton.click();
    await capture(page, '05_captcha_submitted_mobile');

    const legalName = page.locator('[data-test-id="buyer-legal-name"]');
    await expect(legalName).toHaveValue(/.+/);
    await capture(page, '06_fields_autofilled_mobile');
  });
});
