# Current Architecture: Prime Apparel B2B ERP

This document details the software architecture, database design, routing security model, and WhatsApp automation engine powering the Prime Apparel B2B ERP.

---

## 🏛 Software Architecture Overview

The system is built on a modern **Next.js (App Router)** stack featuring a **SQLite** database, **Prisma ORM**, and client-side page rendering leveraging Tailwind CSS and Framer Motion.

```mermaid
graph TD
    Client[Web Browser] -->|HTTP Requests| Middleware[Next.js Edge Middleware]
    Middleware -->|Protected Routes| AdminPage[Admin Workspace /admin]
    Middleware -->|Protected Routes| CatalogPage[Wholesale Catalog /catalog]
    Middleware -->|Public Routes| LoginPage[Unified Login /login]
    Middleware -->|Public Routes| RegisterPage[B2B Onboarding Wizard /register]
    
    AdminPage -->|API Calls| APIOrders[API /api/orders]
    AdminPage -->|API Calls| APICashflow[API /api/cashflow]
    AdminPage -->|API Calls| APIBuyers[API /api/buyers]
    AdminPage -->|API Calls| APILeads[API /api/leads]
    
    CatalogPage -->|API Calls| APIProducts[API /api/products]
    
    APIOrders -->|Prisma client| SQLite[(SQLite dev.db)]
    APICashflow -->|Prisma client| SQLite
    APIBuyers -->|Prisma client| SQLite
    APILeads -->|Prisma client| SQLite
    APIProducts -->|Prisma client| SQLite
    
    WhatsAppBotSim[WhatsApp Sandbox Simulator] -->|Webhook POST| APIWhatsApp[API /api/whatsapp]
    APIWhatsApp -->|Parse FAQ / Escalations| SQLite
```

---

## 🔒 Route Authorization & Role Access Control

Authentication uses **JWT Token Authorization** stored in HTTP-Only cookies (`auth_token`). Next.js Edge Middleware (`src/middleware.ts`) runs on every routing cycle to securely protect paths.

### Middleware Decoding Flow
1. **Extraction:** Looks up cookie `auth_token`.
2. **Safe Edge Decoding:** Decodes the token’s base64 payload safely in the Edge Runtime (without external node crypto dependencies) using `atob()`.
3. **Role Checks:**
  * **Staff Routes (`/admin/*`):** Decoded role must belong to `["ADMIN", "FOUNDER", "SALES", "INVENTORY", "ACCOUNTS", "CONTENT"]`. If the role is `BUYER`, the user is immediately redirected to the buyer portal `/catalog`. If no token exists, the user is redirected to `/login`.
  * **Auth Routes (`/login`, `/register`):** Prevents logged-in users from accessing credentials wizards. Staff are redirected to `/admin`, and buyers are redirected to `/catalog`.

---

## 💾 Database Schema Design

The SQLite database (`prisma/schema.prisma`) holds **10 primary models** with robust relationships:

```mermaid
erDiagram
    BUYER ||--o{ SALES_ORDER : places
    BUYER ||--o{ WHATSAPP_LOG : receives
    SUPPLIER ||--o{ PRODUCT : supplies
    SUPPLIER ||--o{ PURCHASE_ORDER : receives
    PURCHASE_ORDER ||--o{ CASHFLOW : records
    SALES_ORDER ||--o{ CASHFLOW : records
    LEAD ||--o{ WHATSAPP_LOG : logs
```

### Models Detail
1. **`Buyer`**: Stores WhatsApp mobile (primary identifier), passwords, shop name, dynamic qualification score (0-100), lead tier (HOT, WARM, COLD), credit limits, and purchase statistics.
2. **`Product`**: Sourcing SKU master (standard price, bulk pricing tiers, physical weight/lengths, and reserved vs available stock levels).
3. **`Supplier`**: Sourcing nodes (mainly Surat factories) rating specialities and written terms status.
4. **`SalesOrder`**: Confirmed customer sales, LR transport numbers, dispatch status, payment status (paid, overdue, pending), and B2B pricing totals.
5. **`PurchaseOrder`**: Wholesale manufacturing orders to Surat, tracking GRN and QC flags.
6. **`CashFlow`**: Ledger tracking revenues and operating expenses (salary, rent, freight, marketing).
7. **`Lead`**: CRM capture cards tracking temperature grades and onboarding acquisition logs.
8. **`Staff`**: System operators role-mapped to access tokens.
9. **`WhatsAppLog`**: Conversations historical transcripts.
10. **`Notification`**: Broadcast items for internal roles (e.g. low stock alerts, overdue invoices).

---

## 🤖 WhatsApp Chatbot FAQ & Escalation Flow

The WhatsApp simulation endpoint (`/api/whatsapp` calling `src/lib/whatsapp.ts`) runs a hybrid AI match router.

```mermaid
graph TD
    Incoming[Incoming Message] --> Normalize[Clean & Lowercase Text]
    Normalize --> FAQMatch[Check FAQ Confidence via Keyword Blends]
    
    FAQMatch -->|Confidence > 50%| ReturnFAQ[Send Auto Hinglist Reply]
    FAQMatch -->|Confidence < 50% / Help requested| Escalate[Trigger Human Escalation]
    
    Escalate --> UpdateLead[Set Lead Status to contacted &HandledBy to human]
    UpdateLead --> NotifyStaff[Generate Notification for SALES Role]
    NotifyStaff --> ReturnConfirm[Send Forwarding Confirmation to Buyer]
```

### Supported FAQ Keywords
* **MOQ:** "Minimum 12 pieces per design"
* **Fabrics:** "Cambric Cotton, Heavy Rayon, Georgette, Crape"
* **Shipping:** "Surat dispatch, 3-7 days via V-Trans/Logistics"
* **Return Policy:** "Damage/weaving defects exchange within 7 days with parcel opening video"
* **Address:** "Ring Road, Surat, Gujarat"
