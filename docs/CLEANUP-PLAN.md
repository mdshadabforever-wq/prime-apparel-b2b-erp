# Cleanup and Reorganization Plan: Prime Apparel ERP

This document outlines the dead files, duplicate scripts, temporary test remnants, and unused components identified during our codebase audit, and provides a clear plan to clean them up.

---

## 🗑 Identified Dead & Duplicate Files

During the audit, we detected several files at the root and in subfolders that are redundant, unused, or overlap in functionality.

### 1. Root and Script Folder Redundancies
* **`tests/login.flow.spec.ts` [DELETE]**
  * **Why:** This is a Playwright test file. Playwright is **not** installed in the project dependencies (`package.json`). All frontend visual flows are now successfully covered by our comprehensive Puppeteer-based test suite (`automated-browser-test.js`).
* **`scripts/adminLoginTest.js` [DELETE]**
  * **Why:** This is a legacy Puppeteer script that performs a basic login check on `localhost:3000`. It has been completely superseded by `automated-browser-test.js` which verifies all 17 administrative routes on the correct port `3001` with proper hydration delay offsets.
* **`scripts/adminPanelTest.js` [DELETE]**
  * **Why:** This is a legacy test script targeting `localhost:3002`. It is dead code and overlaps with the comprehensive browser test suite.

### 2. Static Prompt Folders (Remnants of Generator Prompts)
The folders `01-Website`, `02-Backend`, `03-WhatsApp-Bot`, `04-AI-Agent`, `05-Dashboard`, and `06-Integrations` do not contain any source code. Instead, they contain static text files with prompts (e.g., `prompt-bot-flow.txt`, `prompt-admin-dashboard.txt`, etc.).
* **Recommendation:** Consolidate all these prompt files into a single, clean `.system_prompts/` directory to prevent workspace clutter while preserving useful generation references.

---

## 📂 Proposed Clean Folder Structure

Without rebuilding the core Next.js architecture, here is the clean directory structure for documentation and auxiliary scripts:

```
Prime-Apparel-System/
├── .next/                     # Next.js build cache (ignored by audit)
├── prisma/                    # SQLite database, schema, and seed
│   ├── dev.db                 # Seeded dev database
│   ├── schema.prisma          # Database schema models
│   └── seed.js                # Database seeder
├── src/                       # Core Next.js Application Source
│   ├── app/                   # App Router Pages & API Routes
│   ├── components/            # UI Components (NavBar, CatalogClient)
│   ├── lib/                   # Internal Core Libraries (auth, db, scoring, whatsapp)
│   └── middleware.ts          # Protected route role router middleware
├── docs/                      # Clean Documentation (Reorganized)
│   ├── PROJECT-STATUS.md      # Detailed Status Audit
│   ├── CLEANUP-PLAN.md        # This File
│   ├── CURRENT-ARCHITECTURE.md # Architecture & Data Flows
│   ├── FEATURE-MATRIX.md      # Feature Matrix & Completeness
│   └── BUG-LIST.md            # Tracked Issues & Fixes
├── prompts/                   # Consolidated System Prompts Folder [REORGANIZED]
│   ├── website-prompts/
│   ├── backend-prompts/
│   └── whatsapp-prompts/
├── tests/                     # Active Integration Tests
│   ├── api-test-suite.js      # Formerly test-suite.js (renamed for clarity)
│   ├── ui-browser-test.js     # Formerly automated-browser-test.js (renamed)
│   └── verify.js              # Standard lib utility validator (scoring & AI FAQ)
├── screenshots/               # Puppeteer UI Screenshot Artifacts
├── .env                       # Local Environment configs
├── package.json               # Dependencies and run scripts
└── tsconfig.json              # TypeScript configuration
```

---

## 📋 Recommended Cleanup Execution

### Phase 1: Consolidated Prompt Storage
1. Create a `prompts/` directory at the root.
2. Move the text files inside folders `01-Website` to `06-Integrations` into clean folders inside `prompts/` (e.g., `prompts/website/`, `prompts/backend/`).
3. Delete the empty `01-Website` ... `06-Integrations` folders.

### Phase 2: Purging Legacy and Duplicate Scripts
1. Delete `scripts/adminLoginTest.js`.
2. Delete `scripts/adminPanelTest.js`.
3. Remove the empty `scripts/` folder.
4. Delete `tests/login.flow.spec.ts`.

### Phase 3: File Renaming & Document Organization
1. Create a `docs/` folder.
2. Move all generated documentation (`PROJECT-STATUS.md`, `CLEANUP-PLAN.md`, `CURRENT-ARCHITECTURE.md`, `FEATURE-MATRIX.md`, `BUG-LIST.md`) into `docs/`.
3. Rename `test-suite.js` to `tests/api-test-suite.js` to keep the root tidy.
4. Rename `automated-browser-test.js` to `tests/ui-browser-test.js`.
5. Move `verify.js` to `tests/verify.js`.
