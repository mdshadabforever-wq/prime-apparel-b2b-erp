# PRIME APPAREL EXPORTS:Granular RBAC System Architecture

This runbook defines the security permissions and route-level access rules for the **Granular Role-Based Access Control (RBAC) System** governing the Prime Apparel wholesale operating OS.

---

## 👥 Department Role Matrix

The platform is structured into **12 isolated operational roles** ensuring maximum compliance, clear division of labor, and strict departmental isolation.

| Department Role | Permission Scope | Allowed Admin Route Prefixes |
| :--- | :--- | :--- |
| **Founder / Admin** | Unrestricted Full Access | Full access to all `/admin` routes |
| **Purchase** | Supplier management, PO creation, basic stocks | `/admin/stock`, `/admin/orders` |
| **Inventory / QC** | Physical stock entry, QA grading, reserves checks | `/admin/stock`, `/admin/orders` |
| **Pricing** | Costing analysis, margin optimization, price locking | `/admin/stock`, exact `/admin` |
| **Content** | Media uploads (photo/video), catalog descriptions | `/admin/stock`, `/admin/whatsapp` |
| **Marketing** | Social integrations, CRM outreach campaigns | `/admin/leads`, `/admin/whatsapp`, `/admin/buyers` |
| **Buyer Hunting** | Lead generation, local market directory scraping | `/admin/leads`, `/admin/whatsapp` |
| **Sales** | B2B buyers onboarding, orders processing, manual logs | `/admin/orders`, `/admin/buyers`, `/admin/leads`, `/admin/whatsapp` |
| **Logistics** | Cargo packing, transport carrier bookings, POD checks | `/admin/orders`, `/admin/stock` |
| **Accounts** | Cashflow ledger entries, invoices audits, payouts | `/admin/cashflow`, `/admin/orders` |
| **Technical** | Automation checks, DB poolers health, cron triggers | `/admin/whatsapp`, `/admin/stock`, exact `/admin` |
| **Field Boy** | Local shop address verifications, CoD ledger checklist | `/admin/orders` (Field task portal) |

---

## 🔒 Route Protection Implementation

Granular route protection is enforced full-stack:
1.  **Server-Side Edge Middleware (`src/middleware.ts`)**:
    Inspects JWT auth tokens on every request. If a staff user attempts to view a page outside their department list, they are dynamically redirected back to their designated homepage.
2.  **Sidebar Filtering (`src/app/admin/layout.tsx`)**:
    Client-side navigation dynamically compiles available links based on the active role, completely hiding restricted sections.
3.  **Department Personalization (`src/app/admin/page.tsx`)**:
    The server overview page extracts the active simulated role from request cookies and personalization KPIs, notifications, and checklists.

---

## 🧪 Simulation Mode

The simulator dropdown located inside the B2B dashboard header enables developers and QA auditors to swap between all **12 departments** on the fly. Swapping writes a secure `prime_admin_test_role` cookie, forcing instant server-side page-segmentation updates.
