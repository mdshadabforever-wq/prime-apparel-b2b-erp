# Founder Master Guide

## 🎯 Purpose
This manual is the **operating handbook** for the Founder/Administrator of **Prime Apparel ERP**. It provides a complete view of the system, step‑by‑step instructions for every control point, and best‑practice recommendations for scaling, backup, and troubleshooting.

---

## 1️⃣ System Overview
- **Architecture** – Next.js (App Router) front‑end, TypeScript API layer, Prisma ORM, PostgreSQL (Neon) back‑end.
- **Core Modules** – Buyers, Inventory, Pricing, Orders, Invoicing, GST verification, CRM Memory Brain, RBAC/Department Management, Auditing, Dashboard visualisations.
- **Deployment** – Vercel front‑end, Neon DB, CI/CD via GitHub Actions.

> **नोट:** The ERP is built for Indian B2B apparel workflow – from sourcing → inventory → CRM → sales → dispatch → accounts.

---

## 2️⃣ Operational Philosophy
> **"sahi product lao, sahi rate pe lo, sahi price pe becho, aur right buyer tak sahi time pe pahunchao."**

The system enforces this mantra through:
- **Quality Control** – QC module tags every batch.
- **Rate Optimization** – Pricing engine suggests optimal margins.
- **CRM Intelligence** – 360° customer view for perfect matches.
- **Logistics Scheduler** – Auto‑assigns delivery windows.

---

## 3️⃣ Department Management & RBAC
- **Create / Edit Employees** – `Admin → Users & RBAC → Add Employee`.
- **Roles & Permissions** – Pre‑defined per department (Purchase, QC, Pricing, …). Override permissions per staff if required.
- **Block / Unblock** – Instant session revocation.
- **Audit Log** – Every admin action recorded – view under `Admin → Audit Logs`.

### Quick Commands (CLI)
```bash
# List all departments
npx prisma db seed --preview-feature
# Add a new user (example)
node scripts/add-user.js --email alice@example.com --dept sales
```

---

## 4️⃣ GST Verification Workflow
1. **Enter GSTIN** in the supplier or buyer form.
2. System calls **GST Portal API** → CAPTCHA handling → verification.
3. If **ACTIVE**, GST details are saved and can be used for invoicing.
4. If **INACTIVE**, the invoice button is disabled and a warning is shown.

> **⚠️ Mistake:** Trying to generate an invoice with an inactive GSTIN will abort the transaction.

---

## 5️⃣ CRM Memory Brain
- **Customer Timeline** – All interactions, notes, payments displayed chronologically.
- **AI‑Ready Hooks** – Future integration point for recommendation engines.
- **Notes & Pins** – Important follow‑up items can be pinned for visibility.

---

## 6️⃣ Order & Stock Management
1. **Create Order** – Select buyer, add items, system auto‑calculates GST & taxes.
2. **Stock Allocation** – Real‑time inventory check; if insufficient, system suggests alternative batches.
3. **Dispatch** – Choose carrier, set expected delivery date, generate dispatch note.
4. **Invoice Generation** – Auto‑filled with GST info, printable PDF.

---

## 7️⃣ Analytics & Reporting
- **Dashboards** – Sales funnel, inventory turnover, GST compliance heatmap.
- **Export** – CSV/Excel download from each dashboard.
- **Custom Queries** – Use Prisma Studio for ad‑hoc data inspection.

---

## 8️⃣ Deployment & Backup
- **Vercel** – Connect GitHub repo; environment variables set in Vercel dashboard.
- **Neon** – Automatic backups; manual `pg_dump` can be scheduled via a cron job.
- **CI/CD** – GitHub Actions run lint, type‑check, Playwright E2E on every PR.

### Backup Routine (example)
```bash
# Daily dump
pg_dump $DATABASE_URL > backups/$(date +%F).sql
# Retain last 30 days
find backups/ -type f -mtime +30 -delete
```

---

## 9️⃣ Troubleshooting Checklist
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Login fails (invalid token) | JWT secret mismatch | Verify `JWT_SECRET` in `.env` and Vercel env |
| GST verification stuck | CAPTCHA service down | Check external API status, retry later |
| Stock not updating | Prisma schema out‑of‑sync | Run `npx prisma generate` and migrate |
| UI components not loading | Tailwind purge config | Ensure `tailwind.config.js` includes all pages |

---

## 🔟 Future AI Scaling
- **Buyer Intent Prediction** – Feed CRM interaction data into a ML model.
- **Automated Follow‑up Bots** – Use OpenAI API to draft follow‑up emails.
- **Dynamic Pricing Engine** – Real‑time market price feed integration.

---

## 📚 Appendix
- **MASTER‑ENGINEERING‑CONTEXT.md** – Reference for architecture decisions.
- **API Docs** – `src/app/api/` folder contains OpenAPI‑style comments.
- **Glossary** – B2B, GST, PO, SKU, etc.

---

*Prepared for the Founder/Administrator – your single source of truth for mastering Prime Apparel ERP.*
