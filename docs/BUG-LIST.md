# Bug List & Technical Debt Register: Prime Apparel ERP

This document catalogs the bugs, race conditions, and minor logic anomalies detected during our project audit, along with the remediation steps applied.

---

## 🐞 Tracked Bugs & Remediation Log

### 1. SQLite Autoincrement Index Mismatch in REST Integration Tests
* **Severity:** 🔴 **High** (Caused test failures)
* **Description:** The `test-suite.js` script hardcoded `buyerId: 1` when creating manual sales orders and verifying stock limits. However, because our seeder cleans out old records using `deleteMany()` without resetting the SQLite sequence counter, the first seeded buyer (`Sneha Garments`) received a higher integer ID (e.g. `17`, `19`). Consequently, creating sales orders with `buyerId: 1` violated database foreign key constraints and crashed the POST `/api/orders` endpoint with a `P2003` Prisma error.
* **Remediation:** 
  * Updated the manual order verification blocks inside `test-suite.js`.
  * Added dynamic buyer queries to the `/api/buyers` endpoint at the start of the tests, identifying the seeded buyer named `"Sneha Garments"` or taking the first available database buyer ID.
  * *Result:* **Integration tests now pass 100% (8/8 Passed).**

### 2. Next.js Hydration Race Condition in Browser UI Tests
* **Severity:** 🔴 **High** (Caused browser test crashes)
* **Description:** When running Puppeteer in `automated-browser-test.js`, the script navigated to pages (`/register`, `/login`) and immediately started typing inputs as soon as `input` elements appeared (`domcontentloaded`). At this exact moment, Next.js had not fully completed React hydration. As a result, characters were entered into the physical DOM text boxes, but the React `onChange` state handlers were not yet attached. Clicking "Next Step" triggered the step validation logic using React's unhydrated empty string state (`""`), wiping out input text on re-render and displaying validation errors.
* **Remediation:**
  * Embedded a hydration safety delay of `1500ms` using `await delay(1500)` right after page navigations and `waitForSelector` events in `automated-browser-test.js` (on the registration wizard, buyer login, and admin login pages).
  * *Result:* **Allows Next.js JS files to fully load and bind handlers. Registration and login transitions now pass flawlessly.**

### 3. Outdated Selector for Guest Catalog Blur Verification
* **Severity:** 🟡 **Medium** (Caused browser test crashes)
* **Description:** The automated browser test was waiting for the selector `.blur-\\[4px\\]` to confirm guest pricing locks in the B2B Wholesale catalog. However, the client component (`src/components/Catalog/CatalogClient.tsx`) was styled using `.blur-[4.5px]`, causing the selector wait to timeout and fail.
* **Remediation:**
  * Updated the selector in `automated-browser-test.js` to use a highly robust wildcard selector `[class*="blur-"]` which matches any blur styling.
  * *Result:* **Ensures that the catalog lock test is completely robust against minor visual design adjustments.**

---

## 🏗 Legacy & Redundant Code (Technical Debt)

### 1. Unused Playwright Script (`tests/login.flow.spec.ts`)
* **Debt Level:** 🟢 **Low**
* **Impact:** Redeems disk space and avoids confusing new developers.
* **Status:** Slated for deletion in `CLEANUP-PLAN.md`.

### 2. Redundant Puppeteer Scripts (`scripts/adminLoginTest.js`, `scripts/adminPanelTest.js`)
* **Debt Level:** 🟡 **Medium**
* **Impact:** Confuses development workflows. These test targets are hardcoded to legacy ports `3000` and `3002` and lack robust event and error handling.
* **Status:** Slated for deletion in `CLEANUP-PLAN.md`.
