import { db } from "./db";

// -------------------------------------------------------------------------
// 1. STATE DEFINITIONS & MOVEMENT RULES
// -------------------------------------------------------------------------

export const PRODUCT_STAGES = [
  "RESEARCH",
  "PURCHASE",
  "STOCK_ENTRY",
  "QC",
  "PRICING",
  "PHOTOSHOOT",
  "SOCIAL_LISTING",
  "available" // compat with standard available status
] as const;

export const LEAD_STAGES = [
  "new",
  "contacted",
  "interested",
  "hunting",
  "warm_followup",
  "field_visit",
  "registered",
  "lost"
] as const;

export const ORDER_STAGES = [
  "confirmed",
  "qc_ok",
  "packed",
  "dispatched",
  "delivered",
  "cancelled"
] as const;

export const PAYMENT_STAGES = [
  "pending",
  "partial",
  "paid",
  "overdue"
] as const;

// Valid forward-only transitions map to maintain strict operational integrity
const VALID_TRANSITIONS: Record<string, string[]> = {
  // Product stages
  RESEARCH: ["PURCHASE", "discontinued"],
  PURCHASE: ["STOCK_ENTRY", "discontinued"],
  STOCK_ENTRY: ["QC", "discontinued"],
  QC: ["PRICING", "STOCK_ENTRY"], // Can go back to stock entry for adjustments
  PRICING: ["PHOTOSHOOT", "QC"],
  PHOTOSHOOT: ["SOCIAL_LISTING", "PRICING"],
  SOCIAL_LISTING: ["available", "discontinued"],
  available: ["discontinued"],

  // Lead stages
  new: ["contacted", "hunting", "lost"],
  contacted: ["interested", "warm_followup", "lost"],
  interested: ["warm_followup", "field_visit", "registered", "lost"],
  hunting: ["contacted", "warm_followup", "lost"],
  warm_followup: ["field_visit", "registered", "lost"],
  field_visit: ["registered", "lost"],
  registered: [],
  lost: ["new", "hunting"],

  // Order stages
  confirmed: ["qc_ok", "cancelled"],
  qc_ok: ["packed", "cancelled"],
  packed: ["dispatched", "cancelled"],
  dispatched: ["delivered", "cancelled"],
  delivered: [],
  cancelled: []
};

// -------------------------------------------------------------------------
// 2. DEPARTMENT NOTIFICATION TARGETING ROUTER
// -------------------------------------------------------------------------

export interface HandoffNotification {
  forRole: string;
  type: string;
  message: string;
}

/**
 * Resolves the automated inter-department notifications and handoff targets
 */
export function getHandoffTriggers(
  entityType: "product" | "lead" | "order" | "payment",
  entityId: string,
  newStatus: string
): HandoffNotification[] {
  const triggers: HandoffNotification[] = [];

  if (entityType === "product") {
    if (newStatus === "PURCHASE") {
      triggers.push({
        forRole: "INVENTORY",
        type: "low_stock",
        message: `📦 Product ${entityId} purchased. Inventory team, prepare warehouse for Stock Entry.`
      });
    } else if (newStatus === "STOCK_ENTRY") {
      triggers.push({
        forRole: "QC",
        type: "low_stock",
        message: `🔍 Stock entered for ${entityId}. QC team, pending physical quality inspections.`
      });
    } else if (newStatus === "QC") {
      triggers.push({
        forRole: "PRICING",
        type: "low_stock",
        message: `💰 QC completed for product ${entityId}. Pricing team, pending landed cost and retail pricing.`
      });
    } else if (newStatus === "PRICING") {
      triggers.push({
        forRole: "CONTENT",
        type: "low_stock",
        message: `📸 Pricing complete for ${entityId}. Content team, pending photoshoot and model catalog preparation.`
      });
    } else if (newStatus === "PHOTOSHOOT") {
      triggers.push({
        forRole: "MARKETING",
        type: "low_stock",
        message: `📢 Photoshoot ready for ${entityId}. Marketing team, prepare social listing campaigns.`
      });
      triggers.push({
        forRole: "SALES",
        type: "low_stock",
        message: `✨ New catalog stock ready: ${entityId}. Sales team, initiate warm outreach.`
      });
    }
  }

  if (entityType === "lead") {
    if (newStatus === "warm_followup") {
      triggers.push({
        forRole: "SALES",
        type: "lead_followup_reminder",
        message: `🔥 Lead ${entityId} transitioned to WARM_FOLLOWUP. Initiate follow-up call.`
      });
    } else if (newStatus === "field_visit") {
      triggers.push({
        forRole: "FIELD_BOY",
        type: "lead_followup_reminder",
        message: `📍 Field visit scheduled for Lead ${entityId}. Field agent, review shop address details.`
      });
    }
  }

  if (entityType === "order") {
    if (newStatus === "qc_ok") {
      triggers.push({
        forRole: "LOGISTICS",
        type: "dispatch_due",
        message: `📦 Order ${entityId} cleared QC. Logistics, proceed with packing and shipment routing.`
      });
    } else if (newStatus === "dispatched") {
      triggers.push({
        forRole: "ACCOUNTS",
        type: "overdue_payment",
        message: `💳 Order ${entityId} has been dispatched. Accounts, verify pending balance payments.`
      });
    } else if (newStatus === "delivered") {
      triggers.push({
        forRole: "ACCOUNTS",
        type: "order_received",
        message: `🎉 Order ${entityId} delivered successfully. Ledger margin and profit logs ready for audit.`
      });
    }
  }

  return triggers;
}

