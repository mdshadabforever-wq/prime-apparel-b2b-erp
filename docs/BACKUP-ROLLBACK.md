# PRIME APPAREL B2B ERP: DISASTER RECOVERY & ROLLBACK PLAN

This runbook documents the disaster recovery procedure to revert from PostgreSQL back to the local SQLite configuration immediately in the event of production integration failures or unexpected runtime errors.

---

## 🚒 Reverting to SQLite Fallback (Rollback Instructions)

If a PostgreSQL migration fails or causes critical errors in production, follow these steps to restore SQLite locally within 60 seconds:

### Step 1: Restore Original Prisma Schema
Revert your Prisma provider settings back to the SQLite driver:
1. Open `prisma/schema.prisma`.
2. Overwrite the `datasource db` block to target SQLite:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```
   *(Or overwrite `prisma/schema.prisma` with your original backup schema.)*

---

### Step 2: Restore Database File Backup
Verify that your active SQLite file (`prisma/dev.db`) is intact.
- If the file was corrupted or deleted during experiments, restore it from the persistent backup copy (`prisma/dev.db.bak`):
  ```bash
  # PowerShell
  Copy-Item -Path prisma/dev.db.bak -Destination prisma/dev.db -Force
  ```

---

### Step 3: Re-Generate Prisma Client for SQLite
Compile the TypeScript models to match the SQLite configuration:
```bash
npx prisma generate
```

---

### Step 4: Revert Environment variables
Open `.env` and set `DATABASE_URL` back to SQLite:
```env
DATABASE_URL="file:./dev.db"
```

---

### Step 5: Start Local Dev Server
Launch your Next.js application:
```bash
npm run dev
```
The application will immediately resume operation using the local SQLite database.

---

## 🔒 Automated SQLite Database Backups

To ensure data integrity, always create a daily backup of your SQLite file during offline phases:

### Creating a manual backup:
```bash
# PowerShell
Copy-Item -Path prisma/dev.db -Destination prisma/dev.db.bak -Force
```

### PostgreSQL Backups (pg_dump)
Once migrated to PostgreSQL, implement a standard automated backup cron script:
```bash
# Export schema and data to a backup sql file
pg_dump -U db_user -h host_ip -d prime_apparel -F c -b -v -f C:\backups\prime_apparel_backup.dump
```
Restore it dynamically in case of system failures:
```bash
# Restore PostgreSQL dump
pg_restore -U db_user -h host_ip -d prime_apparel -v C:\backups\prime_apparel_backup.dump
```
