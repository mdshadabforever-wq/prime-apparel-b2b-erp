# Prime Apparel ERP

![Prime Apparel ERP Logo](https://raw.githubusercontent.com/mdshadabforever-wq/prime-apparel-b2b-erp/main/assets/logo.png)

---

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-brightgreen)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13.5.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.10-purple)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791)](https://neon.tech/)
[![Playwright](https://img.shields.io/badge/Playwright-1.38-orange)](https://playwright.dev/)

</div>

---

## 1️⃣ Project Introduction

**Prime Apparel ERP** is a full‑stack, AI‑enhanced Enterprise Resource Planning system tailored for Indian B2B apparel manufacturers and distributors. It orchestrates the end‑to‑end workflow:

1. **Sourcing & Procurement** – Manage buyers, suppliers, and purchase orders.
2. **Inventory & Stock** – Real‑time stock levels, batch tracking, and QC.
3. **Pricing & Invoicing** – Dynamic pricing engine, GST‑validated invoices.
4. **Sales & Dispatch** – Order fulfillment, logistics, and delivery tracking.
5. **Accounts & Finance** – Integrated ledger, GST compliance, and analytics.

The platform unifies these silos under a single, intuitive dashboard, enabling founders & admins to operate **"sahi product lao, sahi rate pe lo, sahi price pe becho, aur right buyer tak sahi time pe pahunchao."**

---

## 2️⃣ Core Business Philosophy

> **"sahi product lao, sahi rate pe lo, sahi price pe becho, aur right buyer tak sahi time pe pahunchao."**

The ERP embeds this mantra at every layer:
- **Product Accuracy** – QC modules enforce quality flags before stock enters the system.
- **Rate Optimization** – Pricing engine leverages historical data & AI suggestions.
- **Sales Excellence** – CRM Memory Brain provides 360° customer insights for perfect matching.
- **Timely Delivery** – Logistics engine auto‑schedules dispatches respecting buyer windows.

---

## 3️⃣ System Features

### 📦 ERP Core
- Inventory tracking with batch & expiry.
- Order management, multi‑warehouse support.
- Dynamic pricing rules & discount structures.
- Automated invoicing with GST validation.
- Integrated logistics & shipment tracking.

### 🧾 GST Compliance System
- Real‑time GSTIN verification against the official portal.
- CAPTCHA handling automation.
- Auto‑fill of GST details on invoices.
- Blocked invoice creation for inactive GST numbers.

### 🧠 CRM Memory Brain
- Customer intelligence dashboard (timeline, notes, payment history).
- AI‑ready architecture for future recommendation engines.
- Follow‑up & task automation.

### 🔐 RBAC & Department Management
- Department‑scoped logins (Purchase, QC, Pricing, Content, Marketing, Sales, Logistics, Accounts, Technical, Field Boy).
- Granular permission matrix with overrides.
- Audit logs for every admin action.
- Session tracking & automatic revocation on block.

### 🛡️ Security
- JWT‑based authentication.
- Middleware route protection per role.
- Comprehensive audit logging.
- Password hashing with `bcrypt`.

### 🧪 Testing
- Playwright E2E suite covering admin workflows, RBAC, GST verification, and CRM memory.
- QA screenshots stored under `artifacts/qa/`.
- Continuous integration ready (GitHub Actions).

---

## 4️⃣ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | **Next.js 13 (App Router)**, **React 18**, **TailwindCSS**, **Inter** fonts |
| Language | **TypeScript** |
| ORM / DB | **Prisma 5** ↔ **PostgreSQL (Neon)** |
| Auth | **JWT**, **bcrypt** |
| Testing | **Playwright**, **jest** |
| CI/CD | **GitHub Actions**, **Vercel** |
| Cloud Storage | **Cloudinary** (media assets) |
| Messaging/AI | **OpenAI** integration (future) |

---

## 5️⃣ System Architecture

```mermaid
flowchart TD
    subgraph Frontend[Next.js Frontend]
        UI[UI Components]
        AuthGuard[Auth Guard]
    end
    subgraph Backend[API Layer]
        A1[Auth API (/api/auth)]
        A2[User Management (/api/admin/users)]
        A3[CRM (/api/crm)]
        A4[GST (/api/gst)]
        A5[Orders (/api/orders)]
    end
    subgraph DB[PostgreSQL (Neon)]
        Staff[Staff]
        User[User]
        Department[Department]
        Role[Role]
        Permission[Permission]
        LoginActivity[LoginActivity]
        UserSession[UserSession]
        Customer[Customer]
        Conversation[Conversation]
        Message[Message]
        GSTInfo[GSTInfo]
    end
    UI --> AuthGuard
    AuthGuard --> A1
    UI --> A2
    UI --> A3
    UI --> A4
    UI --> A5
    A1 --> Staff & User & LoginActivity & UserSession
    A2 --> Staff & User & Department & Role & Permission
    A3 --> Customer & Conversation & Message
    A4 --> GSTInfo
    A5 --> Staff & Customer
    classDef cloud fill:#f0f9ff,stroke:#333,stroke-width:1px;
    class Frontend,Backend,DB cloud;
```

---

## 6️⃣ Database Overview

| Model | Description | Key Relations |
|-------|-------------|---------------|
| **Staff** | Employee profile (name, contact, department). | `departmentId → Department`, `userId → User` |
| **User** | Authentication credentials (email, password hash). | 1‑1 with **Staff** |
| **Department** | Business unit (e.g., Sales, QC, Logistics). | has many **Staff** |
| **Role** | Pre‑defined role presets per department. | many‑to‑many via **StaffRole** |
| **Permission** | Atomic action (e.g., `view_buyers`). | many‑to‑many via **RolePermission** |
| **LoginActivity** | Historical login attempts with IP/UA. | belongs to **User** |
| **UserSession** | Active JWT session records. | belongs to **User** |
| **Customer** | B2B buyer information, GST details. | has many **Conversation**, **Order** |
| **Conversation** | CRM chat thread. | has many **Message** |
| **Message** | Individual chat entry. | belongs to **Conversation** |
| **GSTInfo** | Cached GST verification data. | belongs to **Customer** |

> *All models are defined in `prisma/schema.prisma` and migrated to PostgreSQL.*

---

## 7️⃣ Installation Guide

```bash
# Clone the repo
git clone https://github.com/mdshadabforever-wq/prime-apparel-b2b-erp.git
cd prime-apparel-b2b-erp

# Install dependencies
npm ci

# Configure environment variables (see section 8)
cp .env.example .env
# edit .env with your values

# Initialise PostgreSQL (Neon) and push schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed default RBAC data
node prisma/seed-rbac.js

# Run the development server
npm run dev
```

### Playwright Setup
```bash
# Install browsers (once)
npx playwright install
# Run the full test suite
npx playwright test
```

---

## 8️⃣ Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon). |
| `NEXT_PUBLIC_BASE_URL` | Public URL for API calls (e.g., `https://myapp.vercel.app`). |
| `JWT_SECRET` | Secret used to sign JWT tokens. |
| `CLOUDINARY_URL` | Cloudinary credentials for media uploads. |
| `WHATSAPP_API_KEY` *(future)* | Credentials for WhatsApp Cloud API integration. |
| `GST_PORTAL_URL` | Official GST verification endpoint. |

---

## 9️⃣ Testing Guide

```bash
# Run all E2E tests
npx playwright test
```

- **CRM Memory Flow** – validates customer timeline, AI notes, and payment history.
- **RBAC Lifecycle** – onboarding, role‑based navigation, block/unblock verification.
- **GST Verification** – end‑to‑end GSTIN validation with captcha handling.

Screenshots from the runs are stored under `artifacts/qa/` and referenced in the README.

---

## 🔟 Deployment Guide

1. **Create a Vercel project** linked to the GitHub repo.
2. Set the environment variables in Vercel (see section 8).
3. Vercel will automatically run `npm ci && npm run build`.
4. **Database** – provision a Neon PostgreSQL instance, add its URL to Vercel env.
5. Run migrations on first deploy:
   ```bash
   npx prisma db push
   ```
6. (Optional) Enable **GitHub Actions** for PR linting and Playwright CI.

---

## 📈 Future Roadmap

- **WhatsApp Cloud API** – bi‑directional messaging for lead capture.
- **AI Agents** – automated follow‑up suggestions, buyer‑intent scoring.
- **Analytics Dashboard** – real‑time KPIs, predictive sales forecasting.
- **Mobile Apps** – React Native clients for field staff.
- **Buyer Intelligence AI** – deep‑learning models for demand prediction.

---

## 🤝 Contributing Guide

1. Fork the repository and create a feature branch.
2. Follow the **MASTER‑ENGINEERING‑CONTEXT.md** for architectural conventions.
3. Run `npm run lint` and ensure no lint errors.
4. Write unit / integration tests for new features.
5. Submit a PR. CI will run lint, type‑check, and Playwright tests.

### Code Style
- Use **Inter** font for UI components.
- Keep Tailwind utility classes in `src/styles/` – avoid inline styles.
- All new Prisma models must be added with a migration script and documented.

---

## 📜 License & Disclaimer

`Prime Apparel ERP` is released under the **MIT License**. The software is provided **as‑is** without warranty. Users are responsible for complying with local tax regulations and data‑protection laws.

---

*Empower your apparel business with a truly modern, AI‑ready ERP.*