// -------------------------------------------------------------------------
// 3. CORE STATE TRANSITION FUNCTION
// -------------------------------------------------------------------------

export interface TransitionResult {
  success: boolean;
  message: string;
  oldStatus: string;
  newStatus: string;
}

/**
 * Transitions the status of a specific ERP record, validating transitions,
 * logging audit logs, and dispatching targeted inter-department notifications.
 */
export async function transitionStatus(
  entityType: "product" | "lead" | "order" | "payment",
  entityId: string,
  newStatus: string,
  operatorName: string,
  comment: string = ""
): Promise<TransitionResult> {
  let oldStatus = "";

  try {
    // A. FETCH CURRENT STATUS & UPDATE RECORD
    if (entityType === "product") {
      const product = await db.product.findUnique({ where: { sku_id: entityId } });
      if (!product) throw new Error(`Product ${entityId} not found`);
      oldStatus = product.status;
    } else if (entityType === "lead") {
      const lead = await db.lead.findUnique({ where: { mobile: entityId } });
      if (!lead) throw new Error(`Lead with mobile ${entityId} not found`);
      oldStatus = lead.status;
    } else if (entityType === "order") {
      const order = await db.salesOrder.findUnique({ where: { order_id: entityId } });
      if (!order) throw new Error(`Sales Order ${entityId} not found`);
      oldStatus = order.order_status;
    } else if (entityType === "payment") {
      const order = await db.salesOrder.findUnique({ where: { order_id: entityId } });
      if (!order) throw new Error(`Sales Order ${entityId} not found`);
      oldStatus = order.payment_status;
    }

    // B. VALIDATE TRANSITION — Enforce VALID_TRANSITIONS map
    const allowedNextStates = VALID_TRANSITIONS[oldStatus];
    if (allowedNextStates !== undefined && !allowedNextStates.includes(newStatus)) {
      return {
        success: false,
        message: `Invalid transition: '${oldStatus}' → '${newStatus}' is not allowed for ${entityType}. Allowed: [${allowedNextStates.join(", ")}]`,
        oldStatus,
        newStatus
      };
    }

    // C. PERFORM STATUS UPDATE IN DB
    if (entityType === "product") {
      await db.product.update({
        where: { sku_id: entityId },
        data: { status: newStatus }
      });
    } else if (entityType === "lead") {
      await db.lead.update({
        where: { mobile: entityId },
        data: { status: newStatus, last_contact_date: new Date() }
      });
    } else if (entityType === "order") {
      await db.salesOrder.update({
        where: { order_id: entityId },
        data: { order_status: newStatus }
      });
    } else if (entityType === "payment") {
      await db.salesOrder.update({
        where: { order_id: entityId },
        data: { payment_status: newStatus }
      });
    }

    // D. LOG TO AUDIT LOG TABLE
    const transitionDesc = `Transitional change for ${entityType} ${entityId} from '${oldStatus}' to '${newStatus}'. Operator: ${operatorName}. Notes: ${comment}`;
    await db.auditLog.create({
      data: {
        user_name: operatorName,
        action: `WORKFLOW_${entityType.toUpperCase()}_STAGE_CHANGE`,
        description: transitionDesc,
        linked_id: entityId
      }
    });

    // E. DISPATCH INTER-DEPARTMENT HANDOFF NOTIFICATIONS
    const triggers = getHandoffTriggers(entityType, entityId, newStatus);
    for (const trig of triggers) {
      await db.notification.create({
        data: {
          type: trig.type,
          message: trig.message,
          linked_to_id: entityId,
          for_role: trig.forRole,
          status: "unread"
        }
      });
    }

    return {
      success: true,
      message: `Successfully transitioned ${entityType} ${entityId} to '${newStatus}'`,
      oldStatus,
      newStatus
    };

  } catch (error: any) {
    console.error("Workflow transition error:", error);
    return {
      success: false,
      message: `Failed to transition: ${error.message}`,
      oldStatus,
      newStatus
    };
  }
}
