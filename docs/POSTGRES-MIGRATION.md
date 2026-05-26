# PRIME APPAREL B2B ERP: SQLITE TO POSTGRESQL MIGRATION GUIDE

This runbook documents the official safe database migration procedure. Follow this guide to transition the ERP from local SQLite (`prisma/dev.db`) to a PostgreSQL database (local or cloud-hosted) without data loss or downtime.

---

## ⚡ High-Level Migration Architecture

To avoid multi-provider conflicts or schema mismatch errors, the migration relies on a **Topological JSON-based Data Porting Engine**.

```mermaid
flowchart LR
    A[(SQLite dev.db)] -->|1. Export Script| B[sqlite-data-export.json]
    B -->|3. Import Script| C[(PostgreSQL DB)]
    D[schema.postgresql.prisma] -->|2. Swap & Push| C
```

---

## 📅 Step-by-Step Execution Sequence

### Phase 1: Capture & Export Existing Data
First, dump all currently seeded buyers, stock levels, orders, and WhatsApp history to a secure JSON package:
```bash
node scripts/export-sqlite.js
```
*   **Result**: Validates connection and writes `prisma/sqlite-data-export.json` containing matching table entries.
*   **Safety**: SQLite remains fully functional as-is; nothing is modified or deleted.

---

### Phase 2: Switch Database Engine in Prisma
Update your Prisma schema configuration to target PostgreSQL:

1.  **Backup Original Schema**:
    Keep a copy of `prisma/schema.prisma` in case of rollback.
2.  **Apply PostgreSQL Schema**:
    Overwrite `prisma/schema.prisma` with the contents of the certified PostgreSQL schema at `prisma/schema.postgresql.prisma`.
3.  **Set Database Credentials**:
    Open `.env` and set `DATABASE_URL` to your PostgreSQL connection string. Ensure the protocol starts with `postgresql://` or `postgres://`.

    *Example Connection String*:
    ```env
    DATABASE_URL="postgresql://postgres:securepass@localhost:5432/prime_apparel?schema=public"
    ```

---

### Phase 3: Push Schema & Generate Client
Initialize the tables on your target PostgreSQL database and re-generate the TypeScript Prisma Client:

```bash
# Generate client models for PostgreSQL
npx prisma generate

# Create tables in PostgreSQL (Local, Neon, AWS RDS etc)
npx prisma db push
```
*   **Note**: Using `db push` is recommended for clean initial setup. If you prefer migration histories, run `npx prisma migrate dev --name init-postgres`.

---

### Phase 4: Import and Reconstruct Data topological order
Populate your target PostgreSQL database with the exported SQLite records:
```bash
node scripts/import-postgres.js
```

This utility performs the following operations:
1.  Loads `prisma/sqlite-data-export.json`.
2.  Inserts rows incrementally in **strict dependency order** to satisfy relational constraints (e.g. Suppliers, Buyers, Products, SalesOrders, CashFlows, and WhatsApp logs).
3.  Executes raw SQL commands to **re-synchronize PostgreSQL auto-increment sequences** (`setval`) to the maximum imported IDs to prevent future record-insertion collisions.

---

## 🔍 Post-Migration Verification Checklist

After importing, run the local verification suite to ensure database connectivity and business logic are 100% compliant:

```bash
# Run backend business logic unit tests
npx tsx tests/verify.js
```

Launch the Puppeteer E2E testing suite in visible mode to verify lead scoring, blurred price locks, manual order creations, and dynamic invoice splits:
```bash
# Run unified web UI automation tests
node tests/ui-browser-test.js
```
All 42+ test assertions should return green passes.
