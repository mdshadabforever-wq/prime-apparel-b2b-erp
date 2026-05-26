# PRIME APPAREL EXPORTS: Stage-Based Workflow Engine

This runbook documents the architecture, database integrations, and transitional rules governing the stage-based **State-Machine Workflow Engine** inside the B2B ERP.

---

## ⚙️ Core State Machines & Allowed Transitions

The platform tracks the operational journey of products, leads, and orders through granular status progressions. Unlawful backward updates are strictly blocked by validation rules.

```mermaid
stateDiagram-Group
    [*] --> RESEARCH
    RESEARCH --> PURCHASE
    PURCHASE --> STOCK_ENTRY
    STOCK_ENTRY --> QC
    QC --> PRICING
    QC --> STOCK_ENTRY : Adjustment
    PRICING --> PHOTOSHOOT
    PHOTOSHOOT --> SOCIAL_LISTING
    SOCIAL_LISTING --> available
    available --> discontinued
```

### 1. Product Lifecycle
- **Stages**: `RESEARCH` → `PURCHASE` → `STOCK_ENTRY` → `QC` → `PRICING` → `PHOTOSHOOT` → `SOCIAL_LISTING` → `available` → `discontinued`

### 2. Lead CRM Pipeline
- **Stages**: `new` → `contacted` → `interested` → `hunting` → `warm_followup` → `field_visit` → `registered` → `lost`

### 3. Sales Order & Fulfillment Lifecycle
- **Stages**: `confirmed` → `qc_ok` → `packed` → `dispatched` → `delivered` → `cancelled`

### 4. Billing Payment Maturation
- **Stages**: `pending` → `partial` → `paid` → `overdue`

---

## 🛠️ API & Database Integration

### 1. Transitional Controller (`src/lib/workflow.ts`)
Operational stages flow through a single transaction point:
```typescript
import { transitionStatus } from "@/lib/workflow";

// Triggers database update, records audit trail, and generates handoff notifications
await transitionStatus("order", "20260524-001", "qc_ok", "Pooja Patel", "Stitching clean");
```

### 2. HTTP POST API Endpoint (`/api/admin/workflow`)
External scripts, AI agents, and integrations can trigger transitions securely by dispatching a JSON request:
```json
{
  "entityType": "order",
  "entityId": "20260524-001",
  "newStatus": "packed",
  "operatorName": "Warehouse Staff",
  "comment": "Double packed in cardboard cartons"
}
```

---

## 📝 Activity & Audit Trail Tracking

Every stage transition writes an entry into the database `AuditLog` table containing:
1.  **`user_name`**: Name of the staff operator or AI sub-agent.
2.  **`action`**: Formatted trigger key (e.g. `WORKFLOW_ORDER_STAGE_CHANGE`).
3.  **`description`**: Comprehensive change report detailing the old status, new status, and custom comment.
4.  **`linked_id`**: Associated product SKU, order ID, or lead mobile.
