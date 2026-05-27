# Logistics Team Guide

## 📌 Department Purpose
- **Responsibility:** Plan and execute shipment of finished goods, manage carriers, track deliveries.
- **Goal:** Ensure timely, cost‑effective delivery to buyers.
- **Business Importance:** Direct impact on customer satisfaction and cash‑flow (on‑time payment).

## 🔐 Login Instructions
1. Open the ERP URL and sign in.
2. After authentication you land on the **Logistics Dashboard**.
3. Role `LOGISTICS_TEAM` shows only shipment, carrier, and delivery‑tracking menus.

## 📅 Daily Workflow
1. **View Pending Dispatches** – Navigate to **Logistics → Dispatch Queue**.
2. **Assign Carrier** – Click **Assign**, choose a carrier (e‑courier, truck, rail).
3. **Generate Dispatch Note** – System creates a printable PDF with order details, addresses, and barcode.
4. **Update Status** – As goods leave warehouse, mark **Shipped**; once delivered, mark **Delivered**.
5. **Track GPS** – If carrier provides live tracking, embed link in the order.
6. **Report Exceptions** – For failed deliveries, open **Exception Form** with reason and next steps.

### UI Walkthrough (Screenshots)
![Logistics Dashboard](/artifacts/training/logistics_dashboard.png)
![Dispatch Note](/artifacts/training/dispatch_note.png)

## 🛠️ Real‑Life Example
- Order #SO‑2026‑045 ready for shipment.
- Assign carrier **BlueExpress**, schedule pickup tomorrow.
- Generate dispatch note, print, attach to package.
- After 2 days, carrier updates status to **Delivered**; system logs proof of delivery.

## 🚫 Mistakes To Avoid
- **Wrong carrier selection** – may increase cost or delay.
- **Missing address verification** – leads to failed delivery.
- **Not updating status** – creates inventory discrepancies.

## ✅ SOP Checklist (Daily)
- [ ] Review Dispatch Queue.
- [ ] Verify shipping addresses.
- [ ] Assign carriers and generate dispatch notes.
- [ ] Update shipment status throughout transit.
- [ ] Log any exceptions and notify Founder if needed.

## 📞 Escalation Flow
- **Carrier issue** → Contact **Technical Team** for integration.
- **Failed delivery** → Alert **Accounts Team** for possible reimbursement.
- **Urgent shipment** → Notify **Founder/Admin**.

---
*Prepared for the Logistics Team – Hindi/English mixed for easy comprehension.*
