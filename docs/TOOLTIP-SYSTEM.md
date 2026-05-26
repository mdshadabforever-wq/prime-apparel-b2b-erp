# Prime B2B ERP: Professional Tooltip & Guided UX System

This document outlines the architecture, implementation guidelines, and API of the global, high-performance reusable **Tooltip UX System** integrated across the Prime Apparel B2B ERP.

---

## 1. Design & Core Philosophy

The Tooltip System is designed to make the comprehensive, department-segmented B2B ERP accessible to non-technical operational and logistics staff. It delivers dynamic business intelligence descriptions, warning contexts, and quick summaries without cluttering the premium dark glassmorphism interface.

### Premium Aesthetic & Performance
- **Zero Third-Party Dependencies**: Crafted entirely in vanilla React and Tailwind CSS to guarantee maximum rendering speeds and compatibility with edge routing.
- **Glassmorphism Styling**: Built with a sleek dark-glass backdrop (`bg-slate-900/95`, `backdrop-blur-md`, `border-white/10`) and gold accents (`text-slate-200`) to align with the core ERP theme.
- **Natural Delays**: Implements a `200ms` hover trigger delay to avoid visual clutter during fast mouse sweeps.
- **Mobile-First Touch Fallback**: Includes binding triggers (`onTouchStart`, `onTouchEnd` with a 1.5s persistent timer) to ensure tooltips behave seamlessly on tablets and mobile screens.
- **Accessible & Screen-Reader Safe**: Employs correct WAI-ARIA roles (`role="tooltip"`) and focus triggers (`onFocus`, `onBlur`) for full keyboard navigation support.

---

## 2. Tooltip API Reference

The global Tooltip component is located at:
📁 `src/components/ui/Tooltip.tsx`

```tsx
import { Tooltip } from "@/components/ui/Tooltip";
```

### Properties (Props)

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `content` | `string` | *Required* | The text description or business meaning displayed inside the bubble. |
| `children` | `React.ReactNode` | *Required* | The target interactive control, button, badge, card, or element being wrapped. |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Preferred relative position of the tooltip bubble. |
| `delay` | `number` | `200` | Delay threshold (in milliseconds) before the tooltip is triggered visible. |
| `className` | `string` | `'inline-block'` | Container wrapping class. Use `'w-full'` or `'block'` when wrapping cards inside grids. |

---

## 3. Integration Catalog

The Tooltip system has been thoroughly applied to key operational areas:

### 1. Global Navigation Layout (`src/app/admin/layout.tsx`)
- **Sidebar Links**: Wraps each department portal link to explain access controls and quick keyboard shortcuts (e.g. `⌥S` for Sales Orders).
- **Simulated Role Selector**: Highlights Simulated Role permissions so testers know exactly which branches they are currently simulating.

### 2. Main Executive Overview (`src/app/admin/page.tsx`)
- **Action buttons**: Wraps quick actions like *Force DB Sync*, *WhatsApp Ping*, *Clear Cache*, and *Export Inventory*.
- **Departmental KPI Metrics**: Wraps all KPI metric grids to explain the mathematical sourcing logic (e.g., Landed cost margin formulas).

### 3. Orders Management Ledger (`src/app/admin/orders/page.tsx`)
- **KPI Metrics Cards**: Total POs, Gross Revenue, Active Dispatches, and receivables collection schedules.
- **Payment & Order Status Badges**: Explains the commercial credit meaning of states like *Overdue*, *Partial*, and *Dispatched*.
- **Order Action Controls**:
  - *Split Invoice*: Explains parent-child B2B split accounting logic.
  - *Pack, Dispatch, Deliver, Pay, Cancel*: Details logistics and ledger adjustments.

### 4. Stock & SKU Master Ledger (`src/app/admin/stock/page.tsx`)
- **Bulk CSV actions**: Guides warehouse managers through import and export catalog sheets.
- **Quick Filters**: Highlights *Low Stock* threshold alerts (<10 pcs) and *Dead Stock* sorting indicators.
- **Pricing Matrices**: Explains the differences between *Wholesale Standard rates*, *Sourcing Landed Costs*, and *Gross Margins*.

### 5. WhatsApp Sandbox Hub (`src/app/admin/whatsapp/page.tsx`)
- **Scorecard Quality Index**: AI scoring details.
- **Automation Bots**: Differentiates between automatic AI agent webhook replies versus manual human representative overrides.
- **Fast templates**: Outlines the dispatch carrier and Lorry Receipt (LR) tracking updates.

### 6. Business Intelligence & Analytics (`src/app/admin/analytics/page.tsx`)
- **Receivables Aging Schedule**: Explains maturity buckets (*0-7 days Current*, *8-30 days Credit terms*, *30+ days High-risk Overdue*).
- **Profitability Metrics**: Details wholesale margins vs Surat supplier landed cost assets.

---

## 4. Maintenance & Expansion Guidelines

To extend tooltips to any new buttons or cards, simply wrap the element inside the `<Tooltip>` wrapper:

```tsx
import { Tooltip } from "@/components/ui/Tooltip";

// 1. Wrapping an action control button
<Tooltip content="Instantly download wholesale pricing sheet PDF." position="top">
  <button className="btn-primary">Download Sheet</button>
</Tooltip>

// 2. Wrapping a grid KPI metric card (Note the className="w-full" assignment)
<Tooltip content="Total counts of leads acquired." position="top" className="w-full">
  <div className="card h-full">
    <h3>Leads Count</h3>
    <p>4,120</p>
  </div>
</Tooltip>
```
