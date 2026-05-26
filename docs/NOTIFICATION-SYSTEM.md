# PRIME APPAREL EXPORTS: Internal Notification System

This runbook documents the architecture, database models, and department-specific routing keys governing the **Internal Notification System** inside the B2B ERP.

---

## 💾 Database Schema Model

All department tasks, approvals, and alert dispatches are logged persistently inside the `Notification` table:

```prisma
model Notification {
  notification_id Int      @id @default(autoincrement())
  type            String   // low_stock, overdue_payment, new_lead, dispatch_due, order_received, lead_followup_reminder
  message         String
  linked_to_id    String?  // order_id, buyer_id, lead_id, sku_id
  status          String   @default("unread") // unread, read
  created_at      DateTime @default(now())
  for_role        String   @default("SALES") // TARGET DEPARTMENT ROLE
}
```

---

## 🚥 Notification Types & Event Routing Keys

Notifications are dispatched automatically by business triggers and routed directly to a specific department based on their designated `for_role` key:

| Event Type | Routing Key (`for_role`) | Description / Automated Message Template |
| :--- | :--- | :--- |
| **`low_stock`** | `INVENTORY` / `PURCHASE` | Dispatched when product pieces fall below 10: *“Stock low: SKU-ID — only N pieces left”*. |
| **`new_lead`** | `MARKETING` / `SALES` | Dispatched when a hot lead scores above 75: *“🔥 New HOT Lead! Name: X, City: Y, Score: Z/100”*. |
| **`dispatch_due`** | `LOGISTICS` | Dispatched when an order transitions to `qc_ok` or `packed`: *“Order Order-ID cleared QC. Logistics, proceed with packing.”* |
| **`overdue_payment`** | `ACCOUNTS` | Dispatched when unpaid orders mature beyond the credit days: *“Order Order-ID has matured. Verify pending balance payments.”* |
| **`order_received`** | `ACCOUNTS` / `SALES` | Dispatched when orders are delivered successfully: *“🎉 Order Order-ID delivered. Ledger profit logs ready for audit.”* |
| **`lead_followup_reminder`** | `SALES` / `FIELD_BOY` | Dispatched during warm lead transitions: *“Lead Lead-ID warm_followup. Initiate follow-up phone call.”* |

---

## 🖥️ Live Dashboard Hub Rendering

The B2B ERP Dashboard fetches live alerts from the database dynamically on the server:
- Only displays alerts mapped to the user's active role:
  ```typescript
  const roleNotifications = await db.notification.findMany({
    where: { for_role: activeRole },
    orderBy: { created_at: "desc" },
    take: 5
  });
  ```
- Renders an interactive count indicator in the top header.
- Features beautiful alert panels inside the workspace with customized icons and styling.
