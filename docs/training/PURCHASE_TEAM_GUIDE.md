# Purchase Team Guide

## 📌 Department Purpose
- **Responsibility:** Manage supplier relationships, create purchase orders (PO), negotiate rates.
- **Goal:** Ensure raw material availability at optimal cost.
- **Business Importance:** Direct impact on production lead‑time and cost of goods sold.

## 🔐 Login Instructions
1. Open the ERP URL (e.g., `https://prime‑apparel.vercel.app`).
2. Click **Login** → enter your corporate email and password.
3. After authentication you will land on the **Purchase Dashboard**.
4. Your role will be `PURCHASE_TEAM` – only purchase‑related menus are visible.

## 📅 Daily Workflow
1. **Check Supplier Requests** – Navigate to **Suppliers → Requests**.
2. **Create PO** – Click **New Purchase Order**, fill:
   - Supplier (search by name or GSTIN)
   - Item SKUs, quantities, expected delivery dates.
   - System auto‑calculates GST (if supplier GST is ACTIVE).
3. **Approve PO** – Click **Approve**; an email is sent to the supplier.
4. **Track Delivery** – Monitor **PO Status** (Pending → In‑Transit → Received).
5. **Receive Stock** – On arrival, open **Stock Intake**, select PO, verify quantities, add batch numbers.
6. **Quality Check** – Trigger QC module (auto‑opens after intake).
7. **Close PO** – Mark as **Completed**; inventory is updated.

### UI Walkthrough (Screenshots)
![Purchase Dashboard](/artifacts/training/purchase_dashboard.png)
![New PO Form](/artifacts/training/new_po_form.png)

## 🛠️ Real‑Life Example
**Scenario:** Need 500 meters of cotton fabric.
- Search supplier "ABC Textiles" → GST verified.
- Create PO #12345 with 500m, deadline 7 days.
- Approve → supplier confirms receipt.
- On day 5, receive partial 300m, log intake, QC flags 5% defect.
- Adjust PO, receive remaining 200m, close PO.

## 🚫 Mistakes To Avoid
- **Duplicate PO** – Always search existing PO numbers before creating a new one.
- **Wrong GSTIN** – Verify supplier GST status; an inactive GST blocks PO creation.
- **Incorrect Quantity** – Double‑check units (meters vs. kilograms).

## ✅ SOP Checklist (Daily)
- [ ] Review pending supplier requests.
- [ ] Verify all active GST numbers.
- [ ] Update PO status column.
- [ ] Perform daily stock intake audit.
- [ ] Log any QC failures.

## 📞 Escalation Flow
- **Supplier issues** → Contact **Accounts** for payment queries.
- **GST verification failure** → Alert **Technical Team** to check API.
- **Critical stock shortage** → Notify **Founder** via admin alert.

---
*Prepared for the Purchase Team – Hindi/English mix for easy understanding.*
